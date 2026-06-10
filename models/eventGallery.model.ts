import { Schema, model, Document, Types } from "mongoose";

export interface IGalleryPhoto {
  _id?: any;
  url: string;
  publicId: string;
  caption?: string;
}

export interface IEventGallery extends Document {
  event: Types.ObjectId;
  photos: IGalleryPhoto[];
}

const galleryPhotoSchema = new Schema<IGalleryPhoto>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    caption: { type: String },
  },
  { _id: true }
);

const eventGallerySchema = new Schema<IEventGallery>(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true, unique: true },
    photos: { type: [galleryPhotoSchema], default: [] },
  },
  { timestamps: true }
);

export const EventGallery = model<IEventGallery>("EventGallery", eventGallerySchema);
