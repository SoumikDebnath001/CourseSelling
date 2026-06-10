import { Schema, model, Document } from "mongoose";

export interface IBlog extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  imagePublicId?: string;
  tags: string[];
  author: string;
  status: "draft" | "published";
  publishedAt?: Date;
  subscribersOnly?: boolean;
}

const blogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    excerpt: { type: String },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    tags: [{ type: String }],
    author: { type: String, required: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    publishedAt: { type: Date },
    subscribersOnly: { type: Boolean, default: false }
  },
  { timestamps: true }
);

blogSchema.index({ slug: 1 }, { unique: true });

export const Blog = model<IBlog>("Blog", blogSchema);
