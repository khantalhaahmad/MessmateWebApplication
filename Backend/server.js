// server.js — Market-Launch Ready Version
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

dotenv.config();
connectDB();

const app = express();

// ============================================================
// 📁 PATH SETUP
// ============================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ============================================================
// 🛡️ SECURITY & PERFORMANCE
// ============================================================
app.use(helmet());
app.use(compression());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 250,
    message: "⏳ Too many requests, try again later.",
  })
);

// ============================================================
// 🌐 FINAL CORS CONFIGURATION (LOCAL + PRODUCTION)
// ============================================================
const allowedOrigins = [
  "http://localhost:5173", // Local dev
  "http://localhost:5174",
  "https://messmate-web-application.vercel.app", // ✅ Your live frontend
  process.env.FRONTEND_URL, // Optional environment variable
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman or curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ Blocked by CORS:", origin);
        callback(new Error("❌ Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(uploadsDir));

// ============================================================
// 🪵 REQUEST LOGGER
// ============================================================
app.use((req, res, next) => {
  console.log(`➡️ [${req.method}] ${req.originalUrl}`);
  next();
});

// ============================================================
// 🚏 ROUTES
// ============================================================
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/userRoutes.js";
import messRoutes from "./routes/messRoutes.js";
import orderRoutes from "./routes/OrderRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import messRequestRoutes from "./routes/messRequestRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import ownerStatsRoutes from "./routes/ownerStatsRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminExtraRoutes from "./routes/adminExtraRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messes", messRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/mess-request", messRequestRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/owner", ownerStatsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin-extra", adminExtraRoutes);
app.use("/api/delivery", deliveryRoutes);

// ============================================================
// 🩺 HEALTH CHECK
// ============================================================
app.get("/", (req, res) => {
  res.send("✅ MessMate backend live and healthy!");
});

// ============================================================
// 🧠 GLOBAL ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
  console.error("💥 Server Error:", err.message);
  if (err.message.includes("CORS")) {
    return res.status(403).json({ message: "CORS policy blocked request." });
  }
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ============================================================
// 🚀 START SERVER
// ============================================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Mode: ${process.env.NODE_ENV || "development"}`);
});
