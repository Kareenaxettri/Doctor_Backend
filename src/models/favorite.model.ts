import mongoose, { Schema, Document } from "mongoose";

export interface IFavorite extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
  },
  { timestamps: true }
);

FavoriteSchema.index({ userId: 1, doctorId: 1 }, { unique: true });

export const FavoriteModel = mongoose.model<IFavorite>("Favorite", FavoriteSchema);
