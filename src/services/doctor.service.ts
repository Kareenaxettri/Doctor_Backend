import { DoctorRepository, DoctorListOptions } from "../repositories/doctor.repository";
import { CreateDoctorDTO, UpdateDoctorDTO } from "../dtos/doctor.dto";
import { HttpException } from "../exception/http-exception";
import { IDoctor } from "../models/doctor.model";

export class DoctorService {
  constructor(private readonly doctorRepository = new DoctorRepository()) {}
  private toPublicDoctor(doctor: IDoctor) {
    const id = doctor._id.toString();
    return {
      id,
      doctorCode: doctor.doctorCode,
      fullName: doctor.fullName,
      name: doctor.fullName,
      gender: doctor.gender ?? null,
      specialization: doctor.specialization,
      specialty: doctor.specialization,
      experienceYears: doctor.experienceYears,
      consultationFee: doctor.consultationFee,
      bio: doctor.bio ?? "",
      photo: doctor.photo ?? null,
      profileImage: doctor.photo ?? null,
      clinic: doctor.clinic ?? "",
      clinicAddress: doctor.clinic ?? "",
      contactNumber: doctor.contactNumber ?? "",
      rating: doctor.rating ?? 4.8,
      availability: doctor.availability ?? "Available today",
      availableDays: doctor.availableDays ?? [],
      isActive: doctor.isActive,
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt,
      _links: {
        self: { href: `/api/v1/doctors/${id}`, method: "GET" },
        update: { href: `/api/v1/doctors/${id}`, method: "PATCH" },
        delete: { href: `/api/v1/doctors/${id}`, method: "DELETE" },
        appointments: { href: `/api/v1/appointments/slots/${id}`, method: "GET" },
      },
    };
  }

  async createDoctor(input: CreateDoctorDTO) {
    const doctor = await this.doctorRepository.create(input as Partial<IDoctor>);
    return this.toPublicDoctor(doctor);
  }

  async listDoctors(page: number, limit: number, search?: string, options: DoctorListOptions = {}) {
    const { data, total } = await this.doctorRepository.list(page, limit, search, options);
    return {
      data: data.map((doctor) => this.toPublicDoctor(doctor)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getDoctor(id: string) {
    const doctor = await this.doctorRepository.getById(id);
    if (!doctor) {
      throw new HttpException(404, "Doctor not found");
    }
    return this.toPublicDoctor(doctor);
  }

  async updateDoctor(id: string, input: UpdateDoctorDTO) {
    const doctor = await this.doctorRepository.update(id, input as Partial<IDoctor>);
    if (!doctor) {
      throw new HttpException(404, "Doctor not found");
    }
    return this.toPublicDoctor(doctor);
  }

  async deleteDoctor(id: string) {
    const deleted = await this.doctorRepository.delete(id);
    if (!deleted) {
      throw new HttpException(404, "Doctor not found");
    }
    return { success: true };
  }
}
