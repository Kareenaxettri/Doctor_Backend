import mongoose from "mongoose";
import { DoctorModel, IDoctor } from "../models/doctor.model";
import { escapeRegex } from "../utils/apihelper.util";

export interface PaginatedDoctors {
  data: IDoctor[];
  total: number;
}

export interface DoctorListOptions {
  specialization?: string;
  sortBy?: "fullName" | "rating" | "consultationFee" | "experienceYears" | "createdAt";
  order?: "asc" | "desc";
}

const OBJECTID_HEX_RE = /^[0-9a-fA-F]{24}$/;

export class DoctorRepository {
  async create(data: Partial<IDoctor>): Promise<IDoctor> {
    return DoctorModel.create(data);
  }

  async getById(id: string): Promise<IDoctor | null> {
    if (OBJECTID_HEX_RE.test(id)) {
      const doctor = await DoctorModel.findById(id);
      if (doctor) return doctor;
    }
    return DoctorModel.findOne({ doctorCode: id });
  }

  async resolveObjectId(idOrCode: string): Promise<mongoose.Types.ObjectId | null> {
    if (OBJECTID_HEX_RE.test(idOrCode)) {
      return new mongoose.Types.ObjectId(idOrCode);
    }
    const doctor = await DoctorModel.findOne({ doctorCode: idOrCode }).select("_id");
    return doctor ? doctor._id : null;
  }

  async list(page: number, limit: number, search?: string, options: DoctorListOptions = {}): Promise<PaginatedDoctors> {
    const filter: Record<string, any> = {};
    if (search && search.trim().length > 0) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [{ fullName: regex }, { specialization: regex }];
    }
    if (options.specialization && options.specialization.trim().length > 0) {
      filter.specialization = new RegExp(escapeRegex(options.specialization.trim()), "i");
    }

    const sortField = options.sortBy || "createdAt";
    const sortDirection = options.order === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      DoctorModel.find(filter).sort({ [sortField]: sortDirection }).skip(skip).limit(limit),
      DoctorModel.countDocuments(filter),
    ]);
    return { data, total };
  }

  async update(id: string, data: Partial<IDoctor>): Promise<IDoctor | null> {
    if (OBJECTID_HEX_RE.test(id)) {
      return DoctorModel.findByIdAndUpdate(id, data, { returnDocument: "after" });
    }
    return DoctorModel.findOneAndUpdate({ doctorCode: id }, data, { returnDocument: "after" });
  }

  async delete(id: string): Promise<boolean> {
    if (OBJECTID_HEX_RE.test(id)) {
      const deleted = await DoctorModel.findByIdAndDelete(id);
      return !!deleted;
    }
    const deleted = await DoctorModel.findOneAndDelete({ doctorCode: id });
    return !!deleted;
  }
}
