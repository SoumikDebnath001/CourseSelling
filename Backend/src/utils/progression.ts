import { Types } from "mongoose";
import { Course } from "../models/Course";
import { Module } from "../models/Module";
import { Topic } from "../models/Topic";
import { Test } from "../models/Test";
import { Category } from "../models/Category";
import { CourseProgress } from "../models/CourseProgress";
import { Settings } from "../models/Settings";
import { UserCategoryProgress, IUserCategoryProgress } from "../models/UserCategoryProgress";
import { CertificateRecord } from "../models/CertificateRecord";
import { ProgressionLog } from "../models/ProgressionLog";
import { CourseAccessGrant } from "../models/CourseAccessGrant";
import { PhysicalAssessmentApplication } from "../models/PhysicalAssessmentApplication";
import {
  DEFAULT_LEVELS,
  LevelDef,
  computeLevel,
  courseUnlocked,
  entryLevel,
  levelLabel,
  levelOrder,
} from "../config/levels";

/** Configured level definitions (falls back to the seed if none are stored yet). */
export async function getLevels(): Promise<LevelDef[]> {
  const s = await Settings.getSingleton();
  return s.levels && s.levels.length ? s.levels : DEFAULT_LEVELS;
}

/** Get (or lazily create) a user's progress doc for one category. */
export async function getOrCreateCategoryProgress(
  userId: string | Types.ObjectId,
  category: string | Types.ObjectId
): Promise<IUserCategoryProgress> {
  const existing = await UserCategoryProgress.findOne({ userId, category });
  if (existing) return existing;
  const levels = await getLevels();
  return UserCategoryProgress.create({ userId, category, currentLevel: entryLevel(levels).key });
}

/** The set of level keys at which a user has completed at least one course in this category. */
async function completedLevelKeys(prog: IUserCategoryProgress): Promise<Set<string>> {
  if (!prog.completedCourses.length) return new Set();
  const courses = await Course.find({ _id: { $in: prog.completedCourses } })
    .select("level")
    .lean();
  return new Set(courses.map((c) => c.level));
}

/**
 * Re-evaluate everything a user has completed for one course and credit any newly-earned
 * topic / module / course points to that course's CATEGORY bucket. Idempotent: each item
 * is credited at most once (tracked in the per-category progress doc). Also issues the
 * course certificate on full completion and recomputes the user's level in the category.
 *
 * Called after a topic is completed or a test is passed.
 */
export async function creditProgress(
  userId: string | Types.ObjectId,
  courseId: string | Types.ObjectId
): Promise<void> {
  const course = await Course.findById(courseId)
    .select("category level maxLevel points finalTest courseName certificateColor courseType requiresPhysicalAssessment sections")
    .lean();
  if (!course || !course.category) return; // uncategorised courses are not part of progression

  const cp = await CourseProgress.findOne({ userId, course: course._id }).lean();
  const completedTopicIds = new Set((cp?.completedTopics ?? []).map(String));
  const passedTestIds = new Set((cp?.passedTests ?? []).map(String));

  const [modules, topics] = await Promise.all([
    Module.find({ course: course._id }).select("points test section").lean(),
    Topic.find({ course: course._id }).select("points module").lean(),
  ]);

  const prog = await getOrCreateCategoryProgress(userId, course.category);
  const creditedTopics = new Set(prog.completedTopics.map(String));
  const creditedModules = new Set(prog.completedModules.map(String));
  const creditedCourses = new Set(prog.completedCourses.map(String));

  const logs: Array<Record<string, unknown>> = [];

  // 1) Topics — credited the moment they're completed.
  for (const t of topics) {
    const id = String(t._id);
    if (completedTopicIds.has(id) && !creditedTopics.has(id)) {
      prog.completedTopics.push(t._id);
      creditedTopics.add(id);
      if (t.points > 0) prog.points += t.points;
      logs.push({ userId, category: course.category, type: "topic", points: t.points ?? 0, ref: t._id });
    }
  }

  // 2) Modules — "module test only" rule: a module WITH a published test is "done" when
  //    that test is passed; a module WITHOUT a published test is "done" when all its topics
  //    are complete. Compute a done-map once (reused for section completion below).
  const allTestIds = [
    ...modules.map((m) => m.test),
    ...(course.sections ?? []).map((s) => s.finalTest),
  ].filter(Boolean) as Types.ObjectId[];
  const publishedTestSet = new Set<string>();
  if (allTestIds.length) {
    const published = await Test.find({ _id: { $in: allTestIds }, isPublished: true })
      .select("_id")
      .lean();
    published.forEach((t) => publishedTestSet.add(String(t._id)));
  }

  const moduleDone = new Map<string, boolean>();
  for (const m of modules) {
    const id = String(m._id);
    let done = false;
    if (m.test && publishedTestSet.has(String(m.test))) {
      done = passedTestIds.has(String(m.test));
    } else {
      const mTopics = topics.filter((t) => String(t.module) === id);
      done = mTopics.length > 0 && mTopics.every((t) => completedTopicIds.has(String(t._id)));
    }
    moduleDone.set(id, done);
    if (done && !creditedModules.has(id)) {
      prog.completedModules.push(m._id);
      creditedModules.add(id);
      if (m.points > 0) prog.points += m.points;
      logs.push({ userId, category: course.category, type: "module", points: m.points ?? 0, ref: m._id });
    }
  }

  const levels = await getLevels();
  const cat = await Category.findById(course.category).select("name").lean();

  // Upsert a certificate for one (course, level) and link it to the category progress doc.
  const issueCertificate = async (lvlKey: string) => {
    const cert = await CertificateRecord.findOneAndUpdate(
      { userId, course: course._id, level: lvlKey },
      {
        $setOnInsert: {
          userId,
          course: course._id,
          category: course.category,
          level: lvlKey,
          label: levelLabel(levels, lvlKey),
          courseName: course.courseName,
          categoryName: cat?.name,
          certificateColor: course.certificateColor,
        },
      },
      { upsert: true, new: true }
    );
    if (cert && !prog.earnedCertificates.some((c) => c.equals(cert._id))) {
      prog.earnedCertificates.push(cert._id);
    }
  };

  // Award course points + mark the course completed (for category level-ups). Once only.
  const completeCourse = () => {
    if (creditedCourses.has(String(course._id))) return;
    prog.completedCourses.push(course._id);
    creditedCourses.add(String(course._id));
    if (course.points > 0) prog.points += course.points;
    logs.push({ userId, category: course.category, type: "course", points: course.points ?? 0, ref: course._id });
  };

  // 3) Certificates.
  if (course.courseType === "progressive" && (course.sections?.length ?? 0) > 0) {
    // One certificate per SECTION/level, issued sequentially. A section is complete when all
    // its modules are done AND its published final test (if any) is passed AND (if flagged) a
    // cert-approved physical assessment exists. Later sections stay locked until earlier certs.
    const sorted = [...course.sections].sort((a, b) => a.order - b.order);
    const existingCerts = await CertificateRecord.find({ userId, course: course._id }).select("level").lean();
    const certLevels = new Set(existingCerts.map((c) => c.level));
    const apps = await PhysicalAssessmentApplication.find({ userId, course: course._id })
      .select("level status")
      .lean();
    const certApproved = new Set(apps.filter((a) => a.status === "cert_approved").map((a) => a.level));

    for (const sec of sorted) {
      const secModules = modules.filter((m) => m.section === sec.levelKey);
      const modulesDone = secModules.length > 0 && secModules.every((m) => moduleDone.get(String(m._id)));
      let finalOk = true;
      if (sec.finalTest && publishedTestSet.has(String(sec.finalTest))) {
        finalOk = passedTestIds.has(String(sec.finalTest));
      }
      const physOk = !sec.requiresPhysicalAssessment || certApproved.has(sec.levelKey);
      const complete = modulesDone && finalOk && physOk;

      if (complete && !certLevels.has(sec.levelKey)) {
        await issueCertificate(sec.levelKey);
        certLevels.add(sec.levelKey);
      }
      // Sequential gate: stop evaluating once a section is not yet certified.
      if (!certLevels.has(sec.levelKey)) break;
    }

    if (course.sections.every((s) => certLevels.has(s.levelKey))) completeCourse();
  } else {
    // Miscellaneous / non-sectioned: a single course certificate. Gated by all topics done +
    // published final test passed (+ a cert-approved physical assessment when required).
    const totalTopics = topics.length;
    const allTopicsDone = totalTopics > 0 && topics.every((t) => completedTopicIds.has(String(t._id)));
    let finalOk = true;
    if (course.finalTest) {
      const ft = await Test.findById(course.finalTest).select("isPublished").lean();
      if (ft?.isPublished) finalOk = passedTestIds.has(String(course.finalTest));
    }
    let physOk = true;
    if (course.requiresPhysicalAssessment) {
      const app = await PhysicalAssessmentApplication.findOne({ userId, course: course._id, scope: "course" })
        .select("status")
        .lean();
      physOk = app?.status === "cert_approved";
    }

    if (allTopicsDone && finalOk && physOk && !creditedCourses.has(String(course._id))) {
      completeCourse();
      await issueCertificate(course.level);
    }
  }

  // 4) Recompute the unlocked level from cumulative category points + completed levels.
  const newLevel = computeLevel(levels, prog.points, await completedLevelKeys(prog));
  if (newLevel !== prog.currentLevel) {
    logs.push({
      userId,
      category: course.category,
      type: "levelup",
      points: 0,
      fromLevel: prog.currentLevel,
      toLevel: newLevel,
    });
    prog.currentLevel = newLevel;
  }

  await prog.save();
  if (logs.length) await ProgressionLog.insertMany(logs);
}

/** Recompute and set a category progress doc's level from its points + completed courses. */
export async function recomputeLevelOnDoc(prog: IUserCategoryProgress): Promise<boolean> {
  const levels = await getLevels();
  const next = computeLevel(levels, prog.points, await completedLevelKeys(prog));
  const changed = next !== prog.currentLevel;
  prog.currentLevel = next;
  return changed;
}

/**
 * Whether a user may access a course given their category level (entry-level courses and
 * uncategorised courses are always open; an admin access grant always unlocks).
 */
export async function isCourseUnlockedForUser(
  userId: string | Types.ObjectId,
  course: { _id: Types.ObjectId; category?: Types.ObjectId | null; level: string }
): Promise<boolean> {
  const levels = await getLevels();
  if (levelOrder(levels, course.level) === entryLevel(levels).order) return true;
  if (!course.category) return true;
  const grant = await CourseAccessGrant.findOne({ userId, course: course._id }).lean();
  if (grant) return true;
  const prog = await UserCategoryProgress.findOne({ userId, category: course.category }).lean();
  const currentLevel = prog?.currentLevel ?? entryLevel(levels).key;
  return courseUnlocked(levels, currentLevel, course.level);
}
