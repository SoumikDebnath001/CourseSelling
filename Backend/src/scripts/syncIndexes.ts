/**
 * Builds indexes ONLY on this app's owned (*_appTwo) collections.
 *
 * Because `autoIndex` is globally disabled (to protect the shared DB), our own
 * collections' indexes must be created deliberately. This script calls
 * `syncIndexes()` on each owned model — and NEVER on the external read-only
 * models — so no index is ever built on the existing app's collections.
 *
 * Run once after deploy / whenever owned schemas change:  npm run sync:indexes
 */
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { Category } from "../models/Category";
import { Course } from "../models/Course";
import { Module } from "../models/Module";
import { Topic } from "../models/Topic";
import { Enrollment } from "../models/Enrollment";
import { CourseProgress } from "../models/CourseProgress";
import { Comment } from "../models/Comment";
import { Test } from "../models/Test";
import { TestAttempt } from "../models/TestAttempt";
import { RatingReview } from "../models/RatingReview";
import { OnlinePlatformUser } from "../models/OnlinePlatformUser";

const ownedModels = [
  OnlinePlatformUser,
  Category,
  Course,
  Module,
  Topic,
  Enrollment,
  CourseProgress,
  Comment,
  Test,
  TestAttempt,
  RatingReview,
];

async function main() {
  await connectDB();
  for (const model of ownedModels) {
    const coll = model.collection.collectionName;
    if (!coll.endsWith("_appTwo")) {
      throw new Error(`Refusing to index non-owned collection "${coll}"`);
    }
    await model.syncIndexes();
    console.log(`✅ indexes synced → ${coll}`);
  }
  console.log("\nAll owned indexes are in place. No existing collection was touched.");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("syncIndexes failed:", err);
  process.exit(1);
});
