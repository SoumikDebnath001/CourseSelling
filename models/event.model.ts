import { Schema, model, Document, Types } from "mongoose";

export type FixtureStatus = "upcoming" | "live" | "completed" | "postponed";

export interface IEvent extends Document {
  coach?: Types.ObjectId;
  type: "event" | "fixture";
  title: string;
  description?: string | null;
  scheduledAt: Date;
  location?: string | null;
  isPublic: boolean;
  isActive: boolean;
  // Fixture-specific (all optional so existing event docs are unaffected)
  tournament?: string;
  organizer?: string;
  matchType?: string;
  homeTeam?: string;
  awayTeam?: string;
  entryFee?: number;
  fixtureStatus?: FixtureStatus;
}

const eventSchema = new Schema<IEvent>(
  {
    coach: { type: Schema.Types.ObjectId, ref: "User", default: null },
    type: { type: String, enum: ["event", "fixture"], default: "event" },
    title: { type: String, required: true },
    description: { type: String },
    scheduledAt: { type: Date, required: true },
    location: { type: String, default: null },
    isPublic: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    tournament: { type: String },
    organizer: { type: String },
    matchType: { type: String },
    homeTeam: { type: String },
    awayTeam: { type: String },
    entryFee: { type: Number },
    fixtureStatus: {
      type: String,
      enum: ["upcoming", "live", "completed", "postponed"],
      default: "upcoming",
    },
  },
  { timestamps: true }
);

export const Event = model<IEvent>("Event", eventSchema);
