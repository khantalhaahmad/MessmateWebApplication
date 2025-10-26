// models/DeliveryAgent.js
import mongoose from "mongoose";

const deliveryAgentSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  city: String,
  vehicleType: String,
  vehicleNumber: String,
  password: String, // generated manually by admin
  status: { type: String, default: "available" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("DeliveryAgent", deliveryAgentSchema);
