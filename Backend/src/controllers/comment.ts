import { Request, Response } from "express";
import { z } from "zod";
import { Types } from "mongoose";
import { asyncHandler, ApiError } from "../utils/asyncHandler";
import { Comment, IComment } from "../models/Comment";
import { Topic } from "../models/Topic";
import { canAccessCourseContent } from "../utils/access";
import { sendMailAsync } from "../mail/mailSender";
import { commentReplyEmail } from "../mail/templates";
import { Course } from "../models/Course";
import { ExistingUser } from "../models/external/ExistingUser";

export const addCommentSchema = z.object({
  text: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});

/** Shape a comment for the client, including the viewer's like state. */
function shape(c: IComment, viewerId?: string) {
  return {
    _id: c._id,
    text: c.text,
    authorName: c.authorNameSnapshot,
    authorModel: c.authorModel,
    authorId: c.authorId,
    parent: c.parent,
    likeCount: c.likes.length,
    likedByMe: viewerId ? c.likes.some((l) => l.toString() === viewerId) : false,
    isPinned: c.isPinned,
    isStarred: c.isStarred,
    isEdited: c.isEdited,
    createdAt: (c as unknown as { createdAt: Date }).createdAt,
  };
}

/** List a topic's comments: pinned first, then newest, each with its replies. */
export const listComments = asyncHandler(async (req: Request, res: Response) => {
  const viewerId = req.auth?.id;
  const topComments = await Comment.find({ topic: req.params.topicId, parent: null })
    .sort({ isPinned: -1, isStarred: -1, createdAt: -1 })
    .lean<IComment[]>();

  const ids = topComments.map((c) => c._id);
  const replies = await Comment.find({ parent: { $in: ids } }).sort({ createdAt: 1 }).lean<IComment[]>();

  const repliesByParent = new Map<string, IComment[]>();
  for (const r of replies) {
    const key = r.parent!.toString();
    if (!repliesByParent.has(key)) repliesByParent.set(key, []);
    repliesByParent.get(key)!.push(r);
  }

  const data = topComments.map((c) => ({
    ...shape(c, viewerId),
    replies: (repliesByParent.get(c._id.toString()) ?? []).map((r) => shape(r, viewerId)),
  }));
  res.json({ success: true, comments: data });
});

/** Add a comment or reply. Enrolled users and admins only. */
export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const { text, parentId } = req.body as z.infer<typeof addCommentSchema>;
  const topic = await Topic.findById(req.params.topicId);
  if (!topic) throw new ApiError(404, "Topic not found");

  const allowed = await canAccessCourseContent(req.auth, topic.course);
  if (!allowed) throw new ApiError(403, "Enrol in this course to comment");

  let parent: IComment | null = null;
  if (parentId) {
    parent = await Comment.findById(parentId);
    if (!parent || parent.parent) throw new ApiError(400, "Invalid parent comment");
  }

  const comment = await Comment.create({
    topic: topic._id,
    course: topic.course,
    authorId: req.auth!.id,
    authorModel: req.auth!.kind === "admin" ? "Admin" : "User",
    authorNameSnapshot: req.auth!.name,
    text,
    parent: parent?._id ?? null,
  });
  await Topic.updateOne({ _id: topic._id }, { $inc: { commentCount: 1 } });

  // Notify the parent comment's author on a reply (only if they're a member with an email).
  if (parent && parent.authorModel === "User" && parent.authorId.toString() !== req.auth!.id) {
    const [author, course] = await Promise.all([
      ExistingUser.findById(parent.authorId).select("email name").lean(),
      Course.findById(topic.course).select("courseName slug").lean(),
    ]);
    if (author?.email && course) {
      const mail = commentReplyEmail(author.name, req.auth!.name, course.courseName, course.slug);
      sendMailAsync(author.email, mail.subject, mail.html);
    }
  }

  res.status(201).json({ success: true, comment: shape(comment, req.auth!.id) });
});

/** Toggle like (enrolled members). */
export const toggleLike = asyncHandler(async (req: Request, res: Response) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new ApiError(404, "Comment not found");
  const allowed = await canAccessCourseContent(req.auth, comment.course);
  if (!allowed) throw new ApiError(403, "Enrol in this course to like comments");

  const uid = new Types.ObjectId(req.auth!.id);
  const liked = comment.likes.some((l) => l.equals(uid));
  await Comment.updateOne(
    { _id: comment._id },
    liked ? { $pull: { likes: uid } } : { $addToSet: { likes: uid } }
  );
  res.json({ success: true, liked: !liked, likeCount: comment.likes.length + (liked ? -1 : 1) });
});

/** Admin: pin/unpin to the top of the topic. */
export const togglePin = asyncHandler(async (req: Request, res: Response) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new ApiError(404, "Comment not found");
  comment.isPinned = !comment.isPinned;
  await comment.save();
  res.json({ success: true, isPinned: comment.isPinned });
});

/** Admin: star/unstar (featured / helpful). */
export const toggleStar = asyncHandler(async (req: Request, res: Response) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new ApiError(404, "Comment not found");
  comment.isStarred = !comment.isStarred;
  await comment.save();
  res.json({ success: true, isStarred: comment.isStarred });
});

/** Author edits their own comment. */
export const editComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new ApiError(404, "Comment not found");
  if (comment.authorId.toString() !== req.auth!.id) throw new ApiError(403, "You can only edit your own comment");
  const text = String(req.body.text ?? "").trim();
  if (!text) throw new ApiError(400, "Comment cannot be empty");
  comment.text = text;
  comment.isEdited = true;
  await comment.save();
  res.json({ success: true, comment: shape(comment, req.auth!.id) });
});

/** Author or any admin deletes a comment (and its replies). */
export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new ApiError(404, "Comment not found");
  const isOwner = comment.authorId.toString() === req.auth!.id;
  if (!isOwner && req.auth!.kind !== "admin") throw new ApiError(403, "Not allowed");

  const replyCount = await Comment.countDocuments({ parent: comment._id });
  await Comment.deleteMany({ parent: comment._id });
  await comment.deleteOne();
  await Topic.updateOne({ _id: comment.topic }, { $inc: { commentCount: -(1 + replyCount) } });

  res.json({ success: true, message: "Comment deleted" });
});
