import { Schema, model, Document } from "mongoose";

export interface IPhotoItem {
  _id?: any;
  url: string;
  publicId: string;
  caption?: string;
}

export interface IAboutSection {
  title: string;
  description: string;
  photos: IPhotoItem[];
}

export interface IAboutUs extends Document {
  foundation: IAboutSection;
  academy: IAboutSection;
  watermarkLogo: { url: string; publicId: string } | null;
  watermarkEnabled: boolean;
}

const photoItemSchema = new Schema<IPhotoItem>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    caption: { type: String },
  },
  { _id: true }
);

const aboutSectionSchema = new Schema<IAboutSection>(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    photos: { type: [photoItemSchema], default: [] },
  },
  { _id: false }
);

const aboutUsSchema = new Schema<IAboutUs>(
  {
    foundation: { type: aboutSectionSchema, default: () => ({ title: "", description: "", photos: [] }) },
    academy: { type: aboutSectionSchema, default: () => ({ title: "", description: "", photos: [] }) },
    watermarkLogo: {
      type: new Schema({ url: String, publicId: String }, { _id: false }),
      default: null,
    },
    watermarkEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const AboutUs = model<IAboutUs>("AboutUs", aboutUsSchema);
