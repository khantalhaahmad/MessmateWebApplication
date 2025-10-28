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

// ============================================================
// 🧩 Middleware
// ============================================================
app.use(express.json({ limit: "2mb" }));
app.use(compression());
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));

// ============================================================
// 🌐 CORS (Allow Vercel Frontend)
// ============================================================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://messmate-web-application-oplclrryx-talha-ahmed-khans-projects.vercel.app", // ✅ Your Vercel Deployment URL
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// ============================================================
// 🛣️ Routes
// ============================================================
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

app.use("/api/auth", authRoutes);
app.use("/api/messes", messRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/owner", ownerStatsRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/mess-request", messRequestRoutes);
app.use("/api/users", userRoutes);

// ============================================================
// 💓 Health Check
// ============================================================
app.get("/api", (_, res) => res.send("✅ MessMate Backend API Running"));

// ============================================================
// ❌ Removed Frontend Serving (Because using Vercel)
// ============================================================
// Do NOT include express.static + res.sendFile here.

// ============================================================
// ⚡ Start Server
// ============================================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
