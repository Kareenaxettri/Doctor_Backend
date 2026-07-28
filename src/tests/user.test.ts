import request from "supertest";
import mongoose from "mongoose";
import app from "../app";
import { MONGODB_URL } from "../configs/constant";
import { UserModel } from "../models/user.model";

describe("User Profile API Tests (/api/v1/users)", () => {
  const testUser = {
    fullName: "Profile Tester",
    email: `profile_test_${Date.now()}@example.com`,
    contactNumber: `9846${Math.floor(100000 + Math.random() * 900000)}`,
    gender: "female",
    password: "Password123!",
  };

  let token = "";

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
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: testUser.email });
    await mongoose.disconnect();
  });

  it("should reject /me without auth", async () => {
    const res = await request(app).get("/api/v1/users/me");
    expect(res.status).toBe(401);
  });

  it("should return the current user profile", async () => {
    if (!token) return;
    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testUser.email);
  });

  it("should update the profile full name", async () => {
    if (!token) return;
    const res = await request(app)
      .patch("/api/v1/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .field("fullName", "Updated Profile Name");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe("Updated Profile Name");
  });

  it("should reject an invalid email on profile update", async () => {
    if (!token) return;
    const res = await request(app)
      .patch("/api/v1/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .field("email", "not-an-email");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should reject profile update without auth", async () => {
    const res = await request(app)
      .patch("/api/v1/users/profile")
      .field("fullName", "No Auth");
    expect(res.status).toBe(401);
  });
});
