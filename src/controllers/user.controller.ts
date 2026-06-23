import { Request, Response } from "express";
import { UserMongoRepository } from "../repositories/user.repository";
import { ApiResponseHelper } from "../utils/apihelper.util";
import { UpdateProfileDTO } from "../dtos/user.dto";
import { z } from "zod";

const userRepository = new UserMongoRepository();

export class UserController {

  // GET /me
  async getMe(req: Request, res: Response) {
    try {
      const user = req.user as any;

      if (!user) {
        return ApiResponseHelper.error(res, "User not found", 404);
      }

      return ApiResponseHelper.success(res, user);
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, 500);
    }
  }

  // PATCH /profile
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

      return ApiResponseHelper.success(res, updated, "Profile updated");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, 500);
    }
  }
}