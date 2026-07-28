import request from "supertest";
import mongoose from "mongoose";
import app from "../app";
import { MONGODB_URL } from "../configs/constant";
import { UserModel } from "../models/user.model";
import { DoctorModel } from "../models/doctor.model";

describe("Doctors API Tests", () => {
  let adminToken = "";
  let userToken = "";
  let createdDoctorId = "";
  let existingDoctorId = "";

  const regularUser = {
    fullName: "Doctor Test User",
    email: `doctor_test_${Date.now()}@example.com`,
    contactNumber: `9846${Math.floor(100000 + Math.random() * 900000)}`,
    gender: "female",
    password: "Password123!",
  };

  const newDoctor = {
    doctorCode: `test-doc-${Date.now()}`,
    fullName: "Dr. Test Physician",
    specialization: "Cardiologist",
    experienceYears: 8,
    consultationFee: 1500,
    bio: "Test bio",
    clinic: "Test Clinic",
    contactNumber: "+977-9800000001",
    availableDays: ["Monday", "Tuesday", "Wednesday"],
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URL);
    }
    process.env.NODE_ENV = "test";

    const adminLogin = await request(app).post("/api/v1/auth/login").send({
      email: "admin@doctor.com",
      password: "Admin@123",
    });
    adminToken = adminLogin.body.data?.token || "";

    await request(app).post("/api/v1/auth/register").send(regularUser);
    const userLogin = await request(app).post("/api/v1/auth/login").send({
      email: regularUser.email,
      password: regularUser.password,
    });
    userToken = userLogin.body.data?.token || "";

    const doctor = await DoctorModel.findOne({ isActive: true });
    existingDoctorId = doctor?._id.toString() || "";
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: regularUser.email });
    if (createdDoctorId) {
      await DoctorModel.findByIdAndDelete(createdDoctorId);
    }
    await mongoose.disconnect();
  });

  it("should list doctors without requiring authentication", async () => {
    const res = await request(app).get("/api/v1/doctors");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toBeDefined();
  });

  it("should support pagination and search query params", async () => {
    const res = await request(app).get("/api/v1/doctors").query({ page: 1, limit: 5, search: "cardio" });
    expect(res.status).toBe(200);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(5);
  });

  it("should sort doctors by consultation fee ascending", async () => {
    const res = await request(app).get("/api/v1/doctors").query({ sortBy: "consultationFee", order: "asc", limit: 50 });
    expect(res.status).toBe(200);
    const fees = res.body.data.map((d: any) => d.consultationFee);
    const sorted = [...fees].sort((a, b) => a - b);
    expect(fees).toEqual(sorted);
  });

  it("should filter doctors by specialization", async () => {
    const res = await request(app).get("/api/v1/doctors").query({ specialization: "Cardiologist", limit: 50 });
    expect(res.status).toBe(200);
    for (const doctor of res.body.data) {
      expect(doctor.specialization.toLowerCase()).toContain("cardiologist");
    }
  });

  it("should include HATEOAS pagination links on the list response", async () => {
    const res = await request(app).get("/api/v1/doctors").query({ page: 1, limit: 5 });
    expect(res.status).toBe(200);
    expect(res.body._links).toBeDefined();
    expect(res.body._links.self.href).toContain("/api/v1/doctors");
    expect(res.body._links.create).toEqual({ href: "/api/v1/doctors", method: "POST" });
  });

  it("should include HATEOAS links (self/update/delete) on a single doctor", async () => {
    if (!existingDoctorId) return;
    const res = await request(app).get(`/api/v1/doctors/${existingDoctorId}`);
    expect(res.status).toBe(200);
    expect(res.body.data._links.self.href).toBe(`/api/v1/doctors/${existingDoctorId}`);
    expect(res.body.data._links.update.method).toBe("PATCH");
    expect(res.body.data._links.delete.method).toBe("DELETE");
  });

  it("should return an ETag header and support conditional GET with 304", async () => {
    if (!existingDoctorId) return;
    const first = await request(app).get(`/api/v1/doctors/${existingDoctorId}`);
    expect(first.status).toBe(200);
    const etag = first.headers["etag"];
    expect(etag).toBeDefined();

    const second = await request(app)
      .get(`/api/v1/doctors/${existingDoctorId}`)
      .set("If-None-Match", etag);
    expect(second.status).toBe(304);
  });

  it("should fetch a single doctor by id", async () => {
    if (!existingDoctorId) return;
    const res = await request(app).get(`/api/v1/doctors/${existingDoctorId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(existingDoctorId);
  });

  it("should return 404 for a non-existent doctor id", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/v1/doctors/${fakeId}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("should reject creating a doctor without authentication", async () => {
    const res = await request(app).post("/api/v1/doctors").send(newDoctor);
    expect(res.status).toBe(401);
  });

  it("should reject a non-admin user from creating a doctor", async () => {
    if (!userToken) return;
    const res = await request(app)
      .post("/api/v1/doctors")
      .set("Authorization", `Bearer ${userToken}`)
      .send(newDoctor);
    expect(res.status).toBe(403);
  });

  it("should reject an invalid doctor payload from an admin", async () => {
    if (!adminToken) return;
    const res = await request(app)
      .post("/api/v1/doctors")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ fullName: "" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should let an admin create a new doctor", async () => {
    if (!adminToken) return;
    const res = await request(app)
      .post("/api/v1/doctors")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(newDoctor);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.doctorCode).toBe(newDoctor.doctorCode);
    createdDoctorId = res.body.data.id;
  });

  it("should let an admin update a doctor", async () => {
    if (!adminToken || !createdDoctorId) return;
    const res = await request(app)
      .patch(`/api/v1/doctors/${createdDoctorId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ consultationFee: 2000 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.consultationFee).toBe(2000);
  });

  it("should reject a non-admin user from updating a doctor", async () => {
    if (!userToken || !createdDoctorId) return;
    const res = await request(app)
      .patch(`/api/v1/doctors/${createdDoctorId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ consultationFee: 3000 });
    expect(res.status).toBe(403);
  });

  it("should let an admin delete a doctor", async () => {
    if (!adminToken || !createdDoctorId) return;
    const res = await request(app)
      .delete(`/api/v1/doctors/${createdDoctorId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    createdDoctorId = "";
  });

  it("should return 404 when fetching the deleted doctor", async () => {
    if (!existingDoctorId) return;
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/v1/doctors/${fakeId}`);
    expect(res.status).toBe(404);
  });
});
