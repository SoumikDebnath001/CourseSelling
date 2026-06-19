import type { AuthAccount } from "@/store/auth";

export interface LoginResponse {
  success: boolean;
  token: string;
  account: AuthAccount;
}

/** One configurable progression level (see Settings.levels). */
export interface LevelDef {
  key: string;
  name: string;
  /** User-facing display label, e.g. "Basic" / "Intermediate" / "Professional". */
  label?: string;
  /** Informational description shown when the level is selected. */
  description?: string;
  order: number;
  /** Cumulative per-category points needed to unlock this level. */
  unlockPoints: number;
}

export interface Settings {
  platformName: string;
  email?: string;
  contactPhone?: string;
  place?: string;
  hero: {
    badge?: string;
    title?: string;
    highlight?: string;
    subtitle?: string;
    videoUrl?: string;
  };
  foundation: {
    websiteUrl?: string;
    youtubeUrl?: string;
  };
  watermark: {
    enabled: boolean;
    opacity: number;
  };
  levels: LevelDef[];
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface Resource {
  _id?: string;
  name: string;
  url?: string;
  type: "pdf" | "link" | "file" | "image";
  locked?: boolean;
}

export interface Topic {
  _id: string;
  title: string;
  description?: string;
  order: number;
  videoUrl?: string;
  timeDurationSec?: number;
  resources: Resource[];
  commentCount: number;
  points?: number;
}

export interface TestRef {
  _id: string;
  title: string;
  description?: string;
  scope: "module" | "course";
  passingScorePct?: number;
  timeLimitMins?: number;
  isPublished?: boolean;
  questions?: unknown[];
}

export interface Module {
  _id: string;
  moduleName: string;
  description?: string;
  order: number;
  topics: Topic[];
  test?: TestRef | null;
  points?: number;
}

export type CourseType = "progressive" | "miscellaneous";

export interface Course {
  _id: string;
  courseName: string;
  slug: string;
  courseDescription: string;
  whatYouWillLearn?: string;
  thumbnail?: { url: string; publicId: string };
  price: number;
  tags: string[];
  category?: Category | string;
  createdByName?: string;
  modules: Module[];
  finalTest?: TestRef | null;
  instructions: string[];
  certificateColor?: string;
  courseType: CourseType;
  level: string;
  maxLevel?: string;
  points: number;
  status: "Draft" | "Published";
  studentsEnrolledCount: number;
}

export interface CourseCardData {
  _id: string;
  courseName: string;
  slug: string;
  courseDescription?: string;
  thumbnail?: { url: string };
  price: number;
  tags?: string[];
  studentsEnrolledCount?: number;
  createdByName?: string;
  category?: Category | string;
  courseType?: CourseType;
  level?: string;
  maxLevel?: string;
  points?: number;
}

export interface EnrolledCourse {
  course: CourseCardData & { certificateColor?: string };
  totalTopics: number;
  completedTopics: number;
  percent: number;
  /** True once the user has fully completed the course (certificate earned). */
  completed?: boolean;
}

/** One category card on the dashboard progress section. */
export interface CategoryProgress {
  category: { _id: string; name: string; slug?: string; icon?: string } | null;
  currentLevel: string;
  currentLevelName: string;
  points: number;
  nextLevel: { key: string; name: string; unlockPoints: number } | null;
  pointsToNext: number;
  percent: number;
  completedCourses: number;
  completedModules: number;
  completedTopics: number;
}

export interface Progression {
  levels: LevelDef[];
  categories: CategoryProgress[];
  totalPoints: number;
  coursesCompleted: number;
  certificatesEarned: number;
}

export interface Certificate {
  _id: string;
  course: string;
  category?: { _id: string; name: string; slug?: string } | null;
  level: string;
  courseName: string;
  categoryName?: string;
  certificateColor: string;
  issuedAt: string;
}

export interface Transaction {
  id: string;
  invoiceNo: string;
  course: { _id: string; courseName: string; slug: string };
  amountPaid: number;
  paymentRef: string;
  status: "active" | "cancelled";
  date: string;
}

export interface CommentNode {
  _id: string;
  text: string;
  authorName: string;
  authorModel: "User" | "Admin";
  authorId: string;
  likeCount: number;
  likedByMe: boolean;
  isPinned: boolean;
  isStarred: boolean;
  isEdited: boolean;
  createdAt: string;
  replies?: CommentNode[];
}

export interface TestQuestionPublic {
  questionText: string;
  options: string[];
  points: number;
}

export interface TestForTaking {
  _id: string;
  title: string;
  description?: string;
  scope: "module" | "course";
  passingScorePct: number;
  timeLimitMins?: number;
  questions: TestQuestionPublic[];
}

export interface TestReviewItem {
  questionIndex: number;
  correctOption: number;
  selectedOption: number | null;
  correct: boolean;
  explanation?: string;
}

export interface SubmitResult {
  scorePct: number;
  passed: boolean;
  passingScorePct: number;
  review: TestReviewItem[];
}

export interface Progress {
  completedTopics: string[];
  passedTests: string[];
}
