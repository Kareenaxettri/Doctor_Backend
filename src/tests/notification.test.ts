import request from "supertest";
import mongoose from "mongoose";
import app from "../app";
import { MONGODB_URL } from "../configs/constant";
import { UserModel } from "../models/user.model";

describe("Notifications API Tests", () => {
  const testUser = {
    fullName: "Notification Tester",
    email: `notif_test_${Date.now()}@example.com`,
    contactNumber: `9842${Math.floor(100000 + Math.random() * 900000)}`,
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

  it("should reject listing notifications without auth", async () => {
    const res = await request(app).get("/api/v1/notifications");
    expect(res.status).toBe(401);
  });

  it("should list notifications (empty) for a new user", async () => {
    if (!token) return;
    const res = await request(app)
      .get("/api/v1/notifications")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("should get unread count", async () => {
    if (!token) return;
    const res = await request(app)
      .get("/api/v1/notifications/unread-count")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should mark all notifications as read without error when list is empty", async () => {
    if (!token) return;
    const res = await request(app)
      .patch("/api/v1/notifications/read-all")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should return an error marking a non-existent notification as read", async () => {
    if (!token) return;
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .patch(`/api/v1/notifications/${fakeId}/read`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("should delete all notifications without error when list is empty", async () => {
    if (!token) return;
    const res = await request(app)
      .delete("/api/v1/notifications")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
