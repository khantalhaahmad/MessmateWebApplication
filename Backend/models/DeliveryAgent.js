// models/DeliveryAgent.js
import mongoose from "mongoose";

const deliveryAgentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    city: { type: String },
    vehicleType: { type: String },
    vehicleNumber: { type: String },
    password: { type: String, required: true },
    status: { type: String, default: "active" },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("DeliveryAgent", deliveryAgentSchema);
