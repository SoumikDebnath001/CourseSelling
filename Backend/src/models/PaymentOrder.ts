import { Schema, Document, Types } from "mongoose";
import { ownedModel } from "../utils/ownedModel";

/**
 * A payment attempt for a paid course, created BEFORE redirecting the payer to
 * Pesapal. The enrollment itself is only created once GetTransactionStatus
 * confirms COMPLETED — never from callback query params.
 */
export interface IPaymentOrder extends Document {
  _id: Types.ObjectId;
  /** ObjectId of an existing `users` document (read-only ref). */
  userId: Types.ObjectId;
  course: Types.ObjectId;
  /** Our unguessable order reference, sent to Pesapal as the merchant id. */
  merchantRef: string;
  /** Pesapal's tracking id for this order (set right after SubmitOrderRequest). */
  orderTrackingId?: string;
  provider: "pesapal";
  /** Server-side course price at initiation time — the amount the gateway charges. */
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "reversed";
  /** From GetTransactionStatus once settled. */
  paymentMethod?: string;
  confirmationCode?: string;
  /** Snapshot of the payer at initiation — the IPN handler has no auth context. */
  payerEmail?: string;
  payerName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentOrderSchema = new Schema<IPaymentOrder>(
  {
    userId: { type: Schema.Types.ObjectId, required: true }, // -> existing users._id
    course: { type: Schema.Types.ObjectId, ref: "Ca_Course", required: true },
    merchantRef: { type: String, required: true, unique: true },
    orderTrackingId: { type: String, index: true },
    provider: { type: String, enum: ["pesapal"], default: "pesapal" },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    status: { type: String, enum: ["pending", "paid", "failed", "reversed"], default: "pending" },
    paymentMethod: { type: String },
    confirmationCode: { type: String },
    payerEmail: { type: String },
    payerName: { type: String },
  },
  { timestamps: true }
);

paymentOrderSchema.index({ userId: 1, course: 1, status: 1 });

export const PaymentOrder = ownedModel<IPaymentOrder>("PaymentOrder", paymentOrderSchema, "paymentorders");
