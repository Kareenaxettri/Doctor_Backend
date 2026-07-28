import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { UserMongoRepository } from "../repositories/user.repository";
import { ApiResponseHelper } from "../utils/apihelper.util";
import { UpdateProfileDTO } from "../dtos/user.dto";
import { z } from "zod";

const userRepository = new UserMongoRepository();

function toPublicUser(user: any) {
  return {
    id: user._id?.toString() || user.id?.toString?.() || user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone ?? user.contactNumber ?? null,
    contactNumber: user.contactNumber ?? null,
    gender: user.gender ?? null,
    profileImage: user.profileImage ?? null,
    role: user.role ?? "user",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function deleteOldProfileImage(imagePath: string | null | undefined) {
  if (!imagePath) return;
  try {
    const fullPath = path.join(process.cwd(), imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch {

  }
}

export class UserController {
  async getMe(req: Request, res: Response) {
    try {
      const user = req.user as any;

      if (!user) {
        return ApiResponseHelper.error(res, "User not found", 404);
      }

      return ApiResponseHelper.success(res, toPublicUser(user));
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, 500);
    }
  }
  
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?._id?.toString();

      if (!userId) {
        return ApiResponseHelper.error(res, "Unauthorized", 401);
      }

      const { fullName, email, phone, contactNumber, gender } = req.body;

      const phoneValue = phone ?? contactNumber;

      const profileData: any = {};

      if (fullName) profileData.fullName = fullName;
      if (email) profileData.email = email;
      if (phoneValue) {
        profileData.phone = phoneValue;
        profileData.contactNumber = phoneValue;
      }
      if (gender) profileData.gender = gender;

      if (req.file) {
        const existingUser = await userRepository.getUserById(userId);
        if (existingUser?.profileImage) {
          deleteOldProfileImage(existingUser.profileImage);
        }
        profileData.profileImage = `/uploads/profile/${req.file.filename}`;
      }

      const parsed = UpdateProfileDTO.safeParse(profileData);

      if (!parsed.success) {
        return ApiResponseHelper.error(
          res,
          z.prettifyError(parsed.error),
          400
        );
      }

      const updated = await userRepository.update(userId, parsed.data);

      if (!updated) {
        return ApiResponseHelper.error(res, "User not found", 404);
      }

      return ApiResponseHelper.success(res, toPublicUser(updated), "Profile updated");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, 500);
    }
  }
}