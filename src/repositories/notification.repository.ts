import { NotificationModel, INotification } from "../models/notification.model";

export interface PaginatedNotifications {
  data: INotification[];
  total: number;
  unreadCount: number;
}

export class NotificationRepository {
  async create(data: Partial<INotification>): Promise<INotification> {
    return NotificationModel.create(data);
  }

  async list(userId: string, page: number, limit: number): Promise<PaginatedNotifications> {
    const filter = { userId };
    const skip = (page - 1) * limit;
    const [data, total, unreadCount] = await Promise.all([
      NotificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      NotificationModel.countDocuments(filter),
      NotificationModel.countDocuments({ ...filter, isRead: false }),
    ]);
    return { data, total, unreadCount };
  }

  async markAsRead(id: string, userId: string): Promise<INotification | null> {
    return NotificationModel.findOneAndUpdate({ _id: id, userId }, { isRead: true }, { returnDocument: "after" });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await NotificationModel.updateMany({ userId, isRead: false }, { isRead: true });
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const deleted = await NotificationModel.findOneAndDelete({ _id: id, userId });
    return !!deleted;
  }

  async deleteAll(userId: string): Promise<void> {
    await NotificationModel.deleteMany({ userId });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return NotificationModel.countDocuments({ userId, isRead: false });
  }
}
