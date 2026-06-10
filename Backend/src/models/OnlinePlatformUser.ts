import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

/**
 * Users who DON'T have an account in the existing academy app and sign up for this
 * course platform directly. Stored in this app's own collection
 * (`onlinePlatformUser_appTwo`) — completely separate from the shared `users`.
 *
 * They can log in with email+password OR passwordless OTP. OTP secrets are hashed.
 */
export interface IOnlinePlatformUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  isVerified: boolean;
  otpHash?: string;
  otpExpiry?: Date;
  otpPurpose?: "verify" | "login";
}

const schema = new Schema<IOnlinePlatformUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    isVerified: { type: Boolean, default: false },
    otpHash: { type: String, select: false },
    otpExpiry: { type: Date, select: false },
    otpPurpose: { type: String, enum: ["verify", "login"], select: false },
  },
  { timestamps: true }
);

export const OnlinePlatformUser = ownedModel<IOnlinePlatformUser>(
  "OnlinePlatformUser",
  schema,
  "onlinePlatformUser"
);
