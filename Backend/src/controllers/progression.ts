import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { UserCategoryProgress } from "../models/UserCategoryProgress";
import { CertificateRecord } from "../models/CertificateRecord";
import { Category } from "../models/Category";
import { getLevels } from "../utils/progression";
import { sortLevels, levelLabel } from "../config/levels";

/**
 * Student: my PER-CATEGORY progression for the dashboard. Returns one card per category I
 * have any progress in, plus overall totals and the configured level definitions so the
 * UI can render names, progress bars and "next unlock" requirements without hardcoding.
 */
export const myProgression = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.id;
  const levels = sortLevels(await getLevels());

  const progresses = await UserCategoryProgress.find({ userId })
    .populate("category", "name slug icon")
    .lean();

  const coursesCompleted = progresses.reduce((n, p) => n + (p.completedCourses?.length ?? 0), 0);
  const certificatesEarned = await CertificateRecord.countDocuments({ userId });

  const categories = progresses.map((p) => {
    const currentIdx = levels.findIndex((l) => l.key === p.currentLevel);
    const next = currentIdx >= 0 && currentIdx < levels.length - 1 ? levels[currentIdx + 1] : null;
    const prevUnlock = currentIdx >= 0 ? levels[currentIdx].unlockPoints : 0;
    const span = next ? Math.max(1, next.unlockPoints - prevUnlock) : 1;
    const into = Math.max(0, p.points - prevUnlock);
    const percent = next ? Math.min(100, Math.round((into / span) * 100)) : 100;
    return {
      category: p.category, // populated {_id, name, slug, icon}
      currentLevel: p.currentLevel,
      currentLevelName: levelLabel(levels, p.currentLevel),
      points: p.points,
      nextLevel: next ? { key: next.key, name: levelLabel(levels, next.key), unlockPoints: next.unlockPoints } : null,
      pointsToNext: next ? Math.max(0, next.unlockPoints - p.points) : 0,
      percent,
      completedCourses: p.completedCourses?.length ?? 0,
      completedModules: p.completedModules?.length ?? 0,
      completedTopics: p.completedTopics?.length ?? 0,
    };
  });

  const totalPoints = progresses.reduce((sum, p) => sum + (p.points ?? 0), 0);

  res.json({
    success: true,
    progression: {
      levels,
      categories,
      totalPoints,
      coursesCompleted,
      certificatesEarned,
    },
  });
});

/** Student: my earned certificates (for the dashboard Certifications section + filters). */
export const myCertificates = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth!.id;
  const certs = await CertificateRecord.find({ userId })
    .populate("category", "name slug")
    .sort({ issuedAt: -1 })
    .lean();
  res.json({ success: true, certificates: certs });
});

/** Public: the catalogue's categories (active) — handy for filters. */
export const listProgressionCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find({ isActive: true }).select("name slug icon").lean();
  res.json({ success: true, categories });
});
