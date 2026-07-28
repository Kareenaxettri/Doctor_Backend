import request from "supertest";
import mongoose from "mongoose";
import app from "../app";
import { MONGODB_URL } from "../configs/constant";
import { UserModel } from "../models/user.model";
import { DoctorModel } from "../models/doctor.model";
import { PaymentModel } from "../models/payment.model";
import { AppointmentModel } from "../models/appointment.model";

describe("Payments API Tests", () => {
  const testUser = {
    fullName: "Payment Tester",
    email: `pay_test_${Date.now()}@example.com`,
    contactNumber: `9843${Math.floor(100000 + Math.random() * 900000)}`,
    gender: "Male",
    password: "Password123!",
  };

  let token = "";
  let doctorId = "";
  let paymentId = "";
  let createdAppointmentId = "";

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URL);
    }
    process.env.NODE_ENV = "test";

    await request(app).post("/api/v1/auth/register").send(testUser);
    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });
    token = loginRes.body.data?.token || "";

    const doctor = await DoctorModel.findOne({ isActive: true });
    doctorId = doctor?._id.toString() || "";
  });

  afterAll(async () => {
    if (paymentId) {
      await PaymentModel.findByIdAndDelete(paymentId);
    }
    if (createdAppointmentId) {
      await AppointmentModel.findByIdAndDelete(createdAppointmentId);
    }
    await UserModel.deleteMany({ email: testUser.email });
    await mongoose.disconnect();
  });

  it("should reject listing payments without auth", async () => {
    const res = await request(app).get("/api/v1/payments");
    expect(res.status).toBe(401);
  });

  it("should list payments for the authenticated user", async () => {
    if (!token) return;
    const res = await request(app)
      .get("/api/v1/payments")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("should reject creating a payment with missing fields", async () => {
    if (!token) return;
    const res = await request(app)
      .post("/api/v1/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should create a payment", async () => {
    if (!token || !doctorId) return;

    // A payment must reference a real, existing appointment — create one first
    // instead of using a randomly generated ObjectId that will never exist.
    // The appointment date must fall on one of the doctor's actual available
    // days, so fetch the doctor and compute the next matching date instead
    // of hardcoding one that might not match.
    const doctorRes = await request(app).get(`/api/v1/doctors/${doctorId}`);
    const availableDays: string[] = doctorRes.body.data?.availableDays || [];

    const nextAvailableDate = (() => {
      const d = new Date();
      for (let i = 0; i < 14; i++) {
        const candidate = new Date(d);
        candidate.setUTCDate(d.getUTCDate() + i);
        const weekday = candidate.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
        if (availableDays.some((day) => day.toLowerCase() === weekday.toLowerCase())) {
          return candidate.toISOString().split("T")[0];
        }
      }
      // Fallback: doctor has no availableDays set, just try tomorrow.
      const tomorrow = new Date(d);
      tomorrow.setUTCDate(d.getUTCDate() + 1);
      return tomorrow.toISOString().split("T")[0];
    })();

    const appointmentRes = await request(app)
      .post("/api/v1/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        doctorId,
        appointmentDate: nextAvailableDate,
        appointmentTime: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"][Math.floor(Math.random() * 6)],
      });
    const appointmentId = appointmentRes.body.data?.id || appointmentRes.body.data?._id;
    createdAppointmentId = appointmentId;

    const res = await request(app)
      .post("/api/v1/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        appointmentId,
        doctorId,
        amount: 1200,
        currency: "NPR",
        paymentMethod: "card",
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    paymentId = res.body.data?.id;
  });

  it("should get a single payment", async () => {
    if (!token || !paymentId) return;
    const res = await request(app)
      .get(`/api/v1/payments/${paymentId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should reject a non-admin updating a payment", async () => {
    if (!token || !paymentId) return;
    const res = await request(app)
      .patch(`/api/v1/payments/${paymentId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "paid" });
    expect(res.status).toBe(403);
  });

  it("should reject a non-admin deleting a payment", async () => {
    if (!token || !paymentId) return;
    const res = await request(app)
      .delete(`/api/v1/payments/${paymentId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("should return 401 for payment endpoints without a token", async () => {
    const res = await request(app).post("/api/v1/payments").send({});
    expect(res.status).toBe(401);
  });
});