// ✅ Backend/server.js — Socket.io + Firebase + Debug Ready

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import { createServer } from "http";
import { Server } from "socket.io";
import admin from "./config/firebaseAdmin.js";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

/* ============================================================
   🧩 Load Environment + Connect DB
============================================================ */
dotenv.config();
connectDB();

const app = express();

/* ============================================================
   📂 Ensure uploads folder exists
============================================================ */

const uploadsPath = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
  console.log("📁 uploads folder created");
}

/* serve uploaded images */

app.use("/uploads", express.static(uploadsPath));
console.log("🖼 Uploads served at /uploads");

/* ============================================================
   🧩 Core Middleware
============================================================ */

app.set("trust proxy", 1);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

app.use(compression());

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

/* ============================================================
   🚦 Rate Limiter
============================================================ */

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

/* ============================================================
   🌐 CORS Configuration
============================================================ */

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:3000",
  "https://messmate-web-application-vrdk.vercel.app",
]);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);

      if (allowedOrigins.has(origin)) return cb(null, true);

      try {
        const url = new URL(origin);
        if (url.hostname.endsWith(".vercel.app")) {
          return cb(null, true);
        }
      } catch (err) {
        console.warn("⚠️ Invalid origin:", origin);
      }

      return cb(new Error("Not allowed by CORS"));
    },

    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

/* ============================================================
   🛣️ Import Routes
============================================================ */

import authRoutes from "./routes/auth.js";
import messRoutes from "./routes/messRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import orderRoutes from "./routes/OrderRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import ownerStatsRoutes from "./routes/ownerStatsRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import messRequestRoutes from "./routes/messRequestsRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

/* ============================================================
   🧠 Health + Root
============================================================ */

app.get("/", (_req, res) => {
  res.send("✅ MessMate Backend Root Running");
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    db: mongoose.connection.name,
    host: mongoose.connection.host,
    env: process.env.NODE_ENV || "development",
  });
});

/* ============================================================
   ✅ API Routes
============================================================ */

console.log("✅ Registering all API routes...");

app.use("/api/auth", authRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/messes", messRoutes);
app.use("/api/mess", messRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/reviews", reviewRoutes);

app.use("/api/recommendations", recommendationRoutes);

app.use("/api/owner", ownerStatsRoutes);

app.use("/api/delivery", deliveryRoutes);

app.use("/api/menu", menuRoutes);

app.use("/api/admin/mess-request", messRequestRoutes);
app.use("/api/mess-request", messRequestRoutes);

app.use("/api/users", userRoutes);

app.use("/api/payment", paymentRoutes);

console.log("✅ All routes mounted successfully");
console.log("✅ Auth routes mounted at /api/auth");

/* ============================================================
   🧪 DEBUG: Verify Users Collection
============================================================ */

import User from "./models/User.js";

app.get("/debug-users", async (_req, res) => {
  try {
    const users = await User.find({}, { email: 1, name: 1, role: 1 });

    res.json({
      success: true,
      count: users.length,
      db: mongoose.connection.name,
      users,
    });

  } catch (err) {

    console.error("❌ Debug Error:", err);

    res.status(500).json({
      success: false,
      message: "Debug route failed",
      error: err.message,
    });
  }
});

/* ============================================================
   ⚡ Socket.io Setup
============================================================ */

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [...allowedOrigins],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {

  console.log("🔗 Socket connected:", socket.id);

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`✅ Joined room: ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });

});

/* ============================================================
   🧯 404 + Error Handler
============================================================ */

app.use((req, res) => {

  console.warn(`⚠️ 404 Not Found: ${req.method} ${req.originalUrl}`);

  res.status(404).json({
    success: false,
    message: "Route not found",
  });

});

app.use((err, _req, res, _next) => {

  console.error("💥 Server error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });

});

/* ============================================================
   ⚡ Start Server
============================================================ */

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {

  console.log(`🚀 MessMate Backend running on port ${PORT}`);
  console.log(`🌍 Login endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log(`🔍 Debug users: http://localhost:${PORT}/debug-users`);
  console.log(`🖼 Image path: http://localhost:${PORT}/uploads/...`);

});