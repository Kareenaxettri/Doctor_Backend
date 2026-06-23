import { z } from "zod";

export const UserSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    contactNumber: z.string().min(10, "Contact number is required"),
    email: z.string().email("Invalid email address"),
    gender: z.string().min(1, "Gender is required"),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    profileImage: z.string().nullable().optional()
});

export type UserType = z.infer<typeof UserSchema>;