import { Request, Response } from "express";
import bcryptjs from "bcryptjs";
import { z } from "zod";
import { ApiResponseHelper } from "../utils/apihelper.util";
import { AdminCreateUserDTO, AdminUpdateUserDTO } from "../dtos/user.dto";
import { UserMongoRepository } from "../repositories/user.repository";

const userRepository = new UserMongoRepository();

function toPublicUser(user: any) {
  if (!user) return null;
  return {
    id: user._id?.toString?.() || user.id?.toString?.() || user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone ?? null,
    contactNumber: user.contactNumber ?? null,
    gender: user.gender ?? null,
    role: user.role ?? "user",
    profileImage: user.profileImage ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export class AdminUserController {
  async list(req: Request, res: Response) {
    try {
      const page = Math.max(1, parseInt((req.query.page as string) || "1", 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || "10", 10) || 10));
      const search = (req.query.search as string) || "";
      const result = await userRepository.getPaginated(page, limit, search);
      const data = result.data.map(toPublicUser);
      return ApiResponseHelper.success(
        res,
        data,
        "Users fetched successfully",
        200,
        { page, limit, total: result.total }
      );
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message || "Failed to list users", 500);
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const user = await userRepository.getUserById(String(req.params.id));
      if (!user) {
        return ApiResponseHelper.error(res, "User not found", 404);
      }
      return ApiResponseHelper.success(res, toPublicUser(user), "User fetched successfully");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message || "Failed to fetch user", 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const parsed = AdminCreateUserDTO.safeParse(req.body || {});
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
      const createdUser = await userRepository.createUser({
        ...parsed.data,
        password: hashedPassword,
      });

      return ApiResponseHelper.success(res, toPublicUser(createdUser), "Admin user created successfully", 201);
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message || "Failed to create user", 500);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const parsed = AdminUpdateUserDTO.safeParse(req.body || {});
      if (!parsed.success) {
        return ApiResponseHelper.error(res, z.prettifyError(parsed.error), 400);
      }

      const userId = String(req.params.id);
      const existingUser = await userRepository.getUserById(userId);
      if (!existingUser) {
        return ApiResponseHelper.error(res, "User not found", 404);
      }

      if (parsed.data.email && parsed.data.email !== existingUser.email) {
        const duplicateEmail = await userRepository.getUserByEmail(parsed.data.email);
        if (duplicateEmail) {
          return ApiResponseHelper.error(res, "Email already exists", 400);
        }
      }

      if (parsed.data.contactNumber && parsed.data.contactNumber !== existingUser.contactNumber) {
        const duplicateContact = await userRepository.getUserByContactNumber(parsed.data.contactNumber);
        if (duplicateContact) {
          return ApiResponseHelper.error(res, "Contact number already exists", 400);
        }
      }

      const updatePayload: Record<string, any> = { ...parsed.data };
      if (updatePayload.password) {
        updatePayload.password = await bcryptjs.hash(updatePayload.password, 10);
      }

      const updatedUser = await userRepository.update(userId, updatePayload);
      if (!updatedUser) {
        return ApiResponseHelper.error(res, "User not found", 404);
      }

      return ApiResponseHelper.success(res, toPublicUser(updatedUser), "User updated successfully");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message || "Failed to update user", 500);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const deleted = await userRepository.delete(String(req.params.id));
      if (!deleted) {
        return ApiResponseHelper.error(res, "User not found", 404);
      }
      return ApiResponseHelper.success(res, null, "User deleted successfully");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message || "Failed to delete user", 500);
    }
  }
}
