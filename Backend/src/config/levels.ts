/**
 * Configurable level system.
 *
 * Levels are NOT hardcoded in business logic (requirement: future-proofing). They live in
 * Settings as an ordered list so new levels can be added/renamed without code changes.
 * This module only defines the SHAPE, the default seed, and pure helpers for working with
 * a level list (sorting, lookup, ordering, current-level computation).
 */

export interface LevelDef {
  /** Stable machine key stored on courses & progression, e.g. "foundation". */
  key: string;
  /** Internal name, e.g. "Foundation" / "Level 1" / "Level 2". */
  name: string;
  /** User-facing display label, e.g. "Basic" / "Intermediate" / "Professional". */
  label?: string;
  /** Informational description shown when the level is selected. */
  description?: string;
  /** Ordering position. 0 = entry level (always unlocked). Higher unlocks later. */
  order: number;
  /**
   * CUMULATIVE points a user must accumulate IN A CATEGORY to unlock this level (combined
   * with completing a course at the previous level). The entry level is always 0.
   */
  unlockPoints: number;
}

/** Seed levels used until an admin customises them. */
export const DEFAULT_LEVELS: LevelDef[] = [
  {
    key: "foundation",
    name: "Foundation",
    label: "Basic",
    description: "Basic learning stage focused on core concepts and fundamentals.",
    order: 0,
    unlockPoints: 0,
  },
  {
    key: "level1",
    name: "Level 1",
    label: "Intermediate",
    description: "Intermediate learning stage focused on skill development and practical application.",
    order: 1,
    unlockPoints: 100,
  },
  {
    key: "level2",
    name: "Level 2",
    label: "Professional",
    description: "Professional learning stage focused on advanced mastery and performance.",
    order: 2,
    unlockPoints: 500,
  },
];

/** User-facing label for a level key (falls back to the internal name). */
export function levelLabel(levels: LevelDef[], key?: string): string {
  if (!key) return "";
  const l = levelByKey(levels, key);
  return l?.label || l?.name || key;
}

/** A copy of `levels` sorted by ascending order. */
export function sortLevels(levels: LevelDef[]): LevelDef[] {
  return [...levels].sort((a, b) => a.order - b.order);
}

/** The lowest-order level — every user starts here and it is always unlocked. */
export function entryLevel(levels: LevelDef[]): LevelDef {
  return sortLevels(levels)[0] ?? DEFAULT_LEVELS[0];
}

export function levelByKey(levels: LevelDef[], key: string): LevelDef | undefined {
  return levels.find((l) => l.key === key);
}

/** Numeric order for a level key (defaults to the entry order when unknown). */
export function levelOrder(levels: LevelDef[], key: string): number {
  return levelByKey(levels, key)?.order ?? entryLevel(levels).order;
}

/**
 * Compute the highest level a user has unlocked in a category, given their cumulative
 * category points and the set of level keys at which they've completed at least one course.
 *
 * Walks levels in order: a level unlocks when the PREVIOUS level's course is completed AND
 * the cumulative points meet that level's `unlockPoints`. Stops at the first gap.
 */
export function computeLevel(
  levels: LevelDef[],
  categoryPoints: number,
  completedLevelKeys: Set<string>
): string {
  const sorted = sortLevels(levels);
  let current = sorted[0]?.key ?? "foundation";
  for (let i = 1; i < sorted.length; i++) {
    const lvl = sorted[i];
    const prev = sorted[i - 1];
    const prevCourseDone = completedLevelKeys.has(prev.key);
    const enoughPoints = categoryPoints >= lvl.unlockPoints;
    if (prevCourseDone && enoughPoints) current = lvl.key;
    else break;
  }
  return current;
}

/** A course is unlocked when its level order is at or below the user's current level order. */
export function courseUnlocked(levels: LevelDef[], currentLevelKey: string, courseLevelKey: string): boolean {
  return levelOrder(levels, courseLevelKey) <= levelOrder(levels, currentLevelKey);
}
