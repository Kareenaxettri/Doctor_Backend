import { AppointmentModel, IAppointment } from "../models/appointment.model";
import { escapeRegex } from "../utils/apihelper.util";

export interface PaginatedAppointments {
  data: IAppointment[];
  total: number;
}

export interface AppointmentListOptions {
  status?: string;
  sortBy?: "appointmentDate" | "createdAt" | "status";
  order?: "asc" | "desc";
}

export class AppointmentRepository {
  async create(data: Partial<IAppointment>): Promise<IAppointment> {
    return AppointmentModel.create(data);
  }

  async getById(id: string): Promise<IAppointment | null> {
    return AppointmentModel.findById(id).populate("userId", "fullName email contactNumber").populate("doctorId", "fullName specialization consultationFee");
  }

  async findBookedSlots(doctorId: string, dateStart: Date, dateEnd: Date): Promise<IAppointment[]> {
    return AppointmentModel.find({
      doctorId,
      appointmentDate: { $gte: dateStart, $lte: dateEnd },
    }).select("appointmentTime status");
  }

  async list(page: number, limit: number, search?: string, userId?: string, options: AppointmentListOptions = {}): Promise<PaginatedAppointments> {
    const filter: Record<string, any> = {};
    if (userId) {
      filter.userId = userId;
    }
    if (options.status && options.status.trim().length > 0) {
      filter.status = options.status.trim();
    }
    if (search && search.trim().length > 0) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [{ symptoms: regex }, { status: regex }, { doctorName: regex }];
    }

    const sortField = options.sortBy || "createdAt";
    const sortDirection = options.order === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      AppointmentModel.find(filter).sort({ [sortField]: sortDirection }).skip(skip).limit(limit).populate("userId", "fullName email contactNumber").populate("doctorId", "fullName specialization consultationFee"),
      AppointmentModel.countDocuments(filter),
    ]);
    return { data, total };
  }

  async update(id: string, data: Partial<IAppointment>): Promise<IAppointment | null> {
    return AppointmentModel.findByIdAndUpdate(id, data, { returnDocument: "after" }).populate("userId", "fullName email contactNumber").populate("doctorId", "fullName specialization consultationFee");
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await AppointmentModel.findByIdAndDelete(id);
    return !!deleted;
  }
}
