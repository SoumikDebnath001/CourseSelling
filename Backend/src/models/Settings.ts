import { Schema, Document, Model } from "mongoose";
import { ownedModel } from "../utils/ownedModel";
import { DEFAULT_LEVELS, LevelDef } from "../config/levels";

/**
 * Platform-wide settings. A singleton document (only one row ever exists) that the
 * admin edits and the public site reads. Holds branding, contact details, the home
 * hero copy + intro video, the foundation links, the watermark toggle, and the
 * configurable progression LEVELS (with their cumulative per-category unlock points).
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
  /**
   * Ordered progression levels. Each level's `unlockPoints` is the CUMULATIVE points a
   * user must earn within a category (plus completing a prior-level course) to unlock it.
   * Configurable so new levels can be added without code changes.
   */
  levels: LevelDef[];
}

interface ISettingsModel extends Model<ISettings> {
  getSingleton(): Promise<ISettings>;
}

const levelSchema = new Schema<LevelDef>(
  {
    key: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    label: { type: String, trim: true },
    description: { type: String, trim: true },
    order: { type: Number, required: true, min: 0 },
    unlockPoints: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

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
    levels: { type: [levelSchema], default: () => DEFAULT_LEVELS.map((l) => ({ ...l })) },
  },
  { timestamps: true }
);

/** Returns the one settings doc, creating it with defaults on first access. */
settingsSchema.statics.getSingleton = async function (): Promise<ISettings> {
  const existing = await this.findOne();
  if (existing) {
    // Backfill levels for docs created before the levels field existed.
    if (!existing.levels || existing.levels.length === 0) {
      existing.levels = DEFAULT_LEVELS.map((l) => ({ ...l }));
      await existing.save();
    } else if (existing.levels.some((l: LevelDef) => !l.label)) {
      // Backfill display labels/descriptions onto pre-existing levels by key.
      const byKey = new Map(DEFAULT_LEVELS.map((d) => [d.key, d]));
      existing.levels = existing.levels.map((l: LevelDef) => {
        if (l.label) return l;
        const d = byKey.get(l.key);
        return { ...l, label: d?.label ?? l.name, description: l.description ?? d?.description };
      });
      existing.markModified("levels");
      await existing.save();
    }
    return existing;
  }
  return this.create({});
};

export const Settings = ownedModel<ISettings>(
  "Settings",
  settingsSchema,
  "settings"
) as ISettingsModel;
