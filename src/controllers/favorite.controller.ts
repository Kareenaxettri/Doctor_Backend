import { Request, Response } from "express";
import { ApiResponseHelper } from "../utils/apihelper.util";
import { FavoriteService } from "../services/favorite.service";

export class FavoriteController {
  constructor(private readonly favoriteService = new FavoriteService()) {}

  async list(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id;
      if (!userId) {
        return ApiResponseHelper.error(res, "Unauthorized", 401);
      }
      const favorites = await this.favoriteService.listFavorites(userId);
      return ApiResponseHelper.success(res, favorites, "Favorites fetched successfully");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, 500);
    }
  }

  async toggle(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id;
      if (!userId) {
        return ApiResponseHelper.error(res, "Unauthorized", 401);
      }
      const doctorId = String(req.params.doctorId || req.body.doctorId || "").trim();
      if (!doctorId) {
        return ApiResponseHelper.error(res, "Doctor ID is required", 400);
      }
      const result = await this.favoriteService.toggleFavorite(userId, doctorId);
      return ApiResponseHelper.success(res, result, "Favorite updated successfully");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, error.status || 500);
    }
  }
}
