import { FavoriteRepository } from "../repositories/favorite.repository";
import { DoctorRepository } from "../repositories/doctor.repository";
import { HttpException } from "../exception/http-exception";

export class FavoriteService {
  constructor(
    private readonly favoriteRepository = new FavoriteRepository(),
    private readonly doctorRepository = new DoctorRepository()
  ) {}

  async listFavorites(userId: string) {
    const favorites = await this.favoriteRepository.listByUser(userId);
    return favorites
      .map((favorite) => favorite.doctorId)
      .filter(Boolean)
      .map((doctor: any) => ({
        id: doctor._id?.toString?.() ?? doctor.id,
        fullName: doctor.fullName,
        name: doctor.fullName,
        gender: doctor.gender ?? null,
        specialization: doctor.specialization,
        specialty: doctor.specialization,
        experienceYears: doctor.experienceYears,
        consultationFee: doctor.consultationFee,
        photo: doctor.photo ?? null,
        profileImage: doctor.photo ?? null,
        clinic: doctor.clinic ?? "",
        rating: doctor.rating ?? 4.8,
        availability: doctor.availability ?? "Available today",
      }));
  }

  async toggleFavorite(userId: string, doctorId: string) {
    const doctor = await this.doctorRepository.getById(doctorId);
    if (!doctor) {
      throw new HttpException(404, "Doctor not found");
    }

    const doctorObjectId = doctor._id.toString();
    const result = await this.favoriteRepository.toggle(userId, doctorObjectId);
    return {
      isFavorite: result.isFavorite,
      doctorId,
      doctor: {
        id: doctor._id.toString(),
        doctorCode: doctor.doctorCode,
        fullName: doctor.fullName,
        specialization: doctor.specialization,
      },
    };
  }
}
