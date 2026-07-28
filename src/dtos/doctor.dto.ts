import { z } from "zod";

export const CreateDoctorDTO = z.object({
  doctorCode: z.string().min(1, "Doctor code is required"),
  fullName: z.string().min(1, "Doctor name is required"),
  gender: z.enum(["male", "female", "other"]).optional(),
  specialization: z.string().min(1, "Specialization is required"),
  experienceYears: z.number().min(0),
  consultationFee: z.number().min(0),
  bio: z.string().optional(),
  photo: z.string().optional(),
  clinic: z.string().optional(),
  contactNumber: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  availability: z.string().optional(),
  availableDays: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export type CreateDoctorDTO = z.infer<typeof CreateDoctorDTO>;

export const UpdateDoctorDTO = z.object({
  fullName: z.string().min(1).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  specialization: z.string().min(1).optional(),
  experienceYears: z.number().min(0).optional(),
  consultationFee: z.number().min(0).optional(),
  bio: z.string().optional(),
  photo: z.string().optional(),
  clinic: z.string().optional(),
  contactNumber: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  availability: z.string().optional(),
  availableDays: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateDoctorDTO = z.infer<typeof UpdateDoctorDTO>;
