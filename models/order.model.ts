import { Schema, model, Document, Types } from "mongoose";

export interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
}

export interface IShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface IOrder extends Document {
  userId: Types.ObjectId;
  items: IOrderItem[];
  total: number;
  status: "placed" | "shifted" | "delivered";
  shippingAddress: IShippingAddress;
  invoiceUrl?: string;
  invoicePublicId?: string;
  orderNumber: string;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true }
      }
    ],
    total: { type: Number, required: true },
    status: { type: String, enum: ["placed", "shifted", "delivered"], default: "placed" },
    shippingAddress: {
      name: { type: String, required: true },
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String, required: true }
    },
    invoiceUrl: { type: String },
    invoicePublicId: { type: String },
    orderNumber: { type: String, required: true, unique: true }
  },
  { timestamps: true }
);

export const Order = model<IOrder>("Order", orderSchema);
