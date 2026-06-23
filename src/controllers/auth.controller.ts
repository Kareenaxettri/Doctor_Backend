import { Request, Response } from "express";
import bcryptjs from "bcryptjs";
import { UserMongoRepository } from "../repositories/user.repository";
import { ApiResponseHelper } from "../utils/apihelper.util";
import { z } from "zod";
import { UpdatePasswordDTO } from "../dtos/user.dto";
import jwt from "jsonwebtoken";

const userRepository = new UserMongoRepository();

export class AuthController {

  // POST /register
  async register(req: Request, res: Response) {
    try {
      const {
        fullName,
        email,
        contactNumber,
        gender,
        password,
      } = req.body;

      if (
        !fullName ||
        !email ||
        !contactNumber ||
        !gender ||
        !password
      ) {
        return ApiResponseHelper.error(
          res,
          "All fields are required",
          400
        );
      }

      const existingEmail =
        await userRepository.getUserByEmail(email);

      if (existingEmail) {
        return ApiResponseHelper.error(
          res,
          "Email already exists",
          400
        );
      }

      const existingContact =
        await userRepository.getUserByContactNumber(
          contactNumber
        );

      if (existingContact) {
        return ApiResponseHelper.error(
          res,
          "Contact number already exists",
          400
        );
      }

      const hashedPassword = await bcryptjs.hash(
        password,
        10
      );

      const user = await userRepository.createUser({
        fullName,
        email,
        contactNumber,
        gender,
        password: hashedPassword,
        role: "user",
      });

      return ApiResponseHelper.success(
        res,
        {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          contactNumber: user.contactNumber,
          gender: user.gender,
        },
        "User registered successfully"
      );

    } catch (error: any) {
      return ApiResponseHelper.error(
        res,
        error.message,
        500
      );
    }
  }

  async login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const user = await userRepository.getUserByEmail(email);

    if (!user) {
      return ApiResponseHelper.error(
        res,
        "Invalid email or password",
        400
      );
    }

    const match = await bcryptjs.compare(
      password,
      user.password
    );

    if (!match) {
      return ApiResponseHelper.error(
        res,
        "Invalid email or password",
        400
      );
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.SECRET_KEY as string,
      {
        expiresIn: "7d",
      }
    );

    return ApiResponseHelper.success(
      res,
      {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          contactNumber: user.contactNumber,
          gender: user.gender,
          role: user.role,
        },
      },
      "Login successful"
    );

  } catch (error: any) {
    return ApiResponseHelper.error(
      res,
      error.message,
      500
    );
  }
}

  // GET /whoami
  async whoAmI(req: Request, res: Response) {
    try {
      const user = req.user as any;

      if (!user) {
        return ApiResponseHelper.error(res, "User not found", 404);
      }

      return ApiResponseHelper.success(res, {
        id: user._id?.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone ?? user.contactNumber ?? null,
        contactNumber: user.contactNumber ?? null,
        gender: user.gender ?? null,
        profileImage: user.profileImage ?? null,
        role: user.role ?? "user",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });

    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, 500);
    }
  }

  // PATCH /update-password
  async updatePassword(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?._id?.toString();

      if (!userId) {
        return ApiResponseHelper.error(res, "Unauthorized", 401);
      }

      const parsed = UpdatePasswordDTO.safeParse(req.body);

      if (!parsed.success) {
        return ApiResponseHelper.error(
          res,
          z.prettifyError(parsed.error),
          400
        );
      }

      const { currentPassword, newPassword } = parsed.data;

      const user = await userRepository.getUserById(userId);

      if (!user) {
        return ApiResponseHelper.error(res, "User not found", 404);
      }

      const match = await bcryptjs.compare(
        currentPassword,
        user.password
      );

      if (!match) {
        return ApiResponseHelper.error(
          res,
          "Current password is incorrect",
          400
        );
      }

      const hashed = await bcryptjs.hash(
        newPassword,
        10
      );

      await userRepository.update(userId, {
        password: hashed,
      } as any);

      return ApiResponseHelper.success(
        res,
        null,
        "Password updated successfully"
      );

    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, 500);
    }
  }
}