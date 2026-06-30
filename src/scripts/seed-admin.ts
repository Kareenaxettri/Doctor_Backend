import bcryptjs from "bcryptjs";
import { connectToMongoDB } from "../database/mongodb";
import { UserModel } from "../models/user.model";

async function seedAdmin() {
  await connectToMongoDB();

  const email = process.env.ADMIN_EMAIL || "admin@doctor.com";
  const password = process.env.ADMIN_PASSWORD || "Admin@123";

  const existing = await UserModel.findOne({ email });
  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    process.exit(0);
  }

  const hashedPassword = await bcryptjs.hash(password, 10);

  await UserModel.create({
    fullName: "Super Admin",
    email,
    contactNumber: "9800000000",
    gender: "other",
    password: hashedPassword,
    role: "admin",
  });

  console.log(`Admin user created: ${email} / ${password}`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
