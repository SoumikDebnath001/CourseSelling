import { Schema, model, Document } from "mongoose";

export interface IProductImage {
  url: string;
  publicId: string;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  images: IProductImage[];
  price: number;
  stock: number;
  category: string;
  isActive: boolean;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true }
      }
    ],
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    category: { type: String, required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Product = model<IProduct>("Product", productSchema);
