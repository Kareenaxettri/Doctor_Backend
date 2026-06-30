import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import path from "path";

import authRouter from "./routes/auth.route";
import userRouter from "./routes/user.route";
import adminUserRouter from "./routes/admin-user.route";

import { HttpException } from "./exception/http-exception";
import { ApiResponseHelper } from "./utils/apihelper.util";
import { PORT, DUMMY } from "./configs/constant";

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// static uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ✅ FIXED ROUTES (IMPORTANT)
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/admin/users", adminUserRouter);

// health check
app.get("/", (req: Request, res: Response) => {
  return res.send("Doctor API Running 🚀");
});

// 404 handler
app.use((req: Request, res: Response) => {
  return res.status(404).json({ message: "API not found" });
});

// error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);

  if (err instanceof HttpException) {
    return ApiResponseHelper.error(res, err.message, err.status);
  }

  return ApiResponseHelper.error(res, "Internal Server Error", 500);
});

export { PORT, DUMMY };
export default app;
