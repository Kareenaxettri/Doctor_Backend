import mongoose, { Schema, Document } from "mongoose";
import { UserType } from "../types/user.type";

export interface IUser extends UserType, Document {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    role?: "admin" | "user";
    resetPasswordToken?: string | null;
    resetPasswordExpires?: Date | null;
}
const UserMongoSchema: Schema = new Schema<IUser>(
    {
        fullName: { type: String, required: true },
        contactNumber: { type: String, required: true, unique: true },
        phone: { type: String, required: false },
        email: { type: String, required: true, unique: true },
        gender: { type: String, required: true },
        password: { type: String, required: true },
        role: { type: String, enum: ["admin", "user"], default: "user" },
        profileImage: { type: String, required: false, default: null },
        resetPasswordToken: { type: String, default: null },
        resetPasswordExpires: { type: Date, default: null },
    },
    {
        timestamps: true
    }
)
export const UserModel = mongoose.model<IUser>
(
    "User",
    UserMongoSchema
);