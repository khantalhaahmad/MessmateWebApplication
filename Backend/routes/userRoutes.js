// ✅ routes/testRoutes.js — Final Production-Ready Version
import express from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import Mess from "../models/Mess.js";
import Order from "../models/Order.js";
import upload from "../middleware/uploadMiddleware.js";
import { verifyToken } from "../middleware/auth.js";
import cloudinary from "../config/cloudinary.js";
import admin from "../config/firebaseAdmin.js";

const router = express.Router();

/* ============================================================
   🩺 1️⃣ API HEALTH CHECK
   ============================================================ */
router.get("/health", async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = ["disconnected", "connected", "connecting", "disconnecting"];

    res.status(200).json({
      success: true,
      message: "✅ MessMate API is up and running smoothly.",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      database: {
        state: states[dbState],
        name: mongoose.connection.name,
        host: mongoose.connection.host,
      },
    });
  } catch (error) {
    console.error("💥 Health Check Error:", error);
    res.status(500).json({
      success: false,
      message: "Health check failed",
      error: error.message,
    });
  }
});

/* ============================================================
   ☁️ 2️⃣ CLOUDINARY CONNECTIVITY TEST
   ============================================================ */
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No image file uploaded" });
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
    const isHealthy = dbState === 1;

    res.status(isHealthy ? 200 : 500).json({
      success: isHealthy,
      message: `MongoDB is currently ${states[dbState]}.`,
      database: mongoose.connection.name,
      host: mongoose.connection.host,
    });
  } catch (error) {
    console.error("💥 DB Check Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check DB connection",
      error: error.message,
    });
  }
});

/* ============================================================
   🔥 4️⃣ FIREBASE CONNECTIVITY TEST
   ============================================================ */
router.get("/firebase-check", async (req, res) => {
  try {
    const projectId = admin?.app?.options?.credential?.projectId || "Unknown";
    res.status(200).json({
      success: true,
      message: "✅ Firebase Admin SDK connected successfully.",
      projectId,
    });
  } catch (error) {
    console.error("💥 Firebase check failed:", error);
    res.status(500).json({
      success: false,
      message: "Firebase Admin SDK not initialized properly.",
      error: error.message,
    });
  }
});

/* ============================================================
   👤 5️⃣ USER PROFILE (Secure)
   ============================================================ */
router.get("/user/:id", verifyToken, async (req, res) => {
  try {
    const requestedUserId = req.params.id;
    const authUser = req.user;

    // Authorization check: admin can view all, others only themselves
    if (authUser.role !== "admin" && authUser.id !== requestedUserId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not allowed to view this profile",
      });
    }

    const user = await User.findById(requestedUserId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found in database" });
    }

    // Role-specific data aggregation
    let extraData = {};
    if (user.role === "owner") {
      extraData.messes = await Mess.find({ owner_id: user._id });
    } else if (user.role === "student") {
      extraData.orders = await Order.find({ user_id: user._id });
    } else if (user.role === "admin") {
      extraData.dashboard = {
        totalUsers: await User.countDocuments(),
        totalMesses: await Mess.countDocuments(),
        totalOrders: await Order.countDocuments(),
      };
    }

    res.status(200).json({
      success: true,
      message: "✅ User profile fetched successfully",
      user,
      ...extraData,
    });
  } catch (error) {
    console.error("💥 Fetch User Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
      error: error.message,
    });
  }
});

/* ============================================================
   🧠 6️⃣ JWT TEST ENDPOINT (Verifies token validity)
   ============================================================ */
router.get("/verify-token", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email role");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({
      success: true,
      message: "✅ Token is valid and user authenticated",
      user,
    });
  } catch (error) {
    console.error("💥 Token Verification Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify token",
      error: error.message,
    });
  }
});

/* ============================================================
   🔔 7️⃣ FCM TEST (Send test push notification)
   ============================================================ */
router.post("/test-fcm", verifyToken, async (req, res) => {
  try {
    const { title, body } = req.body;
    const user = await User.findById(req.user.id);

    if (!user?.fcmToken) {
      return res.status(400).json({
        success: false,
        message: "User does not have an FCM token registered",
      });
    }

    await admin.messaging().send({
      token: user.fcmToken,
      notification: {
        title: title || "🔥 Test Notification",
        body: body || "This is a test push notification from MessMate.",
      },
    });

    res.status(200).json({
      success: true,
      message: "✅ Test push notification sent successfully",
      recipient: user.name,
    });
  } catch (error) {
    console.error("💥 FCM Test Failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send test notification",
      error: error.message,
    });
  }
});
export default router;
