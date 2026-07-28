import { AppointmentRepository, AppointmentListOptions } from "../repositories/appointment.repository";
import { DoctorRepository } from "../repositories/doctor.repository";
import { CreateAppointmentDTO, UpdateAppointmentDTO } from "../dtos/appointment.dto";
import { HttpException } from "../exception/http-exception";
import { IAppointment } from "../models/appointment.model";

export const AVAILABLE_TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00",
];

const VALID_STATUSES = ["pending", "confirmed", "cancelled", "completed"] as const;

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

function normalizeTimeSlot(time: string): string {
  const trimmed = time.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return trimmed;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3];
  if (period) {
    const upper = period.toUpperCase();
    if (upper === "PM" && hours < 12) hours += 12;
    if (upper === "AM" && hours === 12) hours = 0;
  }
  return `${String(hours).padStart(2, "0")}:${minutes}`;
}

function getWeekdayFromDate(dateStr: string): string {
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(Date.UTC(year, month, day));
    return d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  }
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

export class AppointmentService {
  constructor(
    private readonly appointmentRepository = new AppointmentRepository(),
    private readonly doctorRepository = new DoctorRepository()
  ) {}

  private toPublicAppointment(appointment: IAppointment) {
    const doctorRef: any = appointment.doctorId;
    const doctorIdString =
      doctorRef && typeof doctorRef === "object" && doctorRef._id
        ? doctorRef._id.toString()
        : doctorRef?.toString?.() ?? null;

    const userRef: any = appointment.userId;
    const userIdString =
      userRef && typeof userRef === "object" && userRef._id
        ? userRef._id.toString()
        : userRef?.toString?.() ?? null;

    return {
      id: appointment._id.toString(),
      userId: userIdString,
      doctorId: doctorIdString,
      doctor: doctorIdString,
      doctorName: appointment.doctorName || doctorRef?.fullName || "",
      patientName: userRef?.fullName || "",
      patientEmail: userRef?.email || "",
      specialty: appointment.specialty || doctorRef?.specialization || "",
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      startTime: appointment.appointmentTime,
      status: appointment.status,
      symptoms: appointment.symptoms ?? "",
      notes: appointment.notes ?? "",
      amount: appointment.amount ?? 0,
      paymentMethod: appointment.paymentMethod ?? "",
      paymentStatus: appointment.paymentStatus ?? "pending",
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      _links: {
        self: { href: `/api/v1/appointments/${appointment._id.toString()}`, method: "GET" },
        update: { href: `/api/v1/appointments/${appointment._id.toString()}`, method: "PATCH" },
        cancel: appointment.status === "pending" || appointment.status === "confirmed"
          ? { href: `/api/v1/appointments/${appointment._id.toString()}/cancel`, method: "PATCH" }
          : null,
        complete: appointment.status !== "completed" && appointment.status !== "cancelled"
          ? { href: `/api/v1/appointments/${appointment._id.toString()}/complete`, method: "PATCH" }
          : null,
        doctor: doctorIdString ? { href: `/api/v1/doctors/${doctorIdString}`, method: "GET" } : null,
      },
    };
  }

  async getAvailableSlots(doctorId: string, date: string) {
    const doctor = await this.doctorRepository.getById(doctorId);
    if (!doctor) {
      throw new HttpException(404, "Doctor not found");
    }

    const appointmentDay = getWeekdayFromDate(date);
    const isAvailableDay = (doctor.availableDays ?? []).some(
      (day) => day.toLowerCase() === appointmentDay.toLowerCase()
    );
    if (!isAvailableDay) {
      return { date, doctorId, dayName: appointmentDay, availableSlots: [], bookedSlots: [] };
    }

    const dateStart = new Date(date + "T00:00:00.000Z");
    const dateEnd = new Date(date + "T23:59:59.999Z");

    const booked = await this.appointmentRepository.findBookedSlots(doctor._id.toString(), dateStart, dateEnd);
    const bookedTimes = new Set(
      booked
        .filter((a) => a.status !== "cancelled")
        .map((a) => a.appointmentTime)
    );

    const availableSlots = AVAILABLE_TIME_SLOTS.filter((slot) => !bookedTimes.has(slot));

    return {
      date,
      doctorId,
      dayName: appointmentDay,
      availableSlots,
      bookedSlots: Array.from(bookedTimes),
    };
  }

  async createAppointment(userId: string, input: CreateAppointmentDTO) {
    const doctor = await this.doctorRepository.getById(input.doctorId);
    if (!doctor) {
      throw new HttpException(404, "Doctor not found");
    }

    const doctorObjectId = doctor._id.toString();

    const appointmentDay = getWeekdayFromDate(input.appointmentDate);
    const isAvailableDay = (doctor.availableDays ?? []).some(
      (day) => day.toLowerCase() === appointmentDay.toLowerCase()
    );
    if (!isAvailableDay) {
      throw new HttpException(400, `Doctor is not available on ${appointmentDay}s. Available days: ${(doctor.availableDays ?? []).join(", ")}`);
    }

    const appointmentTime = normalizeTimeSlot(input.appointmentTime);
    if (!AVAILABLE_TIME_SLOTS.includes(appointmentTime)) {
      throw new HttpException(
        400,
        `Invalid time slot. Allowed slots: ${AVAILABLE_TIME_SLOTS.join(", ")}`
      );
    }

    const appointmentDate = new Date(input.appointmentDate + "T00:00:00.000Z");
    const dateEnd = new Date(input.appointmentDate + "T23:59:59.999Z");
    const existingBookings = await this.appointmentRepository.findBookedSlots(
      doctorObjectId,
      appointmentDate,
      dateEnd
    );
    const conflict = existingBookings.find(
      (a) =>
        a.status !== "cancelled" &&
        normalizeTimeSlot(a.appointmentTime) === appointmentTime
    );
    if (conflict) {
      throw new HttpException(409, "This time slot is already booked. Please choose another slot.");
    }

    const appointment = await this.appointmentRepository.create({
      ...input,
      userId: userId as any,
      doctorId: doctor._id,
      doctorName: doctor.fullName,
      specialty: doctor.specialization,
      appointmentDate,
      appointmentTime,
      status: input.status ?? "pending",
      amount: input.amount ?? doctor.consultationFee ?? 0,
      paymentMethod: input.paymentMethod ?? "",
      paymentStatus: input.paymentStatus ?? "pending",
    } as unknown as Partial<IAppointment>);

    return this.toPublicAppointment(appointment);
  }

  async listAppointments(page: number, limit: number, search?: string, userId?: string, options: AppointmentListOptions = {}) {
    const { data, total } = await this.appointmentRepository.list(page, limit, search, userId, options);
    return {
      data: data.map((appointment) => this.toPublicAppointment(appointment)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getAppointment(id: string) {
    const appointment = await this.appointmentRepository.getById(id);
    if (!appointment) {
      throw new HttpException(404, "Appointment not found");
    }
    return this.toPublicAppointment(appointment);
  }

  async updateAppointment(id: string, input: UpdateAppointmentDTO, requestor?: { id: string; role: string }) {
    const existing = await this.appointmentRepository.getById(id);
    if (!existing) {
      throw new HttpException(404, "Appointment not found");
    }

    if (requestor && requestor.role !== "admin") {
      const userRef: any = existing.userId;
      const appointmentUserId = userRef && typeof userRef === "object" && userRef._id
        ? userRef._id.toString()
        : userRef?.toString?.();
      if (appointmentUserId !== requestor.id) {
        throw new HttpException(403, "You can only update your own appointments");
      }
    }

    if (input.status && requestor && requestor.role !== "admin") {
      const allowedTransitions = VALID_STATUS_TRANSITIONS[existing.status] || [];
      if (!allowedTransitions.includes(input.status)) {
        throw new HttpException(
          400,
          `Cannot change appointment status from "${existing.status}" to "${input.status}"`
        );
      }
    }

    const updateData: Record<string, any> = { ...input };

    if (input.appointmentDate) {
      updateData.appointmentDate = new Date(input.appointmentDate + "T00:00:00.000Z");
    }

    if (input.appointmentTime) {
      updateData.appointmentTime = normalizeTimeSlot(input.appointmentTime);
    }

    const appointment = await this.appointmentRepository.update(id, updateData as Partial<IAppointment>);
    if (!appointment) {
      throw new HttpException(404, "Appointment not found");
    }
    return this.toPublicAppointment(appointment);
  }

  async cancelAppointment(id: string, requestor?: { id: string; role: string }) {
    const existing = await this.appointmentRepository.getById(id);
    if (!existing) {
      throw new HttpException(404, "Appointment not found");
    }

    if (requestor && requestor.role !== "admin") {
      const userRef: any = existing.userId;
      const appointmentUserId = userRef && typeof userRef === "object" && userRef._id
        ? userRef._id.toString()
        : userRef?.toString?.();
      if (appointmentUserId !== requestor.id) {
        throw new HttpException(403, "You can only cancel your own appointments");
      }
    }

    if (existing.status === "cancelled") {
      throw new HttpException(400, "Appointment is already cancelled");
    }

    if (existing.status === "completed") {
      throw new HttpException(400, "Cannot cancel a completed appointment");
    }

    const appointment = await this.appointmentRepository.update(id, {
      status: "cancelled",
    } as Partial<IAppointment>);
    if (!appointment) {
      throw new HttpException(404, "Appointment not found");
    }
    return this.toPublicAppointment(appointment);
  }

  async completeAppointment(id: string) {
    const existing = await this.appointmentRepository.getById(id);
    if (!existing) {
      throw new HttpException(404, "Appointment not found");
    }

    if (existing.status === "completed") {
      throw new HttpException(400, "Appointment is already completed");
    }

    if (existing.status === "cancelled") {
      throw new HttpException(400, "Cannot complete a cancelled appointment");
    }

    const appointment = await this.appointmentRepository.update(id, {
      status: "completed",
    } as Partial<IAppointment>);
    if (!appointment) {
      throw new HttpException(404, "Appointment not found");
    }
    return this.toPublicAppointment(appointment);
  }

  async deleteAppointment(id: string) {
    const deleted = await this.appointmentRepository.delete(id);
    if (!deleted) {
      throw new HttpException(404, "Appointment not found");
    }
    return { success: true };
  }
}
