import { Schema, model, Document, Types } from "mongoose";

/* =========================
   ROLE TYPES
========================= */
export type UserRole = "member" | "coach";

/* =========================
   BASE USER INTERFACE
========================= */
export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;

  isActive: boolean;
  isDeleted: boolean;

  createdBy?: Types.ObjectId;

  // MEMBER FIELDS
  subscriptionStatus?: "subscribed" | "unsubscribed";
  subscriptionStartDate?: Date;
  subscriptionExpiresAt?: Date;
  subscriptionManagedBy?: "member" | "admin";
  membershipPlan?: string;
  registrationNumber?: string;

  // OTP FIELDS (select: false)
  otpCode?: string;
  otpExpiry?: Date;
  otpVerified?: boolean;
  otpResetToken?: string;
  otpResetTokenExpiry?: Date;

  // NOTIFICATION FLAGS
  welcomeEmailSent?: boolean;

  // COACH FIELDS
  coachId?: string;
  specialization?: string;
  experienceYears?: number;
  isBlocked?: boolean;
}

/* =========================
   USER SCHEMA
========================= */
const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: { type: String, required: true },

    password: { type: String, required: true, select: false },

    role: {
      type: String,
      enum: ["member", "coach"],
      required: true,
    },

    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },

    /* =========================
       MEMBER FIELDS
    ========================= */
    subscriptionStatus: {
      type: String,
      enum: ["subscribed", "unsubscribed"],
      default: "unsubscribed",
    },

    subscriptionStartDate: { type: Date },
    subscriptionExpiresAt: { type: Date },
    subscriptionManagedBy: { type: String, enum: ["member", "admin"] },
    membershipPlan: { type: String },

    registrationNumber: {
      type: String,
      unique: true,
      sparse: true,
    },

    /* =========================
       OTP FIELDS
    ========================= */
    otpCode: { type: String, select: false },
    otpExpiry: { type: Date, select: false },
    otpVerified: { type: Boolean, select: false },
    otpResetToken: { type: String, select: false },
    otpResetTokenExpiry: { type: Date, select: false },

    /* =========================
       COACH FIELDS
    ========================= */
    coachId: {
      type: String,
      unique: true,
      sparse: true,
    },

    specialization: { type: String },
    experienceYears: { type: Number },

    isBlocked: { type: Boolean, default: false },

    welcomeEmailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);


