import { z } from "zod";

export const NotificationPreferencesDTO = z.object({
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
  appointmentReminders: z.boolean().optional(),
  bookingConfirmations: z.boolean().optional(),
  cancellations: z.boolean().optional(),
  promotions: z.boolean().optional(),
});

export const UpdatePreferencesDTO = z.object({
  notifications: NotificationPreferencesDTO.optional(),
  theme: z.enum(["light", "dark"]).optional(),
});

export const VerifyWalletCredentialsDTO = z.object({
  contactNumber: z.string().min(10, "Mobile number is required"),
  password: z.string().min(1, "Password is required"),
  paymentMethod: z.enum(["esewa", "khalti", "fonepay"]),
  amount: z.number().min(0),
});

export const SendPaymentOtpDTO = z.object({
  channel: z.enum(["email", "sms"]).optional().default("email"),
});

export const VerifyPaymentOtpDTO = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});
