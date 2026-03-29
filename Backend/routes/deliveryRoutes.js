import express from "express";
import DeliveryAgent from "../models/DeliveryAgent.js";
import Order from "../models/Order.js";
import verifyToken from "../middleware/authMiddleware.js";
import { verifyDeliveryAgent } from "../middleware/verifyDeliveryAgent.js";

const router = express.Router();


/* ============================================================
   📝 APPLY FOR DELIVERY (FIXED 🔥)
============================================================ */
router.post("/apply", verifyToken, async (req, res) => {
  try {
    const { name, vehicleType, vehicleNumber, city } = req.body;

    // 🔥 ALWAYS USE LOGIN PHONE (VERY IMPORTANT)
    const phone = req.user.phone;

    // 🔍 Validate required fields
    if (!name || !vehicleType) {
      return res.status(400).json({
        success: false,
        message: "Name and vehicle type are required",
      });
    }

    // 🔥 Check if already applied
    const existingRequest = await DeliveryRequest.findOne({ phone });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "You have already applied",
      });
    }

    // 🔥 Check if already a delivery agent
    const existingAgent = await DeliveryAgent.findOne({ phone });

    if (existingAgent) {
      return res.status(400).json({
        success: false,
        message: "Already a delivery agent",
      });
    }

    // ✅ Create request
    const request = await DeliveryRequest.create({
      name,
      phone, // ✅ LOGIN PHONE
      vehicleType,
      vehicleNumber,
      city,
      status: "pending",
      date: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Application submitted successfully",
      request,
    });

  } catch (err) {
    console.error("Apply delivery error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/* ============================================================
   🟢 GO ONLINE
============================================================ */
router.post("/go-online", verifyToken, verifyDeliveryAgent, async (req, res) => {
  try {
    const agent = req.agent;

    agent.isOnline = true;
    agent.isAvailable = true;

    await agent.save();

    res.json({ success: true, message: "Agent is online" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* ============================================================
   🔴 GO OFFLINE
============================================================ */
router.post("/go-offline", verifyToken, verifyDeliveryAgent, async (req, res) => {
  try {
    const agent = req.agent;

    agent.isOnline = false;
    agent.isAvailable = false;

    await agent.save();

    res.json({ success: true, message: "Agent is offline" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* ============================================================
   📦 AVAILABLE ORDERS (DASHBOARD SUPPORT)
============================================================ */
router.get("/available-orders", verifyToken, verifyDeliveryAgent, async (req, res) => {
  try {
    const agent = req.agent;

    const orders = await Order.find({
      $or: [
        { deliveryStatus: "NOT_ASSIGNED" },
        { deliveryAgent: agent._id }
      ]
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: orders });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* ============================================================
   ✅ ACCEPT ORDER (🔥 LOCK SYSTEM)
============================================================ */
router.post("/accept-order", verifyToken, verifyDeliveryAgent, async (req, res) => {
  try {
    const { orderId } = req.body;
    const agent = req.agent;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // 🔥 LOCK CHECK (race condition safe)
    if (order.deliveryStatus !== "NOT_ASSIGNED") {
      return res.status(400).json({
        success: false,
        message: "Order already taken",
      });
    }

    // 🔥 ASSIGN ORDER
    order.deliveryAgent = agent._id;
    order.deliveryStatus = "ACCEPTED";

    agent.isAvailable = false;
    agent.currentOrderId = order._id;

    await order.save();
    await agent.save();

    // 🔥 NOTIFY ALL AGENTS → REMOVE POPUP
    const io = req.app.get("io");

    io.emit("ORDER_TAKEN", {
      orderId: order._id,
      agentId: agent._id,
    });

    console.log("✅ Order accepted by:", agent._id);

    res.json({ success: true, order });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* ============================================================
   🚚 UPDATE DELIVERY STATUS
============================================================ */
router.post("/update-status", verifyToken, verifyDeliveryAgent, async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const agent = req.agent;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false });
    }

    // 🔥 UPDATE DELIVERY STATUS
    order.deliveryStatus = status;

    if (status === "REACHED_RESTAURANT") {
      order.acceptedAt = new Date();
    }

    if (status === "PICKED_UP") {
      order.status = "picked";
      order.pickedAt = new Date();
    }

    if (status === "OUT_FOR_DELIVERY") {
      // optional future logic
    }

    if (status === "DELIVERED") {
      order.status = "delivered";
      order.deliveredAt = new Date();

      // 🔥 RESET AGENT
      agent.isAvailable = true;
      agent.currentOrderId = null;

      // 💰 ADD EARNINGS
      agent.totalEarnings += order.deliveryFee || 40;
    }

    await order.save();
    await agent.save();

    res.json({ success: true, order });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* ============================================================
   💰 EARNINGS
============================================================ */
router.get("/earnings", verifyToken, verifyDeliveryAgent, async (req, res) => {
  try {
    const agent = req.agent;

    res.json({
      success: true,
      totalEarnings: agent.totalEarnings || 0,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

export default router;