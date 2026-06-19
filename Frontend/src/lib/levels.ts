import type { Category, LevelDef, Progression } from "@/types/api";

/** Numeric order of a level key (entry level = 0 when unknown). */
export function levelOrder(levels: LevelDef[], key?: string): number {
  if (!key) return 0;
  return levels.find((l) => l.key === key)?.order ?? 0;
}

/** Internal name for a level key. */
export function levelName(levels: LevelDef[], key?: string): string {
  if (!key) return "";
  return levels.find((l) => l.key === key)?.name ?? key;
}

/** User-facing display label (Basic / Intermediate / Professional), falling back to name. */
export function levelLabel(levels: LevelDef[], key?: string): string {
  if (!key) return "";
  const l = levels.find((x) => x.key === key);
  return l?.label || l?.name || key;
}

/** Informational description for a level key. */
export function levelDescription(levels: LevelDef[], key?: string): string {
  if (!key) return "";
  return levels.find((x) => x.key === key)?.description ?? "";
}

/** Whether a level key is the entry (always-unlocked) level. */
export function isEntryLevel(levels: LevelDef[], key?: string): boolean {
  return levelOrder(levels, key) === 0;
}

/** Normalise a populated-or-id category reference to its id string. */
export function categoryId(cat?: Category | string | null): string | undefined {
  if (!cat) return undefined;
  return typeof cat === "string" ? cat : cat._id;
}

/**
 * Whether a course is locked for the signed-in learner given their per-category
 * progression. Entry-level and uncategorised courses are never locked. Anonymous
 * visitors (no progression) see everything unlocked (the server still gates enrolment).
 */
export function courseLocked(
  progression: Progression | undefined,
  course: { category?: Category | string | null; level?: string }
): boolean {
  if (!progression) return false;
  const order = levelOrder(progression.levels, course.level);
  if (order === 0) return false;
  const catId = categoryId(course.category);
  if (!catId) return false;
  const cp = progression.categories.find((c) => c.category?._id === catId);
  const currentOrder = cp ? levelOrder(progression.levels, cp.currentLevel) : 0;
  return order > currentOrder;
}
