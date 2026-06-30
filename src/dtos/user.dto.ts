import { z } from "zod";

export const CreateUserDTO = z.object({
    fullName: z.string().min(1),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    username: z.string().optional(),
    email: z.string().email(),
    phone: z.string().optional(),
    contactNumber: z.string().optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    password: z.string().min(6),
    confirmPassword: z.string().optional(),
    role: z.enum(["user", "admin"]).optional(),
});
export type CreateUserDTO = z.infer<typeof CreateUserDTO>;

export const LoginUserDTO = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});
export type LoginUserDTO = z.infer<typeof LoginUserDTO>;

export const UpdateProfileDTO = z.object({
    fullName: z.string().min(1).optional(),
    phone:    z.string().min(7).optional(),
    contactNumber: z.string().min(7).optional(),
    email:    z.string().email().optional(),
    gender:   z.enum(["male", "female", "other"]).optional(),
    profileImage: z.string().nullable().optional(),
});
export type UpdateProfileDTO = z.infer<typeof UpdateProfileDTO>;

export const UpdatePasswordDTO = z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6),
});
export type UpdatePasswordDTO = z.infer<typeof UpdatePasswordDTO>;

// ---- Admin: user management ----

export const AdminCreateUserDTO = z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    contactNumber: z.string().min(7, "Contact number is required"),
    phone: z.string().optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    role: z.enum(["user", "admin"]).optional(),
});
export type AdminCreateUserDTO = z.infer<typeof AdminCreateUserDTO>;

export const AdminUpdateUserDTO = z.object({
    fullName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    contactNumber: z.string().min(7).optional(),
    phone: z.string().optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    password: z.string().min(6).optional(),
    role: z.enum(["user", "admin"]).optional(),
});
export type AdminUpdateUserDTO = z.infer<typeof AdminUpdateUserDTO>;