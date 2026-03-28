import express from "express";
import DeliveryRequest from "../models/DeliveryRequest.js";
import DeliveryAgent from "../models/DeliveryAgent.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();

/* ============================================================
   🔐 VERIFY DELIVERY ROLE (NEW - CLEAN)
============================================================ */

const verifyDelivery = async (req, res, next) => {
  try {
    // req.user comes from JWT (authMiddleware)
    if (!req.user || req.user.role !== "delivery") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Delivery only",
      });
    }

    // 🔥 Find delivery profile (optional but needed)
    const agent = await DeliveryAgent.findOne({ phone: req.user.phone });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Delivery profile not found",
      });
    }

    req.agent = agent;
    next();
  } catch (err) {
    console.error("❌ verifyDelivery error:", err);
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

/* ============================================================
   ❌ REMOVE OLD LOGIN (IMPORTANT)
============================================================ */
// NO /delivery/login anymore
// login handled by /auth/firebase-login

/* ============================================================
   🟢 GO ONLINE
============================================================ */

router.post("/go-online", verifyToken, verifyDelivery, async (req, res) => {
  const agent = req.agent;

  agent.isOnline = true;
  agent.isAvailable = true;

  await agent.save();

  res.json({ success: true });
});

/* ============================================================
   🔴 GO OFFLINE
============================================================ */

router.post("/go-offline", verifyToken, verifyDelivery, async (req, res) => {
  const agent = req.agent;

  agent.isOnline = false;
  agent.isAvailable = false;

  await agent.save();

  res.json({ success: true });
});

/* ============================================================
   📦 AVAILABLE ORDERS
============================================================ */

router.get("/available-orders", verifyToken, verifyDelivery, async (req, res) => {
  const orders = await Order.find({
    status: "ready",
    deliveryStatus: "NOT_ASSIGNED",
  }).sort({ createdAt: -1 });

  res.json({ success: true, data: orders });
});

/* ============================================================
   ✅ ACCEPT ORDER
============================================================ */

router.post("/accept-order", verifyToken, verifyDelivery, async (req, res) => {
  const { orderId } = req.body;
  const agent = req.agent;

  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({ success: false });
  }

  if (order.deliveryStatus !== "NOT_ASSIGNED") {
    return res.status(400).json({
      success: false,
      message: "Already assigned",
    });
  }

  order.deliveryAgent = agent._id;
  order.deliveryStatus = "ACCEPTED";

  agent.isAvailable = false;
  agent.currentOrderId = order._id;

  await order.save();
  await agent.save();

  res.json({ success: true, order });
});

/* ============================================================
   🚚 UPDATE STATUS
============================================================ */

router.post("/update-status", verifyToken, verifyDelivery, async (req, res) => {
  const { orderId, status } = req.body;
  const agent = req.agent;

  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({ success: false });
  }

  order.deliveryStatus = status;

  if (status === "REACHED_RESTAURANT") {
    order.acceptedAt = new Date();
  }

  if (status === "PICKED_UP") {
    order.status = "picked";
    order.pickedAt = new Date();
  }

  if (status === "DELIVERED") {
    order.status = "delivered";
    order.deliveredAt = new Date();

    agent.isAvailable = true;
    agent.currentOrderId = null;
    agent.totalEarnings += order.deliveryFee || 40;
  }

  await order.save();
  await agent.save();

  res.json({ success: true, order });
});

/* ============================================================
   💰 EARNINGS
============================================================ */

router.get("/earnings", verifyToken, verifyDelivery, async (req, res) => {
  const agent = req.agent;

  res.json({
    success: true,
    totalEarnings: agent.totalEarnings || 0,
  });
});

export default router;