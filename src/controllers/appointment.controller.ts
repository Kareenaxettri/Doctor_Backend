import { Request, Response } from "express";
import { z } from "zod";
import { ApiResponseHelper, generateETag } from "../utils/apihelper.util";
import { CreateAppointmentDTO, UpdateAppointmentDTO } from "../dtos/appointment.dto";
import { AppointmentService } from "../services/appointment.service";

function normalizeAppointmentBody(body: Record<string, any>) {
  const normalized: Record<string, any> = { ...body };

  if (!normalized.doctorId && normalized.doctor) {
    normalized.doctorId = normalized.doctor;
  }
  delete normalized.doctor;

  if (!normalized.appointmentTime && normalized.startTime) {
    normalized.appointmentTime = normalized.startTime;
  }
  delete normalized.startTime;
  delete normalized.endTime;

  delete normalized.doctorName;
  delete normalized.specialty;

  if (normalized.amount !== undefined) normalized.amount = Number(normalized.amount);

  return normalized;
}

export class AppointmentController {
  constructor(private readonly appointmentService = new AppointmentService()) {}

  async list(req: Request, res: Response) {
    try {
      const page = Math.max(1, parseInt((req.query.page as string) || "1", 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || "10", 10) || 10));
      const search = (req.query.search as string) || "";
      const status = (req.query.status as string) || undefined;
      const allowedSortFields = ["appointmentDate", "createdAt", "status"];
      const sortByRaw = req.query.sortBy as string;
      const sortBy = allowedSortFields.includes(sortByRaw) ? (sortByRaw as any) : undefined;
      const order = req.query.order === "asc" ? "asc" : req.query.order === "desc" ? "desc" : undefined;

      const user = req.user as any;
      const isAdmin = user?.role === "admin";
      const userId = isAdmin ? undefined : user?._id?.toString() || user?.id;
      const result = await this.appointmentService.listAppointments(page, limit, search, userId, { status, sortBy, order });
      const totalPages = result.totalPages;

      const buildLink = (targetPage: number) => {
        const params = new URLSearchParams();
        params.set("page", String(targetPage));
        params.set("limit", String(limit));
        if (search) params.set("search", search);
        if (status) params.set("status", status);
        if (sortBy) params.set("sortBy", sortBy);
        if (order) params.set("order", order);
        return `/api/v1/appointments?${params.toString()}`;
      };

      return res.status(200).json({
        status: 200,
        success: true,
        message: "Appointments fetched successfully",
        data: result.data,
        meta: { page, limit, total: result.total, totalPages },
        _links: {
          self: { href: buildLink(page), method: "GET" },
          first: { href: buildLink(1), method: "GET" },
          last: { href: buildLink(totalPages), method: "GET" },
          next: page < totalPages ? { href: buildLink(page + 1), method: "GET" } : null,
          prev: page > 1 ? { href: buildLink(page - 1), method: "GET" } : null,
          create: { href: "/api/v1/appointments", method: "POST" },
        },
      });
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, 500);
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const appointment = await this.appointmentService.getAppointment(String(req.params.id));

      const etag = generateETag(appointment.id, appointment.updatedAt as any);
      res.set("ETag", etag);
      res.set("Cache-Control", "private, must-revalidate");

      const clientETag = req.headers["if-none-match"];
      if (clientETag && clientETag === etag) {
        return res.status(304).end();
      }

      return ApiResponseHelper.success(res, appointment, "Appointment fetched successfully");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, error.status || 500);
    }
  }

  async getSlots(req: Request, res: Response) {
    try {
      const doctorId = String(req.params.doctorId || req.params.id);
      const date = req.query.date as string;
      if (!date) {
        return ApiResponseHelper.error(res, "Date query parameter is required", 400);
      }
      const slots = await this.appointmentService.getAvailableSlots(doctorId, date);
      return ApiResponseHelper.success(res, slots, "Available slots fetched successfully");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, error.status || 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const body = normalizeAppointmentBody(req.body || {});
      const parsed = CreateAppointmentDTO.safeParse(body);
      if (!parsed.success) {
        return ApiResponseHelper.error(res, z.prettifyError(parsed.error), 400);
      }
      const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id;
      const appointment = await this.appointmentService.createAppointment(userId, parsed.data);
      return ApiResponseHelper.success(res, appointment, "Appointment created successfully", 201);
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, error.status || 500);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const body = normalizeAppointmentBody(req.body || {});
      const parsed = UpdateAppointmentDTO.safeParse(body);
      if (!parsed.success) {
        return ApiResponseHelper.error(res, z.prettifyError(parsed.error), 400);
      }
      const user = req.user as any;
      const requestor = { id: user?._id?.toString() || user?.id, role: user?.role || "user" };
      const appointment = await this.appointmentService.updateAppointment(String(req.params.id), parsed.data, requestor);
      return ApiResponseHelper.success(res, appointment, "Appointment updated successfully");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, error.status || 500);
    }
  }

  async cancel(req: Request, res: Response) {
    try {
      const user = req.user as any;
      const requestor = { id: user?._id?.toString() || user?.id, role: user?.role || "user" };
      const appointment = await this.appointmentService.cancelAppointment(String(req.params.id), requestor);
      return ApiResponseHelper.success(res, appointment, "Appointment cancelled successfully");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, error.status || 500);
    }
  }

  async complete(req: Request, res: Response) {
    try {
      const appointment = await this.appointmentService.completeAppointment(String(req.params.id));
      return ApiResponseHelper.success(res, appointment, "Appointment marked as completed");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, error.status || 500);
    }
  }

  async remove(req: Request, res: Response) {
    try {
      await this.appointmentService.deleteAppointment(String(req.params.id));
      return ApiResponseHelper.success(res, null, "Appointment deleted successfully");
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message, error.status || 500);
    }
  }
}
