import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";

const router = Router();
const authController = new AuthController();

router.post("/register", (req, res) =>
  authController.register(req, res)
);

router.post("/login", (req, res) =>
  authController.login(req, res)
);

// WHO AM I
router.get("/whoami", authorizedMiddleware, (req, res) =>
  authController.whoAmI(req, res)
);

// UPDATE PASSWORD
router.patch("/update-password", authorizedMiddleware, (req, res) =>
  authController.updatePassword(req, res)
);

// FORGOT & RESET PASSWORD
router.post("/forgot-password", (req, res) =>
  authController.forgotPassword(req, res)
);

router.post("/reset-password", (req, res) =>
  authController.resetPassword(req, res)
);

export default router;