// ✅ routes/OrderRoutes.js — FINAL BUG-FREE VERSION
import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Mess from "../models/Mess.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* ============================================================
   ✅ POST /orders → Place an order (Supports Online & COD)
   ============================================================ */
router.post("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { mess_id, mess_name, items, paymentMethod, total_price, status } = req.body;

    console.log("📦 Incoming Order Request:", { userId, mess_id, mess_name, paymentMethod });

    // Step 1 — Validate user
    if (!userId) return res.status(401).json({ message: "Unauthorized: user not logged in" });

    // Step 2 — Validate items
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "No food items provided." });

    // Step 3 — Compute total safely
    const finalTotal =
      total_price ||
      items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

    // Step 4 — Smart Mess Lookup (handles both numeric mess_id & ObjectId)
    let mess = null;

    // ✅ Try MongoDB _id
    if (mess_id && mongoose.Types.ObjectId.isValid(mess_id)) {
      mess = await Mess.findById(mess_id);
    }

    // ✅ Try numeric mess_id
    if (!mess && mess_id && !isNaN(Number(mess_id))) {
      mess = await Mess.findOne({ mess_id: Number(mess_id) });
    }

    // ✅ Try by mess_name if still missing
    if (!mess && mess_name && mess_name !== "Unknown Mess") {
      mess = await Mess.findOne({ name: mess_name });
    }

    if (!mess) {
      console.warn("⚠️ Mess lookup failed → Fallback to unknown", {
        received_id: mess_id,
        received_name: mess_name,
      });
    }

    // Step 5 — Prepare items
    const updatedItems = items.map((item) => ({
      ...item,
      type: item.type || "veg",
      category: item.category || "other",
      image: item.image || "default.png",
    }));

    // Step 6 — Order status
    const paymentMode = paymentMethod || "Online";
    const orderStatus = paymentMode === "COD" ? "Pending (COD)" : status || "confirmed";

    // Step 7 — Create order
    const newOrder = await Order.create({
      user_id: userId,
      mess_id: mess?._id?.toString() || (mess_id && String(mess_id)) || "N/A",
      mess_name: mess?.name || mess_name || "Unknown Mess",
      items: updatedItems,
      total_price: finalTotal,
      paymentMethod: paymentMode,
      status: orderStatus,
    });

    console.log("✅ Order Saved Successfully:", {
      orderId: newOrder._id,
      mess_name: newOrder.mess_name,
      mess_id: newOrder.mess_id,
    });

    // Step 8 — Response
    res.status(201).json({
      success: true,
      message:
        paymentMode === "COD"
          ? "COD order placed successfully!"
          : "Online order placed successfully!",
      order: newOrder,
    });
  } catch (err) {
    console.error("💥 Order placement error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to place order",
      error: err.message,
    });
  }
});

/* ============================================================
   🟢 GET /orders/my-orders
   ============================================================ */
router.get("/my-orders", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ message: "Unauthorized: No user ID found in token" });

    const orders = await Order.find({ user_id: userId }).sort({ createdAt: -1 });
    console.log(`✅ Found ${orders.length} orders for user ${userId}`);
    res.status(200).json(orders);
  } catch (err) {
    console.error("💥 Error fetching orders:", err);
    res.status(500).json({ message: "Error fetching orders", error: err.message });
  }
});

/* ============================================================
   🧩 GET /orders/owner/:ownerId
   ============================================================ */
router.get("/owner/:ownerId", verifyToken, async (req, res) => {
  try {
    const ownerId = req.params.ownerId;
    const messes = await Mess.find({ owner_id: ownerId });
    const messObjectIds = messes.map((m) => m._id.toString());
    const messNumericIds = messes.map((m) => String(m.mess_id));

    const orders = await Order.find({
      $or: [{ mess_id: { $in: messObjectIds } }, { mess_id: { $in: messNumericIds } }],
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error("💥 Error fetching owner orders:", err);
    res.status(500).json({ success: false, message: "Error fetching owner orders" });
  }
});

export default router;
