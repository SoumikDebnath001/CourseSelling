import { Schema, model, Document, Types } from "mongoose";


export interface IAdmin extends Document {
    name: string;
    email: string;
    password: string;
    token?: string;
    isDeleted: boolean;
}

const adminSchema = new Schema<IAdmin>(
    {
        name: { type: String, required: true },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },

        password: { type: String, required: true, select: false },

        token: { type: String, select: false },

        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);
export const Admin = model<IAdmin>("Admin", adminSchema);