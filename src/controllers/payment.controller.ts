import { Request, Response } from "express";
import { z } from "zod";
import { ApiResponseHelper } from "../utils/apihelper.util";
import { CreatePaymentDTO, UpdatePaymentDTO } from "../dtos/payment.dto";
import { PaymentService } from "../services/payment.service";

export class PaymentController {
  constructor(private readonly paymentService = new PaymentService()) {}

  async list(req: Request, res: Response) {
    try {
      const page = Math.max(1, parseInt((req.query.page as string) || "1", 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || "10", 10) || 10));
      const search = (req.query.search as string) || "";
      const user = req.user as any;
      const isAdmin = user?.role === "admin";
      const userId = isAdmin ? undefined : user?._id?.toString() || user?.id;
      const result = await this.paymentService.listPayments(page, limit, search, userId);
      return res.status(200).json({
        status: 200,
        success: true,
        message: "Payments fetched successfully",
        data: result.data,
        meta: { page, limit, total: result.total, totalPages: result.totalPages },
      });
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, 500);
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const payment = await this.paymentService.getPayment(String(req.params.id));
      const user = req.user as any;
      const isAdmin = user?.role === "admin";
      const requesterId = user?._id?.toString() || user?.id;
      if (!isAdmin && payment.userId !== requesterId) {
        return ApiResponseHelper.error(res, "Forbidden: not your payment", 403);
      }
      return ApiResponseHelper.success(res, payment, "Payment fetched successfully");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, error.status || 500);
    }
  }

  async create(req: Request, res: Response) {
  try {
    const parsed = CreatePaymentDTO.safeParse(req.body);
    if (!parsed.success) {
      return ApiResponseHelper.error(res, z.prettifyError(parsed.error), 400);
    }
    const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id;
    const payment = await this.paymentService.createPayment(userId, parsed.data);
    return ApiResponseHelper.success(res, payment, "Payment created successfully", 201);
  } catch (error: any) {
    return ApiResponseHelper.error(res, error.message, error.status || 500);   // ← was hardcoded 500
  }
}

  async update(req: Request, res: Response) {
    try {
      const parsed = UpdatePaymentDTO.safeParse(req.body);
      if (!parsed.success) {
        return ApiResponseHelper.error(res, z.prettifyError(parsed.error), 400);
      }
      const payment = await this.paymentService.updatePayment(String(req.params.id), parsed.data);
      return ApiResponseHelper.success(res, payment, "Payment updated successfully");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, error.status || 500);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      await this.paymentService.deletePayment(String(req.params.id));
      return ApiResponseHelper.success(res, null, "Payment deleted successfully");
    } catch (error: any) {
  return ApiResponseHelper.error(res, error.message, error.status || 500);
    }
  }
}

