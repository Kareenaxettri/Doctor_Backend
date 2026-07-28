import { z } from "zod";

export const CreateNotificationDTO = z.object({
  userId: z.string().min(1, "User ID is required"),
  title: z.string().min(1, "Title is required").max(200),
  message: z.string().min(1, "Message is required").max(1000),
  type: z.enum(["appointment", "payment", "system", "reminder"]).optional(),
  link: z.string().optional(),
});

export type CreateNotificationDTO = z.infer<typeof CreateNotificationDTO>;
