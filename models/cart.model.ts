import { Schema, model, Document, Types } from "mongoose";

export interface ICartItem {
  productId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
}

export interface ICart extends Document {
  userId: Types.ObjectId;
  items: ICartItem[];
}

const cartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 }
      }
    ]
  },
  { timestamps: true }
);

export const Cart = model<ICart>("Cart", cartSchema);
