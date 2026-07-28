import request from "supertest";
import mongoose from "mongoose";
import app from "../app";
import { MONGODB_URL } from "../configs/constant";
import { UserModel } from "../models/user.model";

describe("Admin User Management API Tests", () => {
  let adminToken = "";
  let userToken = "";
  let createdUserId = "";

  const newAdminManagedUser = {
    fullName: "Admin Created User",
    email: `admin_created_${Date.now()}@example.com`,
    contactNumber: `9844${Math.floor(100000 + Math.random() * 900000)}`,
    gender: "male",
    password: "Password123!",
  };

  const regularUser = {
    fullName: "Regular User",
    email: `regular_${Date.now()}@example.com`,
    contactNumber: `9845${Math.floor(100000 + Math.random() * 900000)}`,
    gender: "female",
    password: "Password123!",
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
  });

  afterAll(async () => {
    await UserModel.deleteMany({
      email: { $in: [newAdminManagedUser.email, regularUser.email] },
    });
    await mongoose.disconnect();
  });

  it("should reject listing users without auth", async () => {
    const res = await request(app).get("/api/v1/admin/users");
    expect(res.status).toBe(401);
  });

  it("should reject a non-admin from listing users", async () => {
    if (!userToken) return;
    const res = await request(app)
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it("should allow an admin to list users", async () => {
    if (!adminToken) return;
    const res = await request(app)
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("should let an admin create a new user", async () => {
    if (!adminToken) return;
    const res = await request(app)
      .post("/api/v1/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(newAdminManagedUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    createdUserId = res.body.data?.id;
  });

  it("should reject creating a user with a duplicate email", async () => {
    if (!adminToken) return;
    const res = await request(app)
      .post("/api/v1/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(newAdminManagedUser);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should let an admin fetch a single user", async () => {
    if (!adminToken || !createdUserId) return;
    const res = await request(app)
      .get(`/api/v1/admin/users/${createdUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(newAdminManagedUser.email);
  });

  it("should let an admin update a user", async () => {
    if (!adminToken || !createdUserId) return;
    const res = await request(app)
      .patch(`/api/v1/admin/users/${createdUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ fullName: "Updated Name" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe("Updated Name");
  });

  it("should return 404 for a non-existent user", async () => {
    if (!adminToken) return;
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/v1/admin/users/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it("should let an admin delete a user", async () => {
    if (!adminToken || !createdUserId) return;
    const res = await request(app)
      .delete(`/api/v1/admin/users/${createdUserId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    createdUserId = "";
  });
});
