import type { AuthAccount } from "@/store/auth";

export interface LoginResponse {
  success: boolean;
  token: string;
  account: AuthAccount;
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
}

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
}

export interface EnrolledCourse {
  course: CourseCardData;
  totalTopics: number;
  completedTopics: number;
  percent: number;
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
