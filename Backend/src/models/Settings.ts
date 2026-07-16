import { Schema, Document, Model, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";
import { DEFAULT_LEVELS, LevelDef } from "../config/levels";
import { DEFAULT_TERMS } from "../config/terms";

/**
 * Platform-wide settings. A singleton document (only one row ever exists) that the
 * admin edits and the public site reads. Holds branding, contact details, the home
 * hero copy + intro video, the foundation links, the watermark toggle, and the
 * configurable progression LEVELS (with their cumulative per-category unlock points).
 */
/** One person whose signature can be printed on completion certificates. */
export interface ICertificateSignatory {
  _id?: Types.ObjectId;
  name: string;
  roleLine1?: string;
  roleLine2?: string;
  /** Uploaded background-less (transparent) PNG signature (CDN url + storage key). */
  signatureUrl?: string;
  signaturePublicId?: string;
  /** Original filename / size / format of the uploaded signature (shown after upload). */
  signatureName?: string;
  signatureSize?: number;
  signatureFormat?: string;
}

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
    /** Optional YouTube URL (legacy fallback). */
    videoUrl?: string;
    /** Uploaded intro video shown in the "See the academy in action" band (CDN url + key). */
    introVideoUrl?: string;
    introVideoPublicId?: string;
  };
  foundation: {
    websiteUrl?: string;
    youtubeUrl?: string;
    /** Uploaded foundation image shown on the home page (CDN url + storage key). */
    imageUrl?: string;
    imagePublicId?: string;
    /** Original filename / size / format of the uploaded image (shown after upload). */
    imageName?: string;
    imageSize?: number;
    imageFormat?: string;
  };
  /**
   * Certificate branding, editable by the admin. `signatories` is the pool of people
   * whose signature can appear on certificates — each course picks which of them (up
   * to three) sign its certificate. The flat coachName/roleLine/signature fields are
   * the LEGACY single signatory kept only as the migration source for `signatories`;
   * new code must read/write `signatories`.
   */
  certificate: {
    coachName?: string;
    roleLine1?: string;
    roleLine2?: string;
    signatureUrl?: string;
    signaturePublicId?: string;
    /** Original filename / size / format of the uploaded signature (shown after upload). */
    signatureName?: string;
    signatureSize?: number;
    signatureFormat?: string;
    signatories: ICertificateSignatory[];
  };
  /** Footer copy edited from the admin panel. */
  footer: {
    about?: string;
  };
  /** Standalone "About us" page content — separate from the short footer blurb. */
  about: {
    title?: string;
    intro?: string;
    body?: string;
    /** Uploaded images shown on the About page (CDN url + storage key + upload metadata). */
    images: { url?: string; publicId?: string; name?: string; size?: number; format?: string }[];
  };
  /** Social profile URLs rendered as animated icons in the footer. Empty = hidden. */
  socials: {
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    twitter?: string;
    linkedin?: string;
  };
  /** Display order for each social icon (lower = first). Lets admins re-order icons. */
  socialOrder: {
    whatsapp?: number;
    instagram?: number;
    facebook?: number;
    youtube?: number;
    twitter?: number;
    linkedin?: number;
  };
  /** Configurable footer link columns (e.g. Sitemap, Resources). */
  footerLinks: { title: string; items: { label: string; href: string }[] }[];
  /**
   * Terms & Conditions (Consent and Participation Agreement) every new user must
   * accept in the registration pop-up. Editable from the admin panel.
   */
  terms: {
    content?: string;
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

/** Default footer link columns, seeded so the footer reads well out of the box. */
export const DEFAULT_FOOTER_LINKS = [
  {
    title: "Sitemap",
    items: [
      { label: "Programs", href: "/catalog" },
      { label: "Events", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Donations", href: "/about" },
      { label: "Blogs", href: "/about" },
    ],
  },
];

const footerLinkGroupSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    items: {
      type: [
        new Schema(
          { label: { type: String, trim: true }, href: { type: String, trim: true } },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { _id: false }
);

const signatorySchema = new Schema<ICertificateSignatory>({
  name: { type: String, required: true, trim: true },
  roleLine1: { type: String, trim: true },
  roleLine2: { type: String, trim: true },
  signatureUrl: { type: String, trim: true },
  signaturePublicId: { type: String, trim: true },
  signatureName: { type: String, trim: true },
  signatureSize: { type: Number },
  signatureFormat: { type: String, trim: true },
});

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
      introVideoUrl: { type: String, trim: true },
      introVideoPublicId: { type: String, trim: true },
    },
    foundation: {
      websiteUrl: { type: String, trim: true },
      youtubeUrl: { type: String, trim: true },
      imageUrl: { type: String, trim: true },
      imagePublicId: { type: String, trim: true },
      imageName: { type: String, trim: true },
      imageSize: { type: Number },
      imageFormat: { type: String, trim: true },
    },
    certificate: {
      coachName: { type: String, trim: true, default: "Coach David Obuya" },
      roleLine1: { type: String, trim: true, default: "High Performance Coach Level 3" },
      roleLine2: { type: String, trim: true, default: "ICC Tutor — Africa" },
      signatureUrl: { type: String, trim: true },
      signaturePublicId: { type: String, trim: true },
      signatureName: { type: String, trim: true },
      signatureSize: { type: Number },
      signatureFormat: { type: String, trim: true },
      signatories: { type: [signatorySchema], default: [] },
    },
    footer: {
      about: { type: String, trim: true },
    },
    about: {
      title: { type: String, trim: true },
      intro: { type: String, trim: true },
      body: { type: String, trim: true },
      images: {
        type: [
          new Schema(
            {
              url: { type: String, trim: true },
              publicId: { type: String, trim: true },
              name: { type: String, trim: true },
              size: { type: Number },
              format: { type: String, trim: true },
            },
            { _id: false }
          ),
        ],
        default: [],
      },
    },
    socials: {
      whatsapp: { type: String, trim: true },
      instagram: { type: String, trim: true },
      facebook: { type: String, trim: true },
      youtube: { type: String, trim: true },
      twitter: { type: String, trim: true },
      linkedin: { type: String, trim: true },
    },
    socialOrder: {
      whatsapp: { type: Number },
      instagram: { type: Number },
      facebook: { type: Number },
      youtube: { type: Number },
      twitter: { type: Number },
      linkedin: { type: Number },
    },
    footerLinks: { type: [footerLinkGroupSchema], default: () => DEFAULT_FOOTER_LINKS.map((g) => ({ ...g })) },
    terms: {
      content: { type: String, trim: true, default: DEFAULT_TERMS },
    },
    watermark: {
      enabled: { type: Boolean, default: true },
      opacity: { type: Number, default: 0.04, min: 0, max: 1 },
    },
    levels: { type: [levelSchema], default: () => DEFAULT_LEVELS.map((l) => ({ ...l })) },
  },
  { timestamps: true }
);

/** Seeds the signatories pool from the legacy single-signatory fields (or defaults). */
function seedSignatories(doc: ISettings): void {
  const c = doc.certificate;
  c.signatories = [
    {
      name: c.coachName || "Coach David Obuya",
      roleLine1: c.roleLine1 || "High Performance Coach Level 3",
      roleLine2: c.roleLine2 || "ICC Tutor — Africa",
      signatureUrl: c.signatureUrl,
      signaturePublicId: c.signaturePublicId,
      signatureName: c.signatureName,
      signatureSize: c.signatureSize,
      signatureFormat: c.signatureFormat,
    },
  ];
  doc.markModified("certificate");
}

/** Returns the one settings doc, creating it with defaults on first access. */
settingsSchema.statics.getSingleton = async function (): Promise<ISettings> {
  const existing = await this.findOne();
  if (existing) {
    // Backfill: promote the legacy single signatory into the signatories pool.
    if (!existing.certificate?.signatories?.length) {
      seedSignatories(existing);
      await existing.save();
    }
    // Backfill default footer columns for docs created before the field existed.
    if (!existing.footerLinks || existing.footerLinks.length === 0) {
      existing.footerLinks = DEFAULT_FOOTER_LINKS.map((g) => ({ ...g }));
      existing.markModified("footerLinks");
      await existing.save();
    }
    // Backfill terms for docs created before the terms field existed.
    if (!existing.terms?.content) {
      existing.terms = { content: DEFAULT_TERMS };
      existing.markModified("terms");
      await existing.save();
    }
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
  const created = await this.create({});
  seedSignatories(created);
  await created.save();
  return created;
};

export const Settings = ownedModel<ISettings>(
  "Settings",
  settingsSchema,
  "settings"
) as ISettingsModel;
