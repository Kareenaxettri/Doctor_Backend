import { z } from "zod";

export const CreatePaymentDTO = z.object({
  appointmentId: z.string().min(1, "Appointment ID is required"),
  doctorId: z.string().min(1, "Doctor ID is required"),
  amount: z.number().min(0),
  currency: z.string().optional(),
  paymentMethod: z.string().optional(),
  transactionId: z.string().optional(),
  status: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
});

export type CreatePaymentDTO = z.infer<typeof CreatePaymentDTO>;

export const UpdatePaymentDTO = z.object({
  status: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
  paymentMethod: z.string().optional(),
  transactionId: z.string().optional(),
});

export type UpdatePaymentDTO = z.infer<typeof UpdatePaymentDTO>;
