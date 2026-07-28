import { Router } from "express";
import { AdminUserController } from "../controllers/admin-user.controller";
import { authorizedMiddleware, adminMiddleware } from "../middlewares/authorized.middleware";

const router = Router();
const adminUserController = new AdminUserController();

router.use(authorizedMiddleware, adminMiddleware);

// GET /api/v1/admin/users -> paginated list, supports ?page=&limit=&search=
router.get("/", (req, res) => adminUserController.list(req, res));

// GET /api/v1/admin/users/:id -> single user
router.get("/:id", (req, res) => adminUserController.getOne(req, res));

// POST /api/v1/admin/users -> create user
router.post("/", (req, res) => adminUserController.create(req, res));

// PUT /api/v1/admin/users/:id -> update user
router.put("/:id", (req, res) => adminUserController.update(req, res));

// PATCH /api/v1/admin/users/:id -> partial update user
router.patch("/:id", (req, res) => adminUserController.update(req, res));

// DELETE /api/v1/admin/users/:id -> delete user
router.delete("/:id", (req, res) => adminUserController.remove(req, res));

export default router;
