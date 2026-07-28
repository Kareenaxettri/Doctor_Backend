import { Request, Response } from "express";
import { z } from "zod";
import { ApiResponseHelper } from "../utils/apihelper.util";
import { PaymentVerificationService } from "../services/payment-verification.service";
import { VerifyWalletCredentialsDTO, SendPaymentOtpDTO, VerifyPaymentOtpDTO } from "../dtos/preferences.dto";
import { HttpException } from "../exception/http-exception";

export class PaymentVerificationController {
  constructor(private readonly verificationService = new PaymentVerificationService()) {}

  async verifyWallet(req: Request, res: Response) {
    try {
      const parsed = VerifyWalletCredentialsDTO.safeParse(req.body);
      if (!parsed.success) { return ApiResponseHelper.error(res, z.prettifyError(parsed.error), 400); }
      const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id;
      if (!userId) { return ApiResponseHelper.error(res, "Unauthorized", 401); }
      const { contactNumber, password, paymentMethod, amount } = parsed.data;
      const result = await this.verificationService.verifyWalletCredentials(userId, contactNumber, password, paymentMethod, amount);
      return ApiResponseHelper.success(res, result, result.message);
    } catch (error: any) {
      const status = error instanceof HttpException ? error.status : 500;
      return ApiResponseHelper.error(res, error.message, status);
    }
  }

  async sendOtp(req: Request, res: Response) {
    try {
      const parsed = SendPaymentOtpDTO.safeParse(req.body);
      if (!parsed.success) { return ApiResponseHelper.error(res, z.prettifyError(parsed.error), 400); }
      const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id;
      if (!userId) { return ApiResponseHelper.error(res, "Unauthorized", 401); }
      const result = await this.verificationService.sendPaymentOtp(userId, parsed.data.channel);
      return ApiResponseHelper.success(res, result, result.message);
    } catch (error: any) {
      const status = error instanceof HttpException ? error.status : 500;
      return ApiResponseHelper.error(res, error.message, status);
    }
  }

  async verifyOtp(req: Request, res: Response) {
    try {
      const parsed = VerifyPaymentOtpDTO.safeParse(req.body);
      if (!parsed.success) { return ApiResponseHelper.error(res, z.prettifyError(parsed.error), 400); }
      const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id;
      if (!userId) { return ApiResponseHelper.error(res, "Unauthorized", 401); }
      const result = await this.verificationService.verifyPaymentOtp(userId, parsed.data.otp);
      return ApiResponseHelper.success(res, result, result.message);
    } catch (error: any) {
      const status = error instanceof HttpException ? error.status : 500;
      return ApiResponseHelper.error(res, error.message, status);
    }
  }
}
