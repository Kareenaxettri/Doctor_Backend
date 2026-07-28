import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";

const router = Router();
const notificationController = new NotificationController();

router.use(authorizedMiddleware);

router.get("/", (req, res) => notificationController.list(req, res));
router.get("/unread-count", (req, res) => notificationController.getUnreadCount(req, res));
router.patch("/:id/read", (req, res) => notificationController.markAsRead(req, res));
router.patch("/read-all", (req, res) => notificationController.markAllAsRead(req, res));
router.delete("/:id", (req, res) => notificationController.remove(req, res));
router.delete("/", (req, res) => notificationController.removeAll(req, res));

export default router;
