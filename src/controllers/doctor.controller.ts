import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { z } from "zod";
import { ApiResponseHelper, generateETag } from "../utils/apihelper.util";
import { CreateDoctorDTO, UpdateDoctorDTO } from "../dtos/doctor.dto";
import { DoctorService } from "../services/doctor.service";

function normalizeDoctorBody(body: Record<string, any>) {
  const normalized: Record<string, any> = { ...body };

  if (!normalized.specialization && normalized.specialty) {
    normalized.specialization = normalized.specialty;
  }
  delete normalized.specialty;

  if (normalized.gender && typeof normalized.gender === "string") {
    normalized.gender = normalized.gender.toLowerCase();
  }

  if (normalized.experienceYears !== undefined) normalized.experienceYears = Number(normalized.experienceYears);
  if (normalized.consultationFee !== undefined) normalized.consultationFee = Number(normalized.consultationFee);
  if (normalized.rating !== undefined) normalized.rating = Number(normalized.rating);

  if (normalized.availableDays && typeof normalized.availableDays === "string") {
    normalized.availableDays = normalized.availableDays.split(",").map((day: string) => day.trim()).filter(Boolean);
  }

  if (typeof normalized.isActive === "string") {
    normalized.isActive = normalized.isActive === "true";
  }

  return normalized;
}

export class DoctorController {
  constructor(private readonly doctorService = new DoctorService()) {}

  async list(req: Request, res: Response) {
    try {
      const page = Math.max(1, parseInt((req.query.page as string) || "1", 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || "10", 10) || 10));
      const search = (req.query.search as string) || "";
      const specialization = (req.query.specialization as string) || undefined;
      const allowedSortFields = ["fullName", "rating", "consultationFee", "experienceYears", "createdAt"];
      const sortByRaw = req.query.sortBy as string;
      const sortBy = allowedSortFields.includes(sortByRaw) ? (sortByRaw as any) : undefined;
      const order = req.query.order === "asc" ? "asc" : req.query.order === "desc" ? "desc" : undefined;

      const result = await this.doctorService.listDoctors(page, limit, search, { specialization, sortBy, order });
      const totalPages = result.totalPages;

      const buildLink = (targetPage: number) => {
        const params = new URLSearchParams();
        params.set("page", String(targetPage));
        params.set("limit", String(limit));
        if (search) params.set("search", search);
        if (specialization) params.set("specialization", specialization);
        if (sortBy) params.set("sortBy", sortBy);
        if (order) params.set("order", order);
        return `/api/v1/doctors?${params.toString()}`;
      };

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Doctors fetched successfully",
        data: result.data,
        meta: { page, limit, total: result.total, totalPages },
        _links: {
          self: { href: buildLink(page), method: "GET" },
          first: { href: buildLink(1), method: "GET" },
          last: { href: buildLink(totalPages), method: "GET" },
          next: page < totalPages ? { href: buildLink(page + 1), method: "GET" } : null,
          prev: page > 1 ? { href: buildLink(page - 1), method: "GET" } : null,
          create: { href: "/api/v1/doctors", method: "POST" },
        },
      });
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, 500);
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const doctor = await this.doctorService.getDoctor(String(req.params.id));

      const etag = generateETag(doctor.id, doctor.updatedAt as any);
      res.set("ETag", etag);
      res.set("Cache-Control", "private, must-revalidate");

      const clientETag = req.headers["if-none-match"];
      if (clientETag && clientETag === etag) {
        return res.status(304).end();
      }

      return ApiResponseHelper.success(res, doctor, "Doctor fetched successfully");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, error.status || 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const body = normalizeDoctorBody(req.body || {});
      const parsed = CreateDoctorDTO.safeParse(body);
      if (!parsed.success) {
        return ApiResponseHelper.error(res, z.prettifyError(parsed.error), 400);
      }
      const doctor = await this.doctorService.createDoctor(parsed.data);

      if (req.file) {
        const ext = path.extname(req.file.filename);
        const newFilename = `${doctor.id}-${Date.now()}${ext}`;
        const imagesDir = path.join(process.cwd(), "uploads", "images");
        const oldPath = path.join(imagesDir, req.file.filename);
        const newPath = path.join(imagesDir, newFilename);
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
        }
        const photoPath = `/uploads/images/${newFilename}`;
        await this.doctorService.updateDoctor(doctor.id, { photo: photoPath } as any);
        doctor.photo = photoPath;
      }

      return ApiResponseHelper.success(res, doctor, "Doctor created successfully", 201);
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, 500);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const body = normalizeDoctorBody(req.body || {});
      if (req.file) {
        const doctorId = String(req.params.id);
        const ext = path.extname(req.file.filename);
        const newFilename = `${doctorId}-${Date.now()}${ext}`;
        const imagesDir = path.join(process.cwd(), "uploads", "images");
        const oldPath = path.join(imagesDir, req.file.filename);
        const newPath = path.join(imagesDir, newFilename);
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
        }
        body.photo = `/uploads/images/${newFilename}`;
      }
      const parsed = UpdateDoctorDTO.safeParse(body);
      if (!parsed.success) {
        return ApiResponseHelper.error(res, z.prettifyError(parsed.error), 400);
      }
      const doctor = await this.doctorService.updateDoctor(String(req.params.id), parsed.data);
      return ApiResponseHelper.success(res, doctor, "Doctor updated successfully");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, error.status || 500);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      await this.doctorService.deleteDoctor(String(req.params.id));
      return ApiResponseHelper.success(res, null, "Doctor deleted successfully");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, error.status || 500);
    }
  }
}
