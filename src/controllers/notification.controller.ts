import { Request, Response } from "express";
import { ApiResponseHelper } from "../utils/apihelper.util";
import { NotificationService } from "../services/notification.service";

export class NotificationController {
  constructor(private readonly notificationService = new NotificationService()) {}

  async list(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id;
      if (!userId) return ApiResponseHelper.error(res, "Unauthorized", 401);
      const page = Math.max(1, parseInt((req.query.page as string) || "1", 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || "20", 10) || 20));
      const result = await this.notificationService.listNotifications(userId, page, limit);
      return ApiResponseHelper.success(res, result.data, "Notifications fetched successfully", 200, {
        page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages,
      });
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, error.status || 500);
    }
  }

  async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id;
      if (!userId) return ApiResponseHelper.error(res, "Unauthorized", 401);
      const result = await this.notificationService.getUnreadCount(userId);
      return ApiResponseHelper.success(res, result, "Unread count fetched");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, error.status || 500);
    }
  }

  async markAsRead(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id;
      if (!userId) return ApiResponseHelper.error(res, "Unauthorized", 401);
      const notification = await this.notificationService.markAsRead(String(req.params.id), userId);
      return ApiResponseHelper.success(res, notification, "Notification marked as read");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, error.status || 500);
    }
  }

  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id;
      if (!userId) return ApiResponseHelper.error(res, "Unauthorized", 401);
      const result = await this.notificationService.markAllAsRead(userId);
      return ApiResponseHelper.success(res, result, "All notifications marked as read");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, error.status || 500);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id;
      if (!userId) return ApiResponseHelper.error(res, "Unauthorized", 401);
      await this.notificationService.deleteNotification(String(req.params.id), userId);
      return ApiResponseHelper.success(res, null, "Notification deleted successfully");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, error.status || 500);
    }
  }

  async removeAll(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id;
      if (!userId) return ApiResponseHelper.error(res, "Unauthorized", 401);
      await this.notificationService.deleteAllNotifications(userId);
      return ApiResponseHelper.success(res, null, "All notifications deleted");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, error.status || 500);
    }
  }
}
