import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler, ApiError } from "../utils/asyncHandler";
import { Course } from "../models/Course";
import { Enrollment } from "../models/Enrollment";
import { Comment } from "../models/Comment";
import { Test } from "../models/Test";
import { Category } from "../models/Category";
import { ExistingUser } from "../models/external/ExistingUser";
import { OnlinePlatformUser } from "../models/OnlinePlatformUser";
import { UserCategoryProgress } from "../models/UserCategoryProgress";
import { CertificateRecord } from "../models/CertificateRecord";
import { AdminOverrideLog } from "../models/AdminOverrideLog";
import { CourseAccessGrant } from "../models/CourseAccessGrant";
import { getLevels, getOrCreateCategoryProgress, recomputeLevelOnDoc } from "../utils/progression";
import { levelByKey, entryLevel } from "../config/levels";

/** Admin: high-level stats for the dashboard (counts only). */
export const dashboard = asyncHandler(async (_req: Request, res: Response) => {
  const [courses, published, enrollments, comments, tests, members] = await Promise.all([
    Course.countDocuments({}),
    Course.countDocuments({ status: "Published" }),
    Enrollment.countDocuments({ status: "active" }),
    Comment.countDocuments({}),
    Test.countDocuments({}),
    ExistingUser.estimatedDocumentCount(),
  ]);

  const topCourses = await Course.find({})
    .select("courseName slug studentsEnrolledCount status")
    .sort({ studentsEnrolledCount: -1 })
    .limit(5)
    .lean();

  res.json({
    success: true,
    stats: { courses, published, enrollments, comments, tests, members },
    topCourses,
  });
});

/**
 * Admin: list learners — academy members (read-only `users`) AND this app's own platform
 * signups — with enrollment counts and a per-category progression summary. Never mutates
 * the shared users collection; progression lives in this app's own collections.
 */
export const listStudents = asyncHandler(async (req: Request, res: Response) => {
  const search = req.query.search ? String(req.query.search) : "";
  const searchOr = search
    ? [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }]
    : undefined;

  const memberFilter: Record<string, unknown> = { isDeleted: { $ne: true } };
  if (searchOr) memberFilter.$or = searchOr;
  const platformFilter: Record<string, unknown> = {};
  if (searchOr) platformFilter.$or = searchOr;

  const [members, platform] = await Promise.all([
    ExistingUser.find(memberFilter).select("name email role isActive").limit(100).lean(),
    OnlinePlatformUser.find(platformFilter).select("name email isVerified isSuspended").limit(100).lean(),
  ]);

  const rows = [
    ...members.map((u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role, isActive: u.isActive, isSuspended: false, source: "member" as const })),
    ...platform.map((u) => ({ _id: u._id, name: u.name, email: u.email, role: "online", isActive: u.isVerified && !u.isSuspended, isSuspended: Boolean(u.isSuspended), source: "platform" as const })),
  ];

  const withDetails = await Promise.all(
    rows.map(async (u) => {
      const [progresses, enrolledCount, certificates] = await Promise.all([
        UserCategoryProgress.find({ userId: u._id }).populate("category", "name").lean(),
        Enrollment.countDocuments({ userId: u._id, status: "active" }),
        CertificateRecord.countDocuments({ userId: u._id }),
      ]);
      return {
        ...u,
        enrolledCount,
        certificates,
        totalPoints: progresses.reduce((n, p) => n + (p.points ?? 0), 0),
        categories: progresses.map((p) => ({
          category: p.category,
          currentLevel: p.currentLevel,
          points: p.points,
        })),
      };
    })
  );
  res.json({ success: true, students: withDetails });
});

/** Admin: a single user's per-category progression + the full category list (for overrides). */
export const getStudentProgression = asyncHandler(async (req: Request, res: Response) => {
  const [progresses, categories, grants, levels] = await Promise.all([
    UserCategoryProgress.find({ userId: req.params.userId }).populate("category", "name slug").lean(),
    Category.find({ isActive: true }).select("name slug").lean(),
    CourseAccessGrant.find({ userId: req.params.userId }).populate("course", "courseName slug").lean(),
    getLevels(),
  ]);
  res.json({ success: true, progression: progresses, categories, grants, levels });
});

async function logOverride(req: Request, fields: Record<string, unknown>): Promise<void> {
  await AdminOverrideLog.create({
    adminId: req.auth!.id,
    adminName: req.auth!.name,
    userId: req.params.userId,
    ...fields,
  });
}

const setLevelSchema = z.object({ category: z.string().min(1), level: z.string().min(1) });

/** Admin: directly set (promote/demote) a user's level in one category. */
export const setStudentLevel = asyncHandler(async (req: Request, res: Response) => {
  const { category, level } = setLevelSchema.parse(req.body);
  const levels = await getLevels();
  if (!levelByKey(levels, level)) throw new ApiError(400, "Unknown level");

  const prog = await getOrCreateCategoryProgress(req.params.userId, category);
  const fromLevel = prog.currentLevel;
  prog.currentLevel = level;
  await prog.save();
  await logOverride(req, { action: "set-level", category, fromLevel, toLevel: level });
  res.json({ success: true, currentLevel: prog.currentLevel, points: prog.points });
});

const adjustPointsSchema = z.object({ category: z.string().min(1), delta: z.coerce.number().int() });

/** Admin: manually add/subtract points in a category, then recompute the unlocked level. */
export const adjustStudentPoints = asyncHandler(async (req: Request, res: Response) => {
  const { category, delta } = adjustPointsSchema.parse(req.body);
  const prog = await getOrCreateCategoryProgress(req.params.userId, category);
  const fromLevel = prog.currentLevel;
  prog.points = Math.max(0, prog.points + delta);
  await recomputeLevelOnDoc(prog);
  await prog.save();
  await logOverride(req, { action: "adjust-points", category, pointsDelta: delta, fromLevel, toLevel: prog.currentLevel });
  res.json({ success: true, currentLevel: prog.currentLevel, points: prog.points });
});

const grantSchema = z.object({ course: z.string().min(1) });

/** Admin: grant a user access to a specific course, bypassing progression locks. */
export const grantStudentCourse = asyncHandler(async (req: Request, res: Response) => {
  const { course } = grantSchema.parse(req.body);
  const exists = await Course.exists({ _id: course });
  if (!exists) throw new ApiError(404, "Course not found");
  await CourseAccessGrant.findOneAndUpdate(
    { userId: req.params.userId, course },
    { $setOnInsert: { userId: req.params.userId, course, grantedByAdmin: req.auth!.id } },
    { upsert: true }
  );
  await logOverride(req, { action: "grant-access", course });
  res.json({ success: true });
});

/** Admin: revoke a previously granted course access. */
export const revokeStudentCourse = asyncHandler(async (req: Request, res: Response) => {
  await CourseAccessGrant.deleteOne({ userId: req.params.userId, course: req.params.courseId });
  res.json({ success: true });
});

/* ─────────────── Platform user management (online signups only) ─────────────── */
/**
 * Academy members live in the shared, READ-ONLY `users` collection and must never be
 * edited from here. Only this app's own platform signups can be managed. Resolves the
 * target as a platform user or rejects with a clear message.
 */
async function getManageablePlatformUser(userId: string) {
  const user = await OnlinePlatformUser.findById(userId);
  if (!user) {
    const member = await ExistingUser.exists({ _id: userId });
    if (member) {
      throw new ApiError(403, "Academy members are managed in the main academy app and can't be edited here.");
    }
    throw new ApiError(404, "User not found");
  }
  return user;
}

const updateUserSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().trim().email().optional(),
});

/** Admin: edit a platform user's name/email. */
export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  const body = updateUserSchema.parse(req.body);
  const user = await getManageablePlatformUser(req.params.userId);

  if (body.email && body.email.toLowerCase() !== user.email) {
    const lc = body.email.toLowerCase().trim();
    const clash = await OnlinePlatformUser.exists({ email: lc, _id: { $ne: user._id } });
    if (clash) throw new ApiError(409, "Another account already uses this email.");
    user.email = lc;
  }
  if (body.name) user.name = body.name;
  await user.save();
  res.json({ success: true });
});

const statusSchema = z.object({ suspended: z.boolean() });

/** Admin: suspend or reactivate a platform user (blocks/unblocks login). */
export const setStudentStatus = asyncHandler(async (req: Request, res: Response) => {
  const { suspended } = statusSchema.parse(req.body);
  const user = await getManageablePlatformUser(req.params.userId);
  user.isSuspended = suspended;
  await user.save();
  res.json({ success: true, isSuspended: user.isSuspended });
});

/** Admin: permanently delete a platform user and their app-owned progression data. */
export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  const user = await getManageablePlatformUser(req.params.userId);
  await Promise.all([
    Enrollment.deleteMany({ userId: user._id }),
    UserCategoryProgress.deleteMany({ userId: user._id }),
    CourseAccessGrant.deleteMany({ userId: user._id }),
    CertificateRecord.deleteMany({ userId: user._id }),
  ]);
  await user.deleteOne();
  res.json({ success: true });
});

/** Admin: progression analytics for reporting. */
export const analytics = asyncHandler(async (_req: Request, res: Response) => {
  const levels = await getLevels();
  const entryKey = entryLevel(levels).key;

  const [usersPerLevelRaw, pointsAgg, certByCourse, categoryAgg, certTotal, distinctAdvanced, distinctTotal] =
    await Promise.all([
      UserCategoryProgress.aggregate([{ $group: { _id: "$currentLevel", count: { $sum: 1 } } }]),
      UserCategoryProgress.aggregate([{ $group: { _id: null, total: { $sum: "$points" } } }]),
      CertificateRecord.aggregate([
        { $group: { _id: "$course", courseName: { $first: "$courseName" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      UserCategoryProgress.aggregate([
        { $group: { _id: "$category", learners: { $sum: 1 }, points: { $sum: "$points" }, courses: { $sum: { $size: "$completedCourses" } } } },
      ]),
      CertificateRecord.countDocuments({}),
      UserCategoryProgress.distinct("userId", { currentLevel: { $ne: entryKey } }),
      UserCategoryProgress.distinct("userId", {}),
    ]);

  // Map category ids -> names for the category-progression table.
  const catIds = categoryAgg.map((c) => c._id).filter(Boolean);
  const cats = await Category.find({ _id: { $in: catIds } }).select("name").lean();
  const catName = new Map(cats.map((c) => [String(c._id), c.name]));

  const usersPerLevel = levels.map((l) => ({
    level: l.key,
    name: l.name,
    count: usersPerLevelRaw.find((r) => r._id === l.key)?.count ?? 0,
  }));

  res.json({
    success: true,
    analytics: {
      usersPerLevel,
      totalPointsEarned: pointsAgg[0]?.total ?? 0,
      mostCompletedCourses: certByCourse.map((c) => ({ course: c._id, courseName: c.courseName, completions: c.count })),
      categoryProgression: categoryAgg.map((c) => ({
        category: c._id,
        categoryName: c._id ? catName.get(String(c._id)) ?? "—" : "Uncategorised",
        learners: c.learners,
        points: c.points,
        completedCourses: c.courses,
      })),
      certificatesIssued: certTotal,
      advancedLearners: distinctAdvanced.length,
      totalLearners: distinctTotal.length,
      entryLevelLearners: Math.max(0, distinctTotal.length - distinctAdvanced.length),
    },
  });
});
