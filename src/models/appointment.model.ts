import mongoose, { Schema, Document } from "mongoose";

export interface IAppointment extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  doctorName?: string;
  specialty?: string;
  appointmentDate: Date;
  appointmentTime: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  symptoms?: string;
  notes?: string;
  amount?: number;
  paymentMethod?: string;
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    doctorName: { type: String, default: "" },
    specialty: { type: String, default: "" },
    appointmentDate: { type: Date, required: true },
    appointmentTime: { type: String, required: true },
    status: { type: String, enum: ["pending", "confirmed", "cancelled", "completed"], default: "pending" },
    symptoms: { type: String, default: "" },
    notes: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    paymentMethod: { type: String, default: "" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  },
  { timestamps: true }
);

AppointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
AppointmentSchema.index({ userId: 1 });

export const AppointmentModel = mongoose.model<IAppointment>("Appointment", AppointmentSchema);
