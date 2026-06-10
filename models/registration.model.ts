import { Schema, model, Document, Types } from "mongoose";

export interface IRegistration extends Document {
    registrationNumber: string;
    userId?: Types.ObjectId | null;
    isUsed: boolean;
    isActive: boolean;
    isTemporary: boolean;
}

const registrationSchema = new Schema<IRegistration>(
    {
        registrationNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        isUsed: {
            type: Boolean,
            default: false,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        isTemporary: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export const Registration = model<IRegistration>(
    "Registration",
    registrationSchema
);