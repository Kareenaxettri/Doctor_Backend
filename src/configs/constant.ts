import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

export const PORT: number = Number(process.env.PORT) || 8089;
export const MONGODB_URL: string =
  process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/doctor";
export const SECRET_KEY: string = process.env.SECRET_KEY || "merosecretkey";

if (!process.env.SECRET_KEY) {
  console.warn("[Security] SECRET_KEY is not set in environment. Using default fallback.");
  if (process.env.NODE_ENV === "production") {
    console.error("[Security] FATAL: SECRET_KEY must be set in production. Exiting.");
    process.exit(1);
  }
}
export const CLIENT_URL: string = process.env.CLIENT_URL || "http://localhost:3000";

export const SMTP_HOST: string = process.env.SMTP_HOST || "";
export const SMTP_PORT: number = Number(process.env.SMTP_PORT) || 587;
export const SMTP_USER: string = process.env.SMTP_USER || "";
export const SMTP_PASS: string = process.env.SMTP_PASS || "";
export const EMAIL_FROM: string = process.env.EMAIL_FROM || "Doctor Booking System <noreply@doctorbooking.com>";
