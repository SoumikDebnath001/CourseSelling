import { Schema, model, Document } from "mongoose";

export interface IPointsEntry extends Document {
  teamName: string;
  leagueName: string;
  played: number;
  won: number;
  lost: number;
  drawn: number;
  points: number;
  recentForm: string[];
  displayOrder: number;
  season?: string;
}

const pointsEntrySchema = new Schema<IPointsEntry>(
  {
    teamName: { type: String, required: true },
    leagueName: { type: String, required: true, default: "" },
    played: { type: Number, required: true, default: 0 },
    won: { type: Number, required: true, default: 0 },
    lost: { type: Number, required: true, default: 0 },
    drawn: { type: Number, required: true, default: 0 },
    points: { type: Number, required: true, default: 0 },
    recentForm: { type: [String], default: [] },
    displayOrder: { type: Number, required: true, default: 0 },
    season: { type: String }
  },
  { timestamps: true }
);

export const PointsEntry = model<IPointsEntry>("PointsEntry", pointsEntrySchema);
