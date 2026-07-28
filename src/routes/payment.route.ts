import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { authorizedMiddleware, adminMiddleware } from "../middlewares/authorized.middleware";

const router = Router();
const paymentController = new PaymentController();

router.get("/", authorizedMiddleware, paymentController.list.bind(paymentController));
router.get("/:id", authorizedMiddleware, paymentController.getOne.bind(paymentController));
router.post("/", authorizedMiddleware, paymentController.create.bind(paymentController));
router.patch("/:id", authorizedMiddleware, adminMiddleware, paymentController.update.bind(paymentController));
router.delete("/:id", authorizedMiddleware, adminMiddleware, paymentController.remove.bind(paymentController));

export default router;
