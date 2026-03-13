// Backend/server.js — Production Ready (Socket + Firebase + Debug)

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

/* ============================================================
   ENV + DATABASE
============================================================ */

dotenv.config();
connectDB();

const app = express();

/* ============================================================
   UPLOADS FOLDER
============================================================ */

const uploadsPath = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
  console.log("📁 uploads folder created");
}

app.use("/uploads", express.static(uploadsPath));

/* ============================================================
   MIDDLEWARE
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
   RATE LIMIT
============================================================ */

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

/* ============================================================
   CORS (WEB + ANDROID SAFE)
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
    methods: ["GET","POST","PUT","DELETE","PATCH","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization"],
  })
);

app.options("*", cors());

/* ============================================================
   ROUTES
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

console.log("✅ Registering API routes");

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

/* ============================================================
   HEALTH CHECK
============================================================ */

app.get("/", (_req,res)=>{
  res.send("✅ MessMate Backend Running");
});

app.get("/health", (_req,res)=>{

  res.json({
    ok:true,
    db:mongoose.connection.name,
    host:mongoose.connection.host,
    env:process.env.NODE_ENV || "development"
  });

});

/* ============================================================
   SOCKET.IO SERVER
============================================================ */

const httpServer = createServer(app);

const io = new Server(httpServer,{
  cors:{
    origin:true,
    methods:["GET","POST","PATCH"],
    credentials:true
  }
});

app.set("io",io);

/* ============================================================
   SOCKET CONNECTION
============================================================ */

io.on("connection",(socket)=>{

  console.log("🔗 Socket connected:",socket.id);

  socket.emit("connected",{
    socketId:socket.id
  });

  /* -----------------------------
     OWNER ROOM
  ----------------------------- */

  socket.on("join_owner",(ownerId)=>{

    if(!ownerId){
      console.log("⚠️ join_owner missing ownerId");
      return;
    }

    const room = `owner_${ownerId}`;

    socket.join(room);

    socket.ownerRoom = room;

    console.log(`👨‍🍳 Vendor joined room: ${room}`);

  });

  /* -----------------------------
     USER ROOM
  ----------------------------- */

  socket.on("join_user",(userId)=>{

    if(!userId) return;

    const room = `user_${userId}`;

    socket.join(room);

    console.log(`👤 User joined room: ${room}`);

  });

  /* -----------------------------
     DELIVERY ROOM
  ----------------------------- */

  socket.on("join_delivery",(deliveryId)=>{

    if(!deliveryId) return;

    const room = `delivery_${deliveryId}`;

    socket.join(room);

    console.log(`🛵 Delivery joined room: ${room}`);

  });

  socket.on("disconnect",()=>{

    console.log("❌ Socket disconnected:",socket.id);

  });

});

/* ============================================================
   SOCKET TEST API
============================================================ */

app.get("/socket-test",(req,res)=>{

  const io = req.app.get("io");

  io.emit("server_test",{
    message:"Socket working"
  });

  res.json({
    success:true,
    message:"Socket event emitted"
  });

});

/* ============================================================
   DEBUG USERS
============================================================ */

import User from "./models/User.js";

app.get("/debug-users", async (_req,res)=>{

  try{

    const users = await User.find({},{
      email:1,
      name:1,
      role:1
    });

    res.json({
      success:true,
      count:users.length,
      users
    });

  }catch(err){

    res.status(500).json({
      success:false,
      error:err.message
    });

  }

});

/* ============================================================
   ERROR HANDLER
============================================================ */

app.use((req,res)=>{

  console.warn(`⚠️ 404 ${req.method} ${req.originalUrl}`);

  res.status(404).json({
    success:false,
    message:"Route not found"
  });

});

app.use((err,_req,res,_next)=>{

  console.error("💥 Server error:",err);

  res.status(err.status || 500).json({
    success:false,
    message:err.message || "Internal server error"
  });

});

/* ============================================================
   START SERVER
============================================================ */

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT,()=>{

  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 http://localhost:${PORT}`);
  console.log(`🔍 Debug users: /debug-users`);
  console.log(`🔌 Socket test: /socket-test`);

});