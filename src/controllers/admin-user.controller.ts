import { Request, Response } from "express";
import bcryptjs from "bcryptjs";
import { z } from "zod";
import { UserMongoRepository } from "../repositories/user.repository";
import { ApiResponseHelper } from "../utils/apihelper.util";
import { AdminCreateUserDTO, AdminUpdateUserDTO } from "../dtos/user.dto";
import { IUser } from "../models/user.model";

const userRepository = new UserMongoRepository();

function toPublicUser(user: IUser) {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    contactNumber: user.contactNumber,
    phone: user.phone ?? null,
    gender: user.gender,
    role: user.role ?? "user",
    profileImage: user.profileImage ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class AdminUserController {
  // GET /api/v1/admin/users
  async list(req: Request, res: Response) {
    try {
      const page = Math.max(1, parseInt((req.query.page as string) || "1", 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || "10", 10) || 10));
      const search = (req.query.search as string) || "";

      const { data, total } = await userRepository.getPaginated(page, limit, search);

      const totalPages = Math.max(1, Math.ceil(total / limit));

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Users fetched successfully",
        data: data.map(toPublicUser),
        meta: { page, limit, total, totalPages },
      });
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, 500);
    }
  }

  // GET /api/v1/admin/users/:id
  async getOne(req: Request, res: Response) {
    try {
      const user = await userRepository.getUserById((req.params.id as string));
      if (!user) {
        return ApiResponseHelper.error(res, "User not found", 404);
      }
      return ApiResponseHelper.success(res, toPublicUser(user));
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, 500);
    }
  }

  // POST /api/v1/admin/users
  async create(req: Request, res: Response) {
    try {
      const parsed = AdminCreateUserDTO.safeParse(req.body);
      if (!parsed.success) {
        return ApiResponseHelper.error(res, z.prettifyError(parsed.error), 400);
      }

      const existingEmail = await userRepository.getUserByEmail(parsed.data.email);
      if (existingEmail) {
        return ApiResponseHelper.error(res, "Email already exists", 400);
      }

      const existingContact = await userRepository.getUserByContactNumber(parsed.data.contactNumber);
      if (existingContact) {
        return ApiResponseHelper.error(res, "Contact number already exists", 400);
      }

      const hashedPassword = await bcryptjs.hash(parsed.data.password, 10);

      const created = await userRepository.createUser({
        ...parsed.data,
        password: hashedPassword,
        role: parsed.data.role || "user",
      });

      return ApiResponseHelper.success(res, toPublicUser(created), "User created successfully", 201);
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, 500);
    }
  }

  // PUT/PATCH /api/v1/admin/users/:id
  async update(req: Request, res: Response) {
    try {
      const parsed = AdminUpdateUserDTO.safeParse(req.body);
      if (!parsed.success) {
        return ApiResponseHelper.error(res, z.prettifyError(parsed.error), 400);
      }

      const existing = await userRepository.getUserById((req.params.id as string));
      if (!existing) {
        return ApiResponseHelper.error(res, "User not found", 404);
      }

      const updateData: Record<string, any> = { ...parsed.data };

      if (parsed.data.email && parsed.data.email !== existing.email) {
        const existingEmail = await userRepository.getUserByEmail(parsed.data.email);
        if (existingEmail) {
          return ApiResponseHelper.error(res, "Email already exists", 400);
        }
      }

      if (parsed.data.contactNumber && parsed.data.contactNumber !== existing.contactNumber) {
        const existingContact = await userRepository.getUserByContactNumber(parsed.data.contactNumber);
        if (existingContact) {
          return ApiResponseHelper.error(res, "Contact number already exists", 400);
        }
      }

      if (parsed.data.password) {
        updateData.password = await bcryptjs.hash(parsed.data.password, 10);
      }

      const updated = await userRepository.update((req.params.id as string), updateData);
      if (!updated) {
        return ApiResponseHelper.error(res, "User not found", 404);
      }

      return ApiResponseHelper.success(res, toPublicUser(updated), "User updated successfully");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, 500);
    }
  }

  // DELETE /api/v1/admin/users/:id
  async remove(req: Request, res: Response) {
    try {
      const reqUser = req.user as any;
      if (reqUser?._id?.toString() === (req.params.id as string)) {
        return ApiResponseHelper.error(res, "You cannot delete your own account", 400);
      }

      const deleted = await userRepository.delete((req.params.id as string));
      if (!deleted) {
        return ApiResponseHelper.error(res, "User not found", 404);
      }

      return ApiResponseHelper.success(res, null, "User deleted successfully");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, 500);
    }
  }
}
