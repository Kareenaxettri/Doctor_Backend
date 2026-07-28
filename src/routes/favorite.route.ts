import { Router } from "express";
import { FavoriteController } from "../controllers/favorite.controller";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";

const router = Router();
const favoriteController = new FavoriteController();

router.get("/", authorizedMiddleware, favoriteController.list.bind(favoriteController));
router.post("/toggle", authorizedMiddleware, favoriteController.toggle.bind(favoriteController));
router.post("/:doctorId", authorizedMiddleware, favoriteController.toggle.bind(favoriteController));

export default router;
