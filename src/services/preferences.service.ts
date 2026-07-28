import { UserMongoRepository } from "../repositories/user.repository";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEFAULT_USER_PREFERENCES,
  NotificationPreferences,
  ThemePreference,
  UserPreferences,
} from "../types/preferences.type";
import { HttpException } from "../exception/http-exception";

const userRepository = new UserMongoRepository();

function mergeNotifications(
  current: NotificationPreferences,
  updates: Partial<NotificationPreferences>
): NotificationPreferences {
  return { ...current, ...updates };
}

export class PreferencesService {
  getPreferencesFromUser(user: any): UserPreferences {
    const stored = user.preferences || {};
    return {
      notifications: mergeNotifications(
        DEFAULT_NOTIFICATION_PREFERENCES,
        stored.notifications || {}
      ),
      theme: (stored.theme as ThemePreference) || DEFAULT_USER_PREFERENCES.theme,
    };
  }

  async getPreferences(userId: string): Promise<UserPreferences> {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpException(404, "User not found");
    }
    return this.getPreferencesFromUser(user);
  }

  async updatePreferences(
    userId: string,
    updates: {
      notifications?: Partial<NotificationPreferences>;
      theme?: ThemePreference;
    }
  ): Promise<UserPreferences> {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpException(404, "User not found");
    }

    const current = this.getPreferencesFromUser(user);
    const next: UserPreferences = {
      notifications: updates.notifications
        ? mergeNotifications(current.notifications, updates.notifications)
        : current.notifications,
      theme: updates.theme ?? current.theme,
    };

    await userRepository.update(userId, { preferences: next } as any);
    return next;
  }
}
