import mongoose from "mongoose";
import { MONGODB_URL } from "../configs/constant";

export const connectToMongoDB = async () => {
  try {
    console.log("MongoDB URL:", JSON.stringify(MONGODB_URL));

    await mongoose.connect(MONGODB_URL);

    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error(error);
    throw error;
  }
};