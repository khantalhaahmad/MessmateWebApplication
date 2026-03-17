// models/Payout.js
import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema({

  /* ============================================================
     👤 VENDOR INFO
  ============================================================ */

  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  messId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Mess"
  },

  messName: {
    type: String,
    default: ""
  },

  ownerName: {
    type: String,
    default: ""
  },

  ownerEmail: {
    type: String,
    default: ""
  },

  /* ============================================================
     💰 PAYOUT AMOUNT
  ============================================================ */

  amount: {
    type: Number,
    required: true,
    min: 0
  },

  /* ============================================================
     📦 RELATED ORDERS
  ============================================================ */

  orders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    }
  ],

  totalOrders: {
    type: Number,
    default: 0
  },

  totalRevenue: {
    type: Number,
    default: 0
  },

  totalCommission: {
    type: Number,
    default: 0
  },

  /* ============================================================
     ⚙️ PAYOUT TYPE
  ============================================================ */

  payoutMethod: {
    type: String,
    enum: ["auto", "manual"],
    default: "auto"
  },

  /* ============================================================
     📊 STATUS TRACKING
  ============================================================ */

  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending",
    index: true
  },

  /* ============================================================
     📅 SETTLEMENT CYCLE
  ============================================================ */

  settlementCycle: {
    type: String,
    index: true
  },

  /* ============================================================
     🏦 BANK SNAPSHOT (IMPORTANT FOR HISTORY)
  ============================================================ */

  bankDetailsSnapshot: {
    accountNumber: String,
    ifsc: String,
    accountName: String,
    upiId: String
  },

  /* ============================================================
     🕒 TIMESTAMPS
  ============================================================ */

  requestedAt: {
    type: Date,
    default: Date.now
  },

  processedAt: {
    type: Date
  },

  paidAt: {
    type: Date
  },

  /* ============================================================
     🧾 FAILURE / NOTES
  ============================================================ */

  failureReason: {
    type: String,
    default: ""
  }

},
{
  timestamps: true
});

/* ============================================================
   ⚡ INDEXES (PERFORMANCE)
============================================================ */

payoutSchema.index({ vendorId: 1 });
payoutSchema.index({ status: 1 });
payoutSchema.index({ settlementCycle: 1 });

/* ============================================================
   🚀 EXPORT MODEL
============================================================ */

export default mongoose.model("Payout", payoutSchema);