// ✅ Backend/models/User.js — FINAL FIXED VERSION
import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const userSchema = new mongoose.Schema(
  {
    // 🔢 Auto-increment user ID (for easy lookup)
    user_id: { type: Number, unique: true },

    // 🔹 Firebase UID (for OTP/Google Sign-In)
    firebaseUid: { type: String, unique: true, sparse: true },

    // 🧑 Basic Info
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: false, unique: true, sparse: true },
    password: { type: String },

    // 👤 Role System (for dashboards)
    role: {
      type: String,
      enum: ["student", "owner", "admin", "delivery"],
      default: "student",
    },

    // 🖼 Profile Picture
    avatar: { type: String, default: "" },

    // 🔔 Firebase Cloud Messaging Token (Push Notifications)
    fcmToken: { type: String, default: "" },

    // 🌐 Device Info
    devices: [
      {
        deviceId: { type: String },
        deviceType: {
          type: String,
          enum: ["web", "android", "ios", "unknown"],
          default: "web",
        },
        lastLogin: { type: Date, default: Date.now },
      },
    ],

    // 🕒 Login + Status Tracking
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },

    // 🗑 Soft Delete Flag
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: "users", // ✅ FORCE correct MongoDB collection name
  }
);

/* ============================================================
   ⚙️ Auto-Increment Plugin
   ============================================================ */
const AutoIncrement = AutoIncrementFactory(mongoose);
userSchema.plugin(AutoIncrement, { inc_field: "user_id" });

/* ============================================================
   ⚙️ Indexes (avoid duplicate conflicts with nulls)
   ============================================================ */
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });
userSchema.index({ firebaseUid: 1 }, { unique: true, sparse: true });

/* ============================================================
   🧠 Middleware Hooks
   ============================================================ */
userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  await this.save();
};

userSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});


/* ============================================================
   🧠 Export Model (Force exact collection name)
   ============================================================ */
const User = mongoose.models.User || mongoose.model("User", userSchema, "users");
export default User;

