// Backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";

dotenv.config();
connectDB();

const app = express();

/* ============================================================
   🧩 Core Middleware
   ============================================================ */
app.set("trust proxy", 1);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(compression());
app.use(helmet({ crossOriginResourcePolicy: false }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 🔎 Request logger
app.use((req, _res, next) => {
  console.log(`➡️ ${req.method} ${req.originalUrl}`);
  next();
});

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
        const u = new URL(origin);
        if (u.hostname.endsWith(".vercel.app")) return cb(null, true);
      } catch {}
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());

/* ============================================================
   🛣️ Routes
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

console.log("✅ messRoutes loaded successfully");

/* ============================================================
   🧠 Health + Root
   ============================================================ */
app.get("/", (_req, res) => res.send("✅ MessMate Backend Root Running"));
app.get("/health", (_req, res) =>
  res.json({ ok: true, env: process.env.NODE_ENV || "development" })
);

/* ============================================================
   ✅ Route Mounting (🚀 FIXED — no /api/api issue)
   ============================================================ */
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// ✅ Corrected spelling here
app.use("/api/messes", messRoutes);
app.use("/api/mess", messRoutes);

app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/owner", ownerStatsRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/mess-request", messRequestRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payment", paymentRoutes);

/* ============================================================
   🧯 404 + Error Handler
   ============================================================ */
app.use((req, res, _next) => {
  console.warn(`⚠️ 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, _req, res, _next) => {
  console.error("💥 Uncaught server error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

/* ============================================================
   ⚡ Start Server
   ============================================================ */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
