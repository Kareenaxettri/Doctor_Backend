import fs from "fs";
import path from "path";
import multer from "multer";
import { Request, Response, NextFunction } from "express";

const profileUploadDirectory = path.join(process.cwd(), "uploads", "profile");
const doctorUploadDirectory = path.join(process.cwd(), "uploads", "images");

for (const directory of [profileUploadDirectory, doctorUploadDirectory]) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

const createStorage = (destination: string) => multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, destination);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname);
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    callback(null, safeName);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, callback) => {
  if (file.mimetype.startsWith("image/")) {
    callback(null, true);
    return;
  }

  callback(new Error("Only image uploads are allowed"));
};

export const uploadProfileImage = multer({
  storage: createStorage(profileUploadDirectory),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const uploadDoctorImage = multer({
  storage: createStorage(doctorUploadDirectory),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

function sanitizeValue(value: any): any {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const key of Object.keys(value)) {
      if (key.startsWith("$") || key === "__proto__" || key === "constructor") {
        delete value[key];
      } else {
        sanitizeValue(value[key]);
      }
    }
  }
  if (Array.isArray(value)) {
    value.forEach(sanitizeValue);
  }
  return value;
}

export function sanitizePayload(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === "object") {
    sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === "object") {
    sanitizeValue(req.params);
  }
  next();
}