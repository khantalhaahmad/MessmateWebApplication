// Backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(express.json({ limit: "2mb" }));
app.use(compression());
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://messmatewebapplication.onrender.com",
];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      console.warn("🚫 Blocked by CORS:", origin);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Routes
import authRoutes from "./routes/auth.js";
import messRoutes from "./routes/messRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import orderRoutes from "./routes/OrderRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import ownerStatsRoutes from "./routes/ownerStatsRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import messRequestRoutes from "./routes/messRequestRoutes.js";
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

// Health check
app.get("/api", (_, res) => res.send("✅ MessMate Backend API Running"));

// Serve frontend (prod)
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../Frontend/dist");
  app.use(express.static(frontendPath));
  app.get("*", (_, res) => res.sendFile(path.join(frontendPath, "index.html")));
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
