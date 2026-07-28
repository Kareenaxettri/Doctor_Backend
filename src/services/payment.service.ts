import { PaymentRepository } from "../repositories/payment.repository";
import { AppointmentRepository } from "../repositories/appointment.repository";
import { DoctorRepository } from "../repositories/doctor.repository";
import { CreatePaymentDTO, UpdatePaymentDTO } from "../dtos/payment.dto";
import { HttpException } from "../exception/http-exception";
import { IPayment } from "../models/payment.model";

export class PaymentService {
  constructor(
    private readonly paymentRepository = new PaymentRepository(),
    private readonly appointmentRepository = new AppointmentRepository(),
    private readonly doctorRepository = new DoctorRepository()
  ) {}

  private toPublicPayment(payment: IPayment) {
    const extractId = (value: any): string | null => {
      if (!value) return null;
      // Populated Mongoose docs expose their real id via `_id`; raw ObjectIds stringify directly.
      if (typeof value === "object" && value._id) return value._id.toString();
      return value.toString?.() ?? null;
    };

    const userRef = payment.userId as any;
    const doctorRef = payment.doctorId as any;

    return {
      id: payment._id.toString(),
      appointmentId: extractId(payment.appointmentId),
      userId: extractId(userRef),
      doctorId: extractId(doctorRef),
      patientName: typeof userRef === "object" ? userRef?.fullName ?? null : null,
      patientEmail: typeof userRef === "object" ? userRef?.email ?? null : null,
      doctorName: typeof doctorRef === "object" ? doctorRef?.fullName ?? null : null,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.paymentMethod ?? "cash",
      transactionId: payment.transactionId ?? "",
      reference: payment.transactionId || payment._id.toString(),
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  async createPayment(userId: string, input: CreatePaymentDTO) {
    const appointment = await this.appointmentRepository.getById(input.appointmentId);
    if (!appointment) {
      throw new HttpException(404, "Appointment not found for this payment");
    }

    // This app has no real payment gateway wired up yet, so a payment that
    // isn't explicitly marked otherwise is treated as an immediate success.
    const status = input.status ?? "paid";
    const normalizedMethod = (input.paymentMethod || "card").toLowerCase();
    const supportedMethods = ["esewa", "khalti", "fonepay", "card", "cash"];
    if (!supportedMethods.includes(normalizedMethod)) {
      throw new HttpException(400, "Unsupported payment method");
    }

    const doctorObjectId = await this.doctorRepository.resolveObjectId(input.doctorId);
    if (!doctorObjectId) {
      throw new HttpException(404, "Doctor not found");
    }

    const payment = await this.paymentRepository.create({
      ...input,
      userId: userId as any,
      appointmentId: input.appointmentId as any,
      doctorId: doctorObjectId,
      status,
      paymentMethod: normalizedMethod,
      paidAt: status === "paid" ? new Date() : undefined,
    } as unknown as Partial<IPayment>);

    // Keep the appointment's own paymentStatus/paymentMethod/amount in sync
    // so the appointments list reflects payment state without a join.
    await this.appointmentRepository.update(input.appointmentId, {
      paymentStatus: status,
      paymentMethod: normalizedMethod,
      amount: input.amount,
      status: status === "paid" ? "confirmed" : appointment.status,
    } as any);

    return this.toPublicPayment(payment);
  }

  async listPayments(page: number, limit: number, search?: string, userId?: string) {
    const { data, total } = await this.paymentRepository.list(page, limit, search, userId);
    return {
      data: data.map((payment) => this.toPublicPayment(payment)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getPayment(id: string) {
    const payment = await this.paymentRepository.getById(id);
    if (!payment) {
      throw new HttpException(404, "Payment not found");
    }
    return this.toPublicPayment(payment);
  }

  async updatePayment(id: string, input: UpdatePaymentDTO) {
    const payment = await this.paymentRepository.update(id, input as Partial<IPayment>);
    if (!payment) {
      throw new HttpException(404, "Payment not found");
    }
    return this.toPublicPayment(payment);
  }

  async deletePayment(id: string) {
    const deleted = await this.paymentRepository.delete(id);
    if (!deleted) {
      throw new HttpException(404, "Payment not found");
    }
    return { success: true };
  }
}
