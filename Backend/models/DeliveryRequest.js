// models/DeliveryRequest.js
import mongoose from "mongoose";

const deliveryRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  city: { type: String },
  vehicleType: { type: String },
  vehicleNumber: { type: String },
  status: { type: String, default: "pending" },
  date: { type: String },
});

export default mongoose.model("DeliveryRequest", deliveryRequestSchema);
