import { Schema, model, Document } from "mongoose";

export interface ISiteSettings extends Document {
  siteName: string;
  hotlineNumber: string;
  address: string;
  email: string;
  about: string;
  defaultLanguage: "en";
  metaTitle?: string;
  metaDescription?: string;
  shopEnabled: boolean;
}

const siteSettingsSchema = new Schema<ISiteSettings>(
  {
    siteName: { type: String, default: "Obuya Grassroots Foundation " },
    hotlineNumber: { type: String, default: "" },
    address: { type: String, default: "" },
    email: { type: String, default: "" },
    about: { type: String, default: "" },
    defaultLanguage: { type: String, enum: ["en"], default: "en" },
    metaTitle: { type: String },
    metaDescription: { type: String },
    shopEnabled: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const SiteSettings = model<ISiteSettings>("SiteSettings", siteSettingsSchema);
