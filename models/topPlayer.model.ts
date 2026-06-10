import { Schema, model, Document } from "mongoose";

export interface ITopPlayer extends Document {
  name: string;
  role?: string;
  imageUrl?: string;
  imagePublicId?: string;
  stats?: string;
  nationality?: string;
  age?: number;
  battingHand?: string;
  bowlingHand?: string;
  team?: string;
  yearStats?: string;
  order: number;
  isActive: boolean;
}

const topPlayerSchema = new Schema<ITopPlayer>(
  {
    name: { type: String, required: true },
    role: { type: String },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    stats: { type: String },
    nationality: { type: String },
    age: { type: Number },
    battingHand: { type: String },
    bowlingHand: { type: String },
    team: { type: String },
    yearStats: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const TopPlayer = model<ITopPlayer>("TopPlayer", topPlayerSchema);
