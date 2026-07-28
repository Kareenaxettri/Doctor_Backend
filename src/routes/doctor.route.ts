import { Router } from "express";
import { DoctorController } from "../controllers/doctor.controller";
import { authorizedMiddleware, adminMiddleware } from "../middlewares/authorized.middleware";
import { uploadDoctorImage } from "../middlewares/upload.middleware";

const router = Router();
const doctorController = new DoctorController();

router.get("/", doctorController.list.bind(doctorController));
router.get("/:id", doctorController.getOne.bind(doctorController));
router.post("/", authorizedMiddleware, adminMiddleware, uploadDoctorImage.single("photo"), doctorController.create.bind(doctorController));
router.patch("/:id", authorizedMiddleware, adminMiddleware, uploadDoctorImage.single("photo"), doctorController.update.bind(doctorController));
router.delete("/:id", authorizedMiddleware, adminMiddleware, doctorController.remove.bind(doctorController));

export default router;
