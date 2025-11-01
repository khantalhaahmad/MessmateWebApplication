import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema({
  messId: { type: mongoose.Schema.Types.ObjectId, ref: "Mess" },
  messName: String,
  ownerName: String,
  ownerEmail: String,
  totalOrders: Number,
  totalRevenue: Number,
  commission: Number,
  payable: Number,
  payoutStatus: { type: String, default: "Pending" },
  settlementCycle: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Payout", payoutSchema);
