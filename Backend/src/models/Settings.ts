import { Schema, Document, Model } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

/**
 * Platform-wide settings. A singleton document (only one row ever exists) that the
 * admin edits and the public site reads. Holds branding, contact details, the home
 * hero copy + intro video, the foundation links, and the watermark toggle.
 */
export interface ISettings extends Document {
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

interface ISettingsModel extends Model<ISettings> {
  getSingleton(): Promise<ISettings>;
}

const settingsSchema = new Schema<ISettings>(
  {
    platformName: { type: String, default: "Cricket Academy", trim: true },
    email: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    place: { type: String, trim: true },
    hero: {
      badge: { type: String, trim: true },
      title: { type: String, trim: true },
      highlight: { type: String, trim: true },
      subtitle: { type: String, trim: true },
      videoUrl: { type: String, trim: true },
    },
    foundation: {
      websiteUrl: { type: String, trim: true },
      youtubeUrl: { type: String, trim: true },
    },
    watermark: {
      enabled: { type: Boolean, default: true },
      opacity: { type: Number, default: 0.04, min: 0, max: 1 },
    },
  },
  { timestamps: true }
);

/** Returns the one settings doc, creating it with defaults on first access. */
settingsSchema.statics.getSingleton = async function (): Promise<ISettings> {
  const existing = await this.findOne();
  if (existing) return existing;
  return this.create({});
};

export const Settings = ownedModel<ISettings>(
  "Settings",
  settingsSchema,
  "settings"
) as ISettingsModel;
