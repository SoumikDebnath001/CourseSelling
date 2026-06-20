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
    introVideoUrl?: string;
  };
  foundation: {
    websiteUrl?: string;
    youtubeUrl?: string;
    imageUrl?: string;
  };
  footer: {
    about?: string;
  };
  socials: {
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    twitter?: string;
    linkedin?: string;
  };
  footerLinks: FooterLinkGroup[];
  watermark: {
    enabled: boolean;
    opacity: number;
  };
  levels: LevelDef[];
}

/** A footer link column (e.g. Sitemap, Resources) edited from the admin panel. */
export interface FooterLinkGroup {
  title: string;
  items: { label: string; href: string }[];
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
  /** For progressive courses: the level key of the section this module belongs to. */
  section?: string | null;
  topics: Topic[];
  test?: TestRef | null;
  points?: number;
}

/** One auto-generated section of a progressive course (one per level in its range). */
export interface CourseSection {
  levelKey: string;
  order: number;
  requiresPhysicalAssessment: boolean;
  finalTest?: TestRef | null;
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
  /** Miscellaneous courses: gate the single certificate behind a physical assessment. */
  requiresPhysicalAssessment?: boolean;
  /** Progressive courses: auto-seeded sections (one per level in the range). */
  sections?: CourseSection[];
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

export type PhysicalAssessmentStatus = "pending" | "test_approved" | "cert_approved";

/** Computed per-section state returned by the learn (full-course) endpoint. */
export interface SectionStatus {
  levelKey: string;
  label: string;
  order: number;
  requiresPhysicalAssessment: boolean;
  locked: boolean;
  modulesDone: boolean;
  finalOk: boolean;
  complete: boolean;
  certificateEarned: boolean;
  physicalAssessment: {
    status: PhysicalAssessmentStatus;
    whatsappCountryCode: string;
    whatsappNumber: string;
  } | null;
}

/** The caller's physical-assessment application for one level of a course. */
export interface PhysicalAssessmentEntry {
  level: string;
  scope: "course" | "section";
  status: PhysicalAssessmentStatus;
  whatsappCountryCode: string;
  whatsappNumber: string;
}

/** One row in the admin "Physical Assessment Applications" panel. */
export interface PhysicalAssessmentApplication {
  _id: string;
  studentName: string;
  whatsappCountryCode: string;
  whatsappNumber: string;
  scope: "course" | "section";
  level: string;
  levelLabel: string;
  status: PhysicalAssessmentStatus;
  course: { _id: string; courseName: string } | null;
  createdAt?: string;
}
