export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  appointmentReminders: boolean;
  bookingConfirmations: boolean;
  cancellations: boolean;
  promotions: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  email: true,
  sms: false,
  appointmentReminders: true,
  bookingConfirmations: true,
  cancellations: true,
  promotions: false,
};

export type ThemePreference = "light" | "dark";

export interface UserPreferences {
  notifications: NotificationPreferences;
  theme: ThemePreference;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  notifications: DEFAULT_NOTIFICATION_PREFERENCES,
  theme: "light",
};
