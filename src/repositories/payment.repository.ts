import { PaymentModel, IPayment } from "../models/payment.model";
import { escapeRegex } from "../utils/apihelper.util";

export interface PaginatedPayments {
  data: IPayment[];
  total: number;
}

export class PaymentRepository {
  async create(data: Partial<IPayment>): Promise<IPayment> {
    return PaymentModel.create(data);
  }

  async getById(id: string): Promise<IPayment | null> {
    return PaymentModel.findById(id).populate("appointmentId").populate("userId", "fullName email").populate("doctorId", "fullName specialization");
  }

  async list(page: number, limit: number, search?: string, userId?: string): Promise<PaginatedPayments> {
    const filter: Record<string, any> = {};
    if (userId) {
      filter.userId = userId;
    }
    if (search && search.trim().length > 0) {
      const regex = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [{ status: regex }, { transactionId: regex }];
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      PaymentModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("appointmentId").populate("userId", "fullName email").populate("doctorId", "fullName specialization"),
      PaymentModel.countDocuments(filter),
    ]);
    return { data, total };
  }

  async update(id: string, data: Partial<IPayment>): Promise<IPayment | null> {
    return PaymentModel.findByIdAndUpdate(id, data, { returnDocument: "after" }).populate("appointmentId").populate("userId", "fullName email").populate("doctorId", "fullName specialization");
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await PaymentModel.findByIdAndDelete(id);
    return !!deleted;
  }
}
