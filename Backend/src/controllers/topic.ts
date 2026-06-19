import { Request, Response } from "express";
import { z } from "zod";
import type { UploadedFile } from "express-fileupload";
import { asyncHandler, ApiError } from "../utils/asyncHandler";
import { Module } from "../models/Module";
import { Topic, IResource } from "../models/Topic";
import { uploadFile, deleteFile } from "../utils/storage";

export const createTopicSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().min(2),
  description: z.string().optional(),
  points: z.coerce.number().int().min(0).optional(),
});

function filesArray(f: UploadedFile | UploadedFile[] | undefined): UploadedFile[] {
  if (!f) return [];
  return Array.isArray(f) ? f : [f];
}

/** Admin: create a topic with a video upload (+ optional resource files / links). */
export const createTopic = asyncHandler(async (req: Request, res: Response) => {
  const { moduleId, title, description } = req.body as z.infer<typeof createTopicSchema>;
  const module = await Module.findById(moduleId);
  if (!module) throw new ApiError(404, "Module not found");

  const videoFile = req.files?.video as UploadedFile | undefined;
  let videoUrl: string | undefined;
  let videoPublicId: string | undefined;
  let timeDurationSec: number | undefined;

  if (videoFile) {
    const up = await uploadFile(videoFile, "videos");
    videoUrl = up.url;
    videoPublicId = up.key; // S3 object key (used for signing + deletes)
  } else if (req.body.videoUrl) {
    videoUrl = String(req.body.videoUrl); // allow pasting an existing URL
  }
  // Duration is detected in the browser before upload and sent along.
  if (req.body.timeDurationSec) timeDurationSec = Math.round(Number(req.body.timeDurationSec)) || undefined;

  // Resource files
  const resources: IResource[] = [];
  for (const file of filesArray(req.files?.resources as UploadedFile | UploadedFile[] | undefined)) {
    const up = await uploadFile(file, "resources");
    resources.push({ name: file.name, url: up.url, publicId: up.key, type: "file" });
  }
  // Resource links (JSON array of {name,url})
  if (req.body.links) {
    try {
      const links = JSON.parse(req.body.links) as { name: string; url: string }[];
      for (const l of links) if (l.url) resources.push({ name: l.name || l.url, url: l.url, type: "link" });
    } catch {
      /* ignore malformed links */
    }
  }

  const order = module.topics.length;
  const topic = await Topic.create({
    title,
    description,
    order,
    module: module._id,
    course: module.course,
    videoUrl,
    videoPublicId,
    timeDurationSec,
    resources,
    points: req.body.points !== undefined ? Number(req.body.points) || 0 : 0,
  });
  module.topics.push(topic._id);
  await module.save();

  res.status(201).json({ success: true, topic });
});

/** Admin: update topic text / replace video / append resources. */
export const updateTopic = asyncHandler(async (req: Request, res: Response) => {
  const topic = await Topic.findById(req.params.id);
  if (!topic) throw new ApiError(404, "Topic not found");

  if (req.body.title !== undefined) topic.title = req.body.title;
  if (req.body.description !== undefined) topic.description = req.body.description;
  if (req.body.order !== undefined) topic.order = Number(req.body.order);
  if (req.body.points !== undefined) topic.points = Number(req.body.points) || 0;

  const videoFile = req.files?.video as UploadedFile | undefined;
  if (videoFile) {
    await deleteFile(topic.videoPublicId);
    const up = await uploadFile(videoFile, "videos");
    topic.videoUrl = up.url;
    topic.videoPublicId = up.key;
  }
  if (req.body.timeDurationSec) {
    topic.timeDurationSec = Math.round(Number(req.body.timeDurationSec)) || topic.timeDurationSec;
  }

  for (const file of filesArray(req.files?.resources as UploadedFile | UploadedFile[] | undefined)) {
    const up = await uploadFile(file, "resources");
    topic.resources.push({ name: file.name, url: up.url, publicId: up.key, type: "file" });
  }
  if (req.body.links) {
    try {
      const links = JSON.parse(req.body.links) as { name: string; url: string }[];
      for (const l of links) if (l.url) topic.resources.push({ name: l.name || l.url, url: l.url, type: "link" });
    } catch {
      /* ignore */
    }
  }

  await topic.save();
  res.json({ success: true, topic });
});

export const deleteTopic = asyncHandler(async (req: Request, res: Response) => {
  const topic = await Topic.findById(req.params.id);
  if (!topic) throw new ApiError(404, "Topic not found");
  await deleteFile(topic.videoPublicId);
  for (const r of topic.resources) await deleteFile(r.publicId);
  await Module.findByIdAndUpdate(topic.module, { $pull: { topics: topic._id } });
  await topic.deleteOne();
  res.json({ success: true, message: "Topic deleted" });
});
