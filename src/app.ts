import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRouter from "./routes/auth.route";
import userRouter from "./routes/user.route";
import adminUserRouter from "./routes/admin-user.route";
import doctorRouter from "./routes/doctor.route";
import appointmentRouter from "./routes/appointment.route";
import paymentRouter from "./routes/payment.route";
import favoriteRouter from "./routes/favorite.route";
import notificationRouter from "./routes/notification.route";

import { HttpException } from "./exception/http-exception";
import { ApiResponseHelper } from "./utils/apihelper.util";
import { PORT, CLIENT_URL } from "./configs/constant";
import { sanitizePayload } from "./middlewares/upload.middleware";

const app: Application = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests from this IP, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts, please try again later." },
});

app.use("/api/", apiLimiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const corsOrigins = CLIENT_URL ? [CLIENT_URL, "http://localhost:3000", "http://127.0.0.1:3000"] : ["http://localhost:3000", "http://127.0.0.1:3000"];
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(express.static(path.join(process.cwd(), "public")));

app.use(sanitizePayload);

app.use("/api/v1/auth", authLimiter, authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/admin/users", adminUserRouter);
app.use("/api/v1/doctors", doctorRouter);
app.use("/api/v1/appointments", appointmentRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/favorites", favoriteRouter);
app.use("/api/v1/notifications", notificationRouter);

app.get("/", (req: Request, res: Response) => {
  return res.send("Doctor API Running");
});

app.use((req: Request, res: Response) => {
  if (req.path.startsWith("/api/")) {
    return ApiResponseHelper.error(res, "API not found", 404);
  }
  return res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled Error:", err.message);

  if (err instanceof HttpException) {
    return ApiResponseHelper.error(res, err.message, err.status);
  }

  return ApiResponseHelper.error(res, "Internal Server Error", 500);
});

export { PORT };
export default app;

