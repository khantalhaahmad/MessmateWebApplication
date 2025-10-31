// routes/testRoutes.js
import express from "express";
import User from "../models/User.js";
import Mess from "../models/Mess.js";
import Order from "../models/Order.js";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

/* ============================================================
   🩺 1️⃣ API HEALTH CHECK
   ============================================================ */
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "✅ MessMate API is up and running smoothly.",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

/* ============================================================
   ☁️ 2️⃣ CLOUDINARY CONNECTIVITY TEST
   ============================================================ */
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }
    console.log("✅ Cloudinary upload success:", req.file.path);
    res.status(200).json({
      success: true,
      message: "Image uploaded successfully to Cloudinary",
      imageUrl: req.file.path,
    });
  } catch (error) {
    console.error("💥 Cloudinary upload failed:", error);
    res.status(500).json({
      success: false,
      message: "Cloudinary upload failed",
      error: error.message,
    });
  }
});

/* ============================================================
   🍃 3️⃣ MONGODB CONNECTION TEST
   ============================================================ */
router.get("/db-check", async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = ["disconnected", "connected", "connecting", "disconnecting"];
    res.status(200).json({
      success: dbState === 1,
      message: `MongoDB is currently ${states[dbState]}.`,
      database: mongoose.connection.name,
      host: mongoose.connection.host,
    });
  } catch (error) {
    console.error("💥 DB Check Error:", error);
    res.status(500).json({ success: false, message: "Failed to check DB connection" });
  }
});

/* ============================================================
   👤 4️⃣ USER PROFILE (Secure)
   ============================================================ */
router.get("/user/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let extraData = {};
    if (user.role === "owner") {
      extraData.messes = await Mess.find({ owner_id: user._id });
    } else if (user.role === "student") {
      extraData.orders = await Order.find({ user_id: user._id });
    }

    res.status(200).json({
      success: true,
      user,
      ...extraData,
    });
  } catch (error) {
    console.error("💥 Fetch User Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
});

export default router;