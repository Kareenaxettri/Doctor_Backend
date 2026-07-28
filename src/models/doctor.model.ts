import mongoose, { Schema, Document } from "mongoose";

export interface IDoctor extends Document {
  _id: mongoose.Types.ObjectId;
  doctorCode: string;
  fullName: string;
  gender?: string;
  specialization: string;
  experienceYears: number;
  consultationFee: number;
  bio?: string;
  photo?: string | null;
  clinic?: string;
  contactNumber?: string;
  rating?: number;
  availability?: string;
  availableDays?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema<IDoctor>(
  {
    doctorCode: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    gender: { type: String, enum: ["male", "female", "other"], required: false },
    specialization: { type: String, required: true, trim: true },
    experienceYears: { type: Number, required: true, min: 0 },
    consultationFee: { type: Number, required: true, min: 0 },
    bio: { type: String, default: "" },
    photo: { type: String, default: null },
    clinic: { type: String, default: "" },
    contactNumber: { type: String, default: "" },
    rating: { type: Number, default: 4.8, min: 0, max: 5 },
    availability: { type: String, default: "Available today" },
    availableDays: { type: [String], default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const DoctorModel = mongoose.model<IDoctor>("Doctor", DoctorSchema);
