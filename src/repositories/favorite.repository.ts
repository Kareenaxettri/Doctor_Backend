import { FavoriteModel, IFavorite } from "../models/favorite.model";

export class FavoriteRepository {
  async listByUser(userId: string): Promise<IFavorite[]> {
    return FavoriteModel.find({ userId }).populate("doctorId").sort({ createdAt: -1 });
  }

  async toggle(userId: string, doctorId: string): Promise<{ isFavorite: boolean; favorite: IFavorite | null }> {
    const existing = await FavoriteModel.findOne({ userId, doctorId });
    if (existing) {
      await FavoriteModel.deleteOne({ _id: existing._id });
      return { isFavorite: false, favorite: null };
    }

    const favorite = await FavoriteModel.create({ userId, doctorId });
    return { isFavorite: true, favorite };
  }

  async isFavorite(userId: string, doctorId: string): Promise<boolean> {
    const favorite = await FavoriteModel.findOne({ userId, doctorId });
    return !!favorite;
  }
}
