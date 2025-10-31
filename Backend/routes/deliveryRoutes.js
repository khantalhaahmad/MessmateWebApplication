// ✅ routes/deliveryRoutes.js — Final Production Version
import express from "express";
import DeliveryRequest from "../models/DeliveryRequest.js";
import DeliveryAgent from "../models/DeliveryAgent.js";
import { verifyToken } from "../middleware/auth.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
const verifyAdmin = adminMiddleware;

const router = express.Router();

/* ============================================================
   📨 POST /api/delivery/apply → Submit new delivery request (public)
   ============================================================ */
router.post("/apply", async (req, res) => {
  try {
    const request = new DeliveryRequest({
      ...req.body,
      status: "pending",
      date: new Date().toLocaleDateString("en-GB"), // DD/MM/YYYY
    });

    await request.save();
    res.status(201).json({
      success: true,
      message: "Delivery partner request submitted successfully ✅",
    });
  } catch (error) {
    console.error("❌ Error submitting delivery request:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================================================
   🟢 GET /api/delivery/delivery-requests/pending → Fetch pending requests
   ============================================================ */
router.get("/delivery-requests/pending", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const requests = await DeliveryRequest.find({ status: "pending" }).sort({ createdAt: -1 });
    res.json({ success: true, requests });
  } catch (error) {
    console.error("❌ Error fetching delivery requests:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================================================
   ✅ POST /api/delivery/approve-delivery/:id → Approve a request
   ============================================================ */
router.post("/approve-delivery/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { generatedPassword } = req.body;
    const request = await DeliveryRequest.findById(req.params.id);

    if (!request)
      return res.status(404).json({ success: false, message: "Request not found" });

    const newAgent = new DeliveryAgent({
      name: request.name,
      phone: request.phone,
      email: request.email,
      city: request.city,
      vehicleType: request.vehicleType,
      vehicleNumber: request.vehicleNumber,
      password: generatedPassword || "default@123",
      status: "active",
      approvedAt: new Date(),
    });

    await newAgent.save();
    await DeliveryRequest.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Delivery agent approved successfully ✅",
      agent: newAgent,
    });
  } catch (error) {
    console.error("❌ Error approving delivery request:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ============================================================
   ❌ DELETE /api/delivery/reject-delivery/:id → Reject a request
   ============================================================ */
router.delete("/reject-delivery/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const deleted = await DeliveryRequest.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ success: false, message: "Request not found" });

    res.json({
      success: true,
      message: "Delivery request rejected successfully ❌",
    });
  } catch (error) {
    console.error("❌ Error rejecting delivery request:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
