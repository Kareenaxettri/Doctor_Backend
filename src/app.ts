import express, { Application, NextFunction, Request, Response } from "express";
import userRouter from "./routes/user.route";
import { HttpException } from "./exception/http-exception";
import { ApiResponseHelper } from "./utils/apihelper.util";
import cors from "cors";

const app: Application = express();

app.use(express.json()); // json input
app.use(express.urlencoded({ extended: true })); // x-www-form-urlencoded

// CORS
app.use(cors());

// AUTH ROUTES (KEEP)
app.use("/api/v1/auth", userRouter);

// HEALTH CHECK
app.get("/", (req: Request, res: Response) => {
    return res.send("Hello, TypeScript-Express!");
});

const PORT: number = 5000;

// global api handler (at the last)
app.use((req: Request, res: Response) => {
    return res.status(404).json({ message: "API not found" });
});

// global error handler (at the last)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Error:", err);

    if (err instanceof HttpException) {
        return ApiResponseHelper.error(res, err.message, err.status);
    }

    return ApiResponseHelper.error(res, "Internal Server Error", 500);
});

// export techniques
const DUMMY: string = "Dummy Export";

export {
    PORT,
    DUMMY
};

// default export
export default app;