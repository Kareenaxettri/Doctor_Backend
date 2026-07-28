import request from "supertest";
import mongoose from "mongoose";
import app from "../app";
import { MONGODB_URL } from "../configs/constant";
import { UserModel } from "../models/user.model";
import { DoctorModel } from "../models/doctor.model";
import { AppointmentModel } from "../models/appointment.model";

describe("Authentication API Tests", () => {
  const testUser = {
    fullName: "Test Patient",
    email: `testpatient_${Date.now()}@example.com`,
    contactNumber: `9841${Math.floor(100000 + Math.random() * 900000)}`,
    gender: "Male",
    password: "Password123!",
  };

  let token = "";
  let resetToken = "";

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URL);
    }
    process.env.NODE_ENV = "test";
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: testUser.email });
    await mongoose.disconnect();
  });

  it("should register a new user successfully", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.email).toBe(testUser.email);
  });

  it("should fail to register with duplicate email", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(testUser);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should fail to register with missing fields", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({ email: "a@b.com" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should log in successfully and return a JWT token", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: testUser.email,
      password: testUser.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("token");
    token = res.body.data.token;
  });

  it("should reject login with wrong password", async () => {
    const res = await request(app).post("/api/v1/auth/login").send({
      email: testUser.email,
      password: "WrongPassword123!",
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should get current user profile using WhoAmI endpoint", async () => {
    const res = await request(app)
      .get("/api/v1/auth/whoami")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testUser.email);
  });

  it("should reject unauthenticated WhoAmI request", async () => {
    const res = await request(app).get("/api/v1/auth/whoami");
    expect(res.status).toBe(401);
  });

  it("should handle forgot password request", async () => {
    const res = await request(app).post("/api/v1/auth/forgot-password").send({
      email: testUser.email,
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    if (res.body.data?.resetToken) {
      resetToken = res.body.data.resetToken;
    }
  });

  it("should return success for non-existent email in forgot password", async () => {
    const res = await request(app).post("/api/v1/auth/forgot-password").send({
      email: "nonexistent@example.com",
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should reset password using token", async () => {
    if (!resetToken) return;
    const newPassword = "NewSecretPassword123!";
    const res = await request(app).post("/api/v1/auth/reset-password").send({
      token: resetToken,
      newPassword,
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: testUser.email,
      password: newPassword,
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
  });

  it("should update password for authenticated user", async () => {
    const res = await request(app)
      .patch("/api/v1/auth/update-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "NewSecretPassword123!",
        newPassword: "Password123!",
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("Doctor API Tests", () => {
  let token = "";
  let doctorId = "";

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URL);
    }
    process.env.NODE_ENV = "test";

    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: "admin@doctor.com",
      password: "Admin@123",
    });
    if (loginRes.status === 200) {
      token = loginRes.body.data?.token || "";
    }
  });

  afterAll(async () => {
    if (doctorId) {
      await DoctorModel.findByIdAndDelete(doctorId);
    }
    await mongoose.disconnect();
  });

  it("should list doctors without auth", async () => {
    const res = await request(app).get("/api/v1/doctors");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("should create a doctor (admin only)", async () => {
    if (!token) return;
    const res = await request(app)
      .post("/api/v1/doctors")
      .set("Authorization", `Bearer ${token}`)
      .send({
        doctorCode: `test-${Date.now()}`,
        fullName: "Dr. Test Doctor",
        specialization: "General",
        experienceYears: 5,
        consultationFee: 1000,
        availableDays: ["Monday", "Wednesday"],
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    doctorId = res.body.data?.id;
  });

  it("should get a single doctor", async () => {
    if (!doctorId) return;
    const res = await request(app).get(`/api/v1/doctors/${doctorId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should return 404 for non-existent doctor", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/v1/doctors/${fakeId}`);
    expect(res.status).toBe(404);
  });

  it("should update a doctor", async () => {
    if (!token || !doctorId) return;
    const res = await request(app)
      .patch(`/api/v1/doctors/${doctorId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ consultationFee: 1500 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should delete a doctor", async () => {
    if (!token || !doctorId) return;
    const res = await request(app)
      .delete(`/api/v1/doctors/${doctorId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    doctorId = "";
  });
});

describe("Appointment API Tests", () => {
  let userToken = "";
  let doctorId = "";

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URL);
    }
    process.env.NODE_ENV = "test";

    const testEmail = `appt_test_${Date.now()}@example.com`;
    await request(app).post("/api/v1/auth/register").send({
      fullName: "Appointment Tester",
      email: testEmail,
      contactNumber: `9801${Math.floor(100000 + Math.random() * 900000)}`,
      gender: "female",
      password: "TestPass123!",
    });

    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: testEmail,
      password: "TestPass123!",
    });
    userToken = loginRes.body.data?.token || "";

    const doctor = await DoctorModel.findOne({ isActive: true });
    if (doctor) {
      doctorId = doctor._id.toString();
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("should list appointments (authenticated)", async () => {
    if (!userToken) return;
    const res = await request(app)
      .get("/api/v1/appointments")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should get available slots for a doctor", async () => {
    if (!userToken || !doctorId) return;
    const doctor = await DoctorModel.findById(doctorId);
    const days = doctor?.availableDays || [];
    if (days.length === 0) return;

    const dayName = days[0].toLowerCase();
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      if (d.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase() === dayName) {
        const dateStr = d.toISOString().split("T")[0];
        const res = await request(app)
          .get(`/api/v1/appointments/slots/${doctorId}?date=${dateStr}`)
          .set("Authorization", `Bearer ${userToken}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty("availableSlots");
        return;
      }
    }
  });

  it("should reject appointment without auth", async () => {
    const res = await request(app).post("/api/v1/appointments").send({});
    expect(res.status).toBe(401);
  });

  it("should return 404 for non-existent appointment", async () => {
    if (!userToken) return;
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/v1/appointments/${fakeId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(404);
  });
});
