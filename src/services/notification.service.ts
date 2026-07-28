import { NotificationRepository } from "../repositories/notification.repository";
import { CreateNotificationDTO } from "../dtos/notification.dto";
import { HttpException } from "../exception/http-exception";
import { INotification } from "../models/notification.model";

export class NotificationService {
  constructor(private readonly notificationRepository = new NotificationRepository()) {}

  private toPublicNotification(n: INotification) {
    return {
      id: n._id.toString(),
      userId: n.userId.toString(),
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      link: n.link ?? null,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    };
  }

  async createNotification(input: CreateNotificationDTO) {
    const notification = await this.notificationRepository.create({
      userId: input.userId as any, title: input.title, message: input.message, type: input.type || "system", link: input.link,
    });
    return this.toPublicNotification(notification);
  }

  async listNotifications(userId: string, page: number, limit: number) {
    const { data, total, unreadCount } = await this.notificationRepository.list(userId, page, limit);
    return { data: data.map((n) => this.toPublicNotification(n)), total, unreadCount, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationRepository.getUnreadCount(userId);
    return { unreadCount: count };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.notificationRepository.markAsRead(notificationId, userId);
    if (!notification) throw new HttpException(404, "Notification not found");
    return this.toPublicNotification(notification);
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.markAllAsRead(userId);
    return { success: true };
  }

  async deleteNotification(notificationId: string, userId: string) {
    const deleted = await this.notificationRepository.delete(notificationId, userId);
    if (!deleted) throw new HttpException(404, "Notification not found");
    return { success: true };
  }

  async deleteAllNotifications(userId: string) {
    await this.notificationRepository.deleteAll(userId);
    return { success: true };
  }
}
