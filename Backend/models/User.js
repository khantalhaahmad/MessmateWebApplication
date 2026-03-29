// models/User.js
import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const userSchema = new mongoose.Schema(
  {
    /* ============================================================
       🔢 AUTO INCREMENT ID
    ============================================================ */
    user_id: { type: Number, unique: true },

    /* ============================================================
       🔐 AUTH (FIREBASE / OTP)
    ============================================================ */
    firebaseUid: { type: String, unique: true, sparse: true },

    /* ============================================================
       👤 BASIC INFO
    ============================================================ */
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
    },

    password: { type: String },

    /* ============================================================
   📍 ADDRESS (🔥 ADD THIS)
============================================================ */

address: {
  type: String,
  default: ""
},

location: {
  lat: { type: Number, default: null },
  lng: { type: Number, default: null }
},

    /* ============================================================
       👤 ROLE SYSTEM
    ============================================================ */
    role: {
      type: String,
      enum: ["student", "owner", "admin", "delivery"],
      default: "student",
      index: true
    },

    /* ============================================================
       🖼 PROFILE
    ============================================================ */
    avatar: { type: String, default: "" },

    /* ============================================================
       🔔 PUSH NOTIFICATIONS
    ============================================================ */
    fcmToken: { type: String, default: "" },

    /* ============================================================
       📱 DEVICE TRACKING
    ============================================================ */
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

    /* ============================================================
       💰 WALLET SYSTEM (NEW)
    ============================================================ */
    walletBalance: {
      type: Number,
      default: 0
    },

    pendingPayout: {
      type: Number,
      default: 0
    },

    totalPayout: {
      type: Number,
      default: 0
    },

    /* ============================================================
       ⚙️ PAYOUT SETTINGS
    ============================================================ */
    payoutMethod: {
      type: String,
      enum: ["auto", "manual"],
      default: "auto"
    },

    /* ============================================================
       🏦 BANK DETAILS
    ============================================================ */
    bankDetails: {
      accountNumber: { type: String, default: "" },
      ifsc: { type: String, default: "" },
      accountName: { type: String, default: "" },
      upiId: { type: String, default: "" }
    },

    /* ============================================================
       🕒 STATUS
    ============================================================ */
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },

    /* ============================================================
       🗑 SOFT DELETE
    ============================================================ */
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

/* ============================================================
   ⚙️ AUTO INCREMENT PLUGIN
============================================================ */

const AutoIncrement = AutoIncrementFactory(mongoose);
userSchema.plugin(AutoIncrement, { inc_field: "user_id" });

/* ============================================================
   ⚙️ INDEXES
============================================================ */

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });
userSchema.index({ firebaseUid: 1 }, { unique: true, sparse: true });

/* ============================================================
   🧠 METHODS
============================================================ */

userSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  await this.save();
};

/* ============================================================
   🧠 MIDDLEWARE
============================================================ */

userSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});

/* ============================================================
   🚀 EXPORT MODEL
============================================================ */

const User =
  mongoose.models.User ||
  mongoose.model("User", userSchema, "users");

export default User;