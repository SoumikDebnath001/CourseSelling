import { Schema, model, Document } from "mongoose";

export interface IHeroSlide extends Document {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaEnabled: boolean;
  cta2Label?: string;
  cta2Href?: string;
  cta2Enabled: boolean;
  imageUrl?: string;
  imagePublicId?: string;
  order: number;
  isActive: boolean;
}

const heroSlideSchema = new Schema<IHeroSlide>(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    ctaLabel: { type: String },
    ctaHref: { type: String },
    ctaEnabled: { type: Boolean, default: true },
    cta2Label: { type: String },
    cta2Href: { type: String },
    cta2Enabled: { type: Boolean, default: true },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const HeroSlide = model<IHeroSlide>("HeroSlide", heroSlideSchema);
