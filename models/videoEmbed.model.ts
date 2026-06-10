import { Schema, model, Document } from "mongoose";

export interface IVideoEmbed extends Document {
  title: string;
  youtubeUrl: string;
  description?: string;
  order: number;
  isActive: boolean;
}

const videoEmbedSchema = new Schema<IVideoEmbed>(
  {
    title: { type: String, required: true },
    youtubeUrl: { type: String, required: true },
    description: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const VideoEmbed = model<IVideoEmbed>("VideoEmbed", videoEmbedSchema);
