import { Schema, model, Document, Types } from "mongoose";

export interface IDonationRecord extends Document {
  campaign: Types.ObjectId;
  donorName: string;
  donorEmail: string;
  /** KES-equivalent base amount — used for raisedAmount tracking and aggregated totals. */
  amount: number;
  /** The exact amount the donor typed in their chosen currency. */
  originalAmount: number;
  /** ISO 4217 currency code (e.g. "USD", "KES"). Always stored uppercase. */
  currency: string;
  /** KES per 1 unit of the donor's currency at time of donation. */
  exchangeRate: number;
  donorCountry?: string;
  anonymous: boolean;
  message?: string;
}

const donationRecordSchema = new Schema<IDonationRecord>(
  {
    campaign:       { type: Schema.Types.ObjectId, ref: "DonationCampaign", required: true },
    donorName:      { type: String, required: true },
    donorEmail:     { type: String, required: true },
    amount:         { type: Number, required: true },
    originalAmount: { type: Number, required: true },
    currency:       { type: String, required: true, default: "KES", uppercase: true },
    exchangeRate:   { type: Number, required: true, default: 1 },
    donorCountry:   { type: String },
    anonymous:      { type: Boolean, default: false },
    message:        { type: String },
  },
  { timestamps: true }
);

export const DonationRecord = model<IDonationRecord>(
  "DonationRecord",
  donationRecordSchema
);
