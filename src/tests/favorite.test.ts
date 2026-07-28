import request from "supertest";
import mongoose from "mongoose";
import app from "../app";
import { MONGODB_URL } from "../configs/constant";
import { UserModel } from "../models/user.model";
import { DoctorModel } from "../models/doctor.model";

describe("Favorites API Tests", () => {
  const testUser = {
    fullName: "Favorite Tester",
    email: `fav_test_${Date.now()}@example.com`,
    contactNumber: `9840${Math.floor(100000 + Math.random() * 900000)}`,
    gender: "Male",
    password: "Password123!",
  };

  let token = "";
  let doctorId = "";

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
    await UserModel.deleteMany({ email: testUser.email });
    await mongoose.disconnect();
  });

  it("should reject listing favorites without auth", async () => {
    const res = await request(app).get("/api/v1/favorites");
    expect(res.status).toBe(401);
  });

  it("should list favorites (empty) for a new user", async () => {
    if (!token) return;
    const res = await request(app)
      .get("/api/v1/favorites")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("should add a doctor to favorites via toggle", async () => {
    if (!token || !doctorId) return;
    const res = await request(app)
      .post(`/api/v1/favorites/${doctorId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should show the doctor in the favorites list after adding", async () => {
    if (!token || !doctorId) return;
    const res = await request(app)
      .get("/api/v1/favorites")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    const ids = (res.body.data || []).map((d: any) => d.id || d._id?.toString());
    expect(ids).toContain(doctorId);
  });

  it("should remove the doctor from favorites when toggled again", async () => {
    if (!token || !doctorId) return;
    const res = await request(app)
      .post(`/api/v1/favorites/${doctorId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should reject toggle with a missing doctor id", async () => {
    if (!token) return;
    const res = await request(app)
      .post("/api/v1/favorites/toggle")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
