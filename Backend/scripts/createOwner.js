import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function createOwner() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    const email = "owner1@messmate.in";
    const plainPassword = "Owner@123";

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // delete existing owner with same email (safe reset)
    await User.deleteOne({ email });

    const owner = await User.create({
      name: "Test Owner",
      email,
      password: hashedPassword,
      role: "owner",
      isActive: true,
      isDeleted: false,
      profileComplete: true,
    });

    console.log("✅ Owner created successfully");
    console.log("📧 Email:", email);
    console.log("🔑 Password:", plainPassword);
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to create owner:", err.message);
    process.exit(1);
  }
}

createOwner();