import request from "supertest";
import mongoose from "mongoose";
import app from "../app";
import { MONGODB_URL } from "../configs/constant";
import { UserModel } from "../models/user.model";
import { DoctorModel } from "../models/doctor.model";
import { AppointmentModel } from "../models/appointment.model";

// Returns the date string (YYYY-MM-DD) of the next Monday from today, so it
// always lands on a weekday the seeded doctors are available on.
function getNextMondayDateString(): string {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday ... 6 = Saturday
  const daysUntilMonday = ((1 - day + 7) % 7) || 7;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  return nextMonday.toISOString().split("T")[0];
}

describe("Appointments API Tests", () => {
  let userToken = "";
  let secondUserToken = "";
  let adminToken = "";
  let doctorId = "";
  let createdAppointmentId = "";

  const appointmentDate = getNextMondayDateString();
  const appointmentTime = "10:00";

  const testUser = {
    fullName: "Appointment Tester",
    email: `appt_test_${Date.now()}@example.com`,
    contactNumber: `9847${Math.floor(100000 + Math.random() * 900000)}`,
    gender: "male",
    password: "Password123!",
  };

  const secondUser = {
    fullName: "Another Patient",
    email: `appt_test2_${Date.now()}@example.com`,
    contactNumber: `9848${Math.floor(100000 + Math.random() * 900000)}`,
    gender: "female",
    password: "Password123!",
  };

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
    userToken = loginRes.body.data?.token || "";

    await request(app).post("/api/v1/auth/register").send(secondUser);
    const secondLoginRes = await request(app).post("/api/v1/auth/login").send({
      email: secondUser.email,
      password: secondUser.password,
    });
    secondUserToken = secondLoginRes.body.data?.token || "";

    const adminLogin = await request(app).post("/api/v1/auth/login").send({
      email: "admin@doctor.com",
      password: "Admin@123",
    });
    adminToken = adminLogin.body.data?.token || "";

    const doctor = await DoctorModel.findOne({ isActive: true });
    doctorId = doctor?._id.toString() || "";
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: { $in: [testUser.email, secondUser.email] } });
    if (createdAppointmentId) {
      await AppointmentModel.findByIdAndDelete(createdAppointmentId);
    }
    await mongoose.disconnect();
  });

  it("should reject listing appointments without auth", async () => {
    const res = await request(app).get("/api/v1/appointments");
    expect(res.status).toBe(401);
  });

  it("should fetch available slots for a doctor on a given date", async () => {
    if (!userToken || !doctorId) return;
    const res = await request(app)
      .get(`/api/v1/appointments/slots/${doctorId}`)
      .query({ date: appointmentDate })
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.availableSlots)).toBe(true);
  });

  it("should reject an appointment with an invalid time slot", async () => {
    if (!userToken || !doctorId) return;
    const res = await request(app)
      .post("/api/v1/appointments")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        doctorId,
        appointmentDate,
        appointmentTime: "23:45",
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should let an authenticated user book an appointment", async () => {
    if (!userToken || !doctorId) return;
    const res = await request(app)
      .post("/api/v1/appointments")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        doctorId,
        appointmentDate,
        appointmentTime,
        symptoms: "Routine check-up",
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("pending");
    createdAppointmentId = res.body.data.id;
  });

  it("should reject double-booking the same doctor and slot", async () => {
    if (!userToken || !doctorId) return;
    const res = await request(app)
      .post("/api/v1/appointments")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ doctorId, appointmentDate, appointmentTime });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("should let the owner fetch their own appointment", async () => {
    if (!userToken || !createdAppointmentId) return;
    const res = await request(app)
      .get(`/api/v1/appointments/${createdAppointmentId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdAppointmentId);
  });

  it("should include HATEOAS links on a single appointment", async () => {
    if (!userToken || !createdAppointmentId) return;
    const res = await request(app)
      .get(`/api/v1/appointments/${createdAppointmentId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data._links.self.href).toBe(`/api/v1/appointments/${createdAppointmentId}`);
    expect(res.body.data._links.cancel).not.toBeNull();
  });

  it("should return an ETag header and support conditional GET with 304", async () => {
    if (!userToken || !createdAppointmentId) return;
    const first = await request(app)
      .get(`/api/v1/appointments/${createdAppointmentId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(first.status).toBe(200);
    const etag = first.headers["etag"];
    expect(etag).toBeDefined();

    const second = await request(app)
      .get(`/api/v1/appointments/${createdAppointmentId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .set("If-None-Match", etag);
    expect(second.status).toBe(304);
  });

  it("should filter the owner's appointments by status", async () => {
    if (!userToken) return;
    const res = await request(app)
      .get("/api/v1/appointments")
      .query({ status: "pending" })
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    for (const appt of res.body.data) {
      expect(appt.status).toBe("pending");
    }
  });

  it("should include HATEOAS pagination links on the appointments list", async () => {
    if (!userToken) return;
    const res = await request(app)
      .get("/api/v1/appointments")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body._links.self.href).toContain("/api/v1/appointments");
    expect(res.body._links.create).toEqual({ href: "/api/v1/appointments", method: "POST" });
  });

  it("should list the appointment for the owning user", async () => {
    if (!userToken || !createdAppointmentId) return;
    const res = await request(app)
      .get("/api/v1/appointments")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    const ids = (res.body.data || []).map((a: any) => a.id);
    expect(ids).toContain(createdAppointmentId);
  });

  it("should prevent another user from cancelling someone else's appointment", async () => {
    if (!secondUserToken || !createdAppointmentId) return;
    const res = await request(app)
      .patch(`/api/v1/appointments/${createdAppointmentId}/cancel`)
      .set("Authorization", `Bearer ${secondUserToken}`);
    expect(res.status).toBe(403);
  });

  it("should prevent a non-admin from marking an appointment complete", async () => {
    if (!userToken || !createdAppointmentId) return;
    const res = await request(app)
      .patch(`/api/v1/appointments/${createdAppointmentId}/complete`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it("should let an admin mark the appointment as completed", async () => {
    if (!adminToken || !createdAppointmentId) return;
    const res = await request(app)
      .patch(`/api/v1/appointments/${createdAppointmentId}/complete`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("completed");
  });

  it("should not allow cancelling an already-completed appointment", async () => {
    if (!userToken || !createdAppointmentId) return;
    const res = await request(app)
      .patch(`/api/v1/appointments/${createdAppointmentId}/cancel`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 404 for a non-existent appointment", async () => {
    if (!userToken) return;
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/v1/appointments/${fakeId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(404);
  });
});
