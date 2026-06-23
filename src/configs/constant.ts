import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

console.log("ENV PORT:", process.env.PORT);
console.log("ENV MONGODB_URL:", process.env.MONGODB_URL);

export const PORT: number = Number(process.env.PORT) || 8089;
export const DUMMY: string = process.env.DUMMY || "Dummy Export";
export const MONGODB_URL: string =
  process.env.MONGODB_URL || "mongodb://localhost:27017/seatsathi";
export const SECRET_KEY: string = process.env.SECRET_KEY || "merosecretkey";