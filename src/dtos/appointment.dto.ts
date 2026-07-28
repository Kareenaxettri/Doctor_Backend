import { z } from "zod";

export const CreateAppointmentDTO = z.object({
  doctorId: z.string().min(1, "Doctor ID is required"),
  appointmentDate: z.string().min(1, "Appointment date is required"),
  appointmentTime: z.string().min(1, "Appointment time is required"),
  symptoms: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
  amount: z.number().min(0).optional(),
  paymentMethod: z.string().optional(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
});

export type CreateAppointmentDTO = z.infer<typeof CreateAppointmentDTO>;

export const UpdateAppointmentDTO = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
  appointmentDate: z.string().optional(),
  appointmentTime: z.string().optional(),
  symptoms: z.string().optional(),
  notes: z.string().optional(),
  amount: z.number().min(0).optional(),
  paymentMethod: z.string().optional(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
});

export type UpdateAppointmentDTO = z.infer<typeof UpdateAppointmentDTO>;
