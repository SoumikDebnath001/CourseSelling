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
    imageName?: string;
    imageSize?: number;
    imageFormat?: string;
  };
  /**
   * Certificate branding. `signatories` is the pool of people whose signature can be
   * printed on certificates; each course selects up to three of them. The flat
   * coachName/roleLine/signature fields are the legacy single signatory (fallback only).
   */
  certificate: {
    coachName?: string;
    roleLine1?: string;
    roleLine2?: string;
    signatureUrl?: string;
    signaturePublicId?: string;
    signatureName?: string;
    signatureSize?: number;
    signatureFormat?: string;
    signatories: CertificateSignatory[];
  };
  footer: {
    about?: string;
  };
  about: {
    title?: string;
    intro?: string;
    body?: string;
    images: { url?: string; publicId?: string; name?: string; size?: number; format?: string }[];
  };
  socials: {
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    twitter?: string;
    linkedin?: string;
  };
  socialOrder: {
    whatsapp?: number;
    instagram?: number;
    facebook?: number;
    youtube?: number;
    twitter?: number;
    linkedin?: number;
  };
  /** Terms & Conditions accepted in the registration pop-up; editable by the admin. */
  terms: {
    content?: string;
  };
  footerLinks: FooterLinkGroup[];
  watermark: {
    enabled: boolean;
    opacity: number;
  };
  levels: LevelDef[];
}

/** One person whose signature can be printed on completion certificates. */
export interface CertificateSignatory {
  _id: string;
  name: string;
  roleLine1?: string;
  roleLine2?: string;
  signatureUrl?: string;
  signatureName?: string;
  signatureSize?: number;
  signatureFormat?: string;
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
  /** Size in bytes of the uploaded file (absent for links / legacy uploads). */
  size?: number;
  /** Lowercase file extension, e.g. "pdf". */
  format?: string;
  locked?: boolean;
}

export interface Topic {
  _id: string;
  title: string;
  description?: string;
  order: number;
  videoUrl?: string;
  /** Original filename / size / format of the uploaded video (admin builder display). */
  videoName?: string;
  videoSize?: number;
  videoFormat?: string;
  timeDurationSec?: number;
  resources: Resource[];
  commentCount: number;
  points?: number;
}

export interface AdminQuestion {
  _id?: string;
  questionText: string;
  type: "single" | "multiple";
  options: string[];
  /** Used when type === "single". */
  correctOption?: number;
  /** Used when type === "multiple". */
  correctOptions?: number[];
  points: number;
  negativeMarks?: number;
  negativePerWrongOption?: number;
  explanation?: string;
}

export interface TestRandomConfig {
  targetQuestionCount: number;
  targetTotalMarks: number;
}

export interface TestRef {
  _id: string;
  title: string;
  description?: string;
  scope: "module" | "course";
  passingScorePct?: number;
  timeLimitMins?: number;
  isPublished?: boolean;
  assemblyMode?: "fixed" | "random";
  randomConfig?: TestRandomConfig;
  questions?: AdminQuestion[];
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
  /** Certificate layout students download: vertical (portrait) or horizontal (landscape). */
  certificateOrientation?: "portrait" | "landscape";
  /** Ids of the signatories (Settings.certificate.signatories) printed on this course's certificate. */
  certificateSignatories?: string[];
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
  certificateOrientation?: "portrait" | "landscape";
  /** The course's current signatory selection (ids into Settings.certificate.signatories). */
  certificateSignatories?: string[];
  /** Permanent certificate id (OGR-YEAR-0001) — identical on every re-download. */
  serial?: string;
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

/** An option as shown to the student. `originalIndex` must always be echoed back on submit —
 *  never the option's display position, since random-mode tests shuffle option order per attempt. */
export interface TestOption {
  text: string;
  originalIndex: number;
}

export interface TestQuestionPublic {
  _id: string;
  type: "single" | "multiple";
  questionText: string;
  options: TestOption[];
  points: number;
}

export interface TestForTaking {
  _id: string;
  title: string;
  description?: string;
  scope: "module" | "course";
  passingScorePct: number;
  timeLimitMins?: number;
  assemblyMode?: "fixed" | "random";
  /** Present only for assemblyMode "random" — must be echoed back on submit. */
  attemptId?: string;
  questions: TestQuestionPublic[];
}

export interface TestReviewItem {
  questionId: string;
  correctOptions: number[];
  selectedOptions: number[];
  correct: boolean;
  pointsEarned: number;
  pointsPossible: number;
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

export type PhysicalAssessmentStatus = "pending" | "scheduled" | "cert_approved" | "failed";

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
    scheduledDate: string | null;
    revoked: boolean;
  } | null;
}

/** The caller's physical-assessment application for one level of a course. */
export interface PhysicalAssessmentEntry {
  level: string;
  scope: "course" | "section";
  status: PhysicalAssessmentStatus;
  whatsappCountryCode: string;
  whatsappNumber: string;
  scheduledDate: string | null;
  revoked: boolean;
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
  scheduledDate: string | null;
  qrToken: string | null;
  otpVerifiedAt: string | null;
  revoked: boolean;
  course: { _id: string; courseName: string } | null;
  createdAt?: string;
}

/** Detail shape returned by the admin verify-page endpoint (QR scan / desk link). */
export interface PhysicalAssessmentVerifyDetail {
  _id: string;
  studentName: string;
  whatsappCountryCode: string;
  whatsappNumber: string;
  scope: "course" | "section";
  level: string;
  levelLabel: string;
  status: PhysicalAssessmentStatus;
  scheduledDate: string | null;
  otpVerifiedAt: string | null;
  revoked: boolean;
  course: { _id: string; courseName: string } | null;
}
