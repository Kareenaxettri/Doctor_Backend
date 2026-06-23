import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";
import { uploadProfileImage } from "../middlewares/upload.middleware";

const router = Router();
const userController = new UserController();

// GET ME
router.get("/me", authorizedMiddleware, (req, res) =>
  userController.getMe(req, res)
);

// UPDATE PROFILE
router.patch(
  "/profile",
  authorizedMiddleware,
  uploadProfileImage.single("profileImage"),
  (req, res) => userController.updateProfile(req, res)
);

export default router;