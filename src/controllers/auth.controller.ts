import { Request, Response } from "express";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { UserMongoRepository } from "../repositories/user.repository";
import { ApiResponseHelper } from "../utils/apihelper.util";
import { z } from "zod";
import { UpdatePasswordDTO } from "../dtos/user.dto";
import jwt from "jsonwebtoken";
import { SECRET_KEY, CLIENT_URL } from "../configs/constant";
import { EmailService, SMTP_CONFIGURED } from "../services/email.service";

const userRepository = new UserMongoRepository();

export class AuthController {
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

      if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return ApiResponseHelper.error(
          res,
          "Invalid email format",
          400
        );
      }

      if (typeof password !== "string" || password.length < 6) {
        return ApiResponseHelper.error(
          res,
          "Password must be at least 6 characters long",
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
          id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          contactNumber: user.contactNumber,
          gender: user.gender,
        },
        "User registered successfully",
        201
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

    if (!email || !password) {
      return ApiResponseHelper.error(
        res,
        "Email and password are required",
        400
      );
    }

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
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      SECRET_KEY,
      {
        expiresIn: "7d",
      }
    );

    return ApiResponseHelper.success(
      res,
      {
        token,
        user: {
          id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          contactNumber: user.contactNumber,
          gender: user.gender,
          role: user.role,
          profileImage: user.profileImage ?? null,
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

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email || typeof email !== "string") {
        return ApiResponseHelper.error(res, "Email address is required", 400);
      }

      const trimmedEmail = email.trim().toLowerCase();
      const user = await userRepository.getUserByEmail(trimmedEmail);

      const successMessage = "If an account with that email exists, a password reset link has been sent.";

      if (!user) {
        console.log(`[ForgotPassword] Password reset requested for non-existent email: ${trimmedEmail}`);
        return ApiResponseHelper.success(res, null, successMessage);
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

      await userRepository.update(user._id.toString(), {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetPasswordExpires,
      } as any);

      const resetUrl = `${CLIENT_URL}/reset-password?token=${resetToken}`;

      console.log(`[ForgotPassword] Generating reset token for: ${user.email} (${user.fullName})`);
      console.log(`[ForgotPassword] Reset URL: ${resetUrl}`);
      console.log(`[ForgotPassword] Token expires at: ${resetPasswordExpires.toISOString()}`);

      try {
        const emailSent = await EmailService.sendPasswordResetEmail(user.email, resetUrl, user.fullName);
        if (!emailSent) {
          console.error(`[ForgotPassword] Email delivery failed for: ${user.email}`);
          console.error(`[ForgotPassword] Reset URL (use manually): ${resetUrl}`);
        } else {
          console.log(`[ForgotPassword] Password reset email sent successfully to: ${user.email}`);
        }
      } catch (emailErr: any) {
        console.error(`[ForgotPassword] Email error for: ${user.email}`, emailErr.message);
        console.error(`[ForgotPassword] Reset URL (use manually): ${resetUrl}`);
      }

      return ApiResponseHelper.success(
        res,
        {
          resetToken: process.env.NODE_ENV === "test" ? resetToken : undefined,
          resetUrl: !SMTP_CONFIGURED ? resetUrl : undefined,
        },
        successMessage
      );
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, 500);
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return ApiResponseHelper.error(res, "Token and new password are required", 400);
      }

      if (typeof newPassword !== "string" || newPassword.length < 6) {
        return ApiResponseHelper.error(res, "New password must be at least 6 characters long", 400);
      }

      const user = await userRepository.getUserByResetToken(token);

      if (!user) {
        console.log("[ResetPassword] Invalid or expired reset token attempt");
        return ApiResponseHelper.error(res, "Password reset token is invalid or has expired", 400);
      }

      console.log(`[ResetPassword] Valid reset token for user: ${user.email}`);

      const hashedPassword = await bcryptjs.hash(newPassword, 10);

      await userRepository.update(user._id.toString(), {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      } as any);

      console.log(`[ResetPassword] Password reset successfully for user: ${user.email}`);

      return ApiResponseHelper.success(res, null, "Password reset successfully. You can now log in.");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, 500);
    }
  }
}
