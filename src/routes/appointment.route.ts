import { Router } from "express";
import { AppointmentController } from "../controllers/appointment.controller";
import { authorizedMiddleware, adminMiddleware } from "../middlewares/authorized.middleware";

const router = Router();
const appointmentController = new AppointmentController();

router.get("/", authorizedMiddleware, appointmentController.list.bind(appointmentController));
router.get("/slots/:doctorId", authorizedMiddleware, appointmentController.getSlots.bind(appointmentController));
router.get("/:id", authorizedMiddleware, appointmentController.getOne.bind(appointmentController));
router.post("/", authorizedMiddleware, appointmentController.create.bind(appointmentController));
router.patch("/:id", authorizedMiddleware, appointmentController.update.bind(appointmentController));
router.patch("/:id/cancel", authorizedMiddleware, appointmentController.cancel.bind(appointmentController));
router.patch("/:id/complete", authorizedMiddleware, adminMiddleware, appointmentController.complete.bind(appointmentController));
router.delete("/:id", authorizedMiddleware, appointmentController.remove.bind(appointmentController));

export default router;
