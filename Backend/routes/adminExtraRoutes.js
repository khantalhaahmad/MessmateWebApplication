// routes/adminExtraRoutes.js

import express from "express";
import Order from "../models/Order.js";
import Mess from "../models/Mess.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import MessRequest from "../models/MessRequest.js";
import DeliveryRequest from "../models/DeliveryRequest.js"; // 🔥 ADD
import DeliveryAgent from "../models/DeliveryAgent.js";
import { verifyToken } from "../middleware/auth.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

/* ============================================================
   ✅ ERROR HANDLER
============================================================ */
const handleError = (res, err, msg) => {
  console.error(`💥 ${msg}:`, err);
  res.status(500).json({ success: false, message: msg, error: err.message });
};

/* ============================================================
   🧾 ADMIN OVERVIEW
============================================================ */
router.get("/overview", verifyToken, adminMiddleware, async (req, res) => {
  try {
    const [messes, users, orders] = await Promise.all([
      Mess.countDocuments(),
      User.countDocuments(),
      Order.countDocuments(),
    ]);

    res.json({
      totalMesses: messes,
      totalUsers: users,
      totalOrders: orders,
    });
  } catch (err) {
    handleError(res, err, "Failed to load overview data");
  }
});

/* ============================================================
   📊 REVENUE SUMMARY
============================================================ */
router.get("/revenue-weekly", verifyToken, adminMiddleware, async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const data = await Order.aggregate([
      { $match: { status: "confirmed", createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalRevenue: { $sum: "$total_price" },
          totalOrders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(data);
  } catch (err) {
    handleError(res, err, "Failed to fetch revenue data");
  }
});

/* ============================================================
   📦 DELIVERY REQUESTS (PENDING)
============================================================ */
router.get("/delivery-requests/pending", verifyToken, adminMiddleware, async (req, res) => {
  try {
    const requests = await DeliveryRequest.find({ status: "pending" })
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    handleError(res, err, "Failed to fetch delivery requests");
  }
});

router.post("/delivery-requests/:id/approve", verifyToken, adminMiddleware, async (req, res) => {
  try {
    console.log("🔥 STEP 1: API HIT:", req.params.id);

    const request = await DeliveryRequest.findById(req.params.id);

    console.log("🔥 STEP 2: REQUEST FETCHED");
    console.log("📦 REQUEST OBJECT:", request);

    if (!request) {
      console.log("❌ REQUEST NOT FOUND");
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    console.log("📞 REQUEST PHONE:", request.phone);

    if (!request.phone) {
      console.log("❌ PHONE MISSING IN REQUEST");
      return res.status(400).json({
        success: false,
        message: "Phone missing in request",
      });
    }

    const cleanPhone = request.phone.replace(/\D/g, "").slice(-10);
    console.log("📱 CLEAN PHONE:", cleanPhone);

    const user = await User.findOne({
      phone: { $regex: cleanPhone }
    });

    console.log("👤 FOUND USER:", user);

    if (!user) {
      console.log("❌ USER NOT FOUND");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const existingAgent = await DeliveryAgent.findOne({ userId: user._id });
    console.log("🚴 EXISTING AGENT:", existingAgent);

    if (existingAgent) {
      console.log("⚠️ ALREADY AGENT");
      return res.status(400).json({
        success: false,
        message: "Already a delivery agent",
      });
    }

    const agent = await DeliveryAgent.create({
      userId: user._id,
      name: request.name,
      phone: cleanPhone,
      email: user.email,
      city: request.city,
      vehicleType: request.vehicleType,
      vehicleNumber: request.vehicleNumber,
      isOnline: false,
      isAvailable: true,
    });

    console.log("🚀 AGENT CREATED:", agent);

    user.role = "delivery";
    await user.save();

    request.status = "approved";
    await request.save();

    console.log("✅ APPROVE SUCCESS");

    res.json({
      success: true,
      message: "Approved",
      agent,
    });

  } catch (err) {
    console.error("💥 FULL ERROR:", err);
    console.error("💥 ERROR MESSAGE:", err.message);
    console.error("💥 STACK:", err.stack);

    return res.status(500).json({
      success: false,
      message: err.message || "Approve failed",
    });
  }
});
/* ============================================================
   ❌ REJECT DELIVERY REQUEST
============================================================ */
router.post("/delivery-requests/:id/reject", verifyToken, adminMiddleware, async (req, res) => {
  try {
    console.log("❌ REJECT API HIT:", req.params.id);

    const request = await DeliveryRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false });
    }

    request.status = "rejected";
    await request.save();

    res.json({
      success: true,
      message: "Request rejected",
    });

  } catch (err) {
    handleError(res, err, "Reject delivery failed");
  }
});

export default router;