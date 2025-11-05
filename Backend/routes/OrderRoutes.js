// ✅ Backend/routes/OrderRoutes.js — FINAL UNIVERSAL VERSION
import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Mess from "../models/Mess.js";
import User from "../models/User.js";
import admin from "../config/firebaseAdmin.js";
import verifyToken from "../middleware/verifyToken.js"; // ✅ FIXED IMPORT

const router = express.Router();

/* ============================================================
   ✅ POST /orders → Place an order (Online + COD)
   ============================================================ */
router.post("/", verifyToken, async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;
    const backendId = req.user?.id;
    const { mess_id, mess_name, items, paymentMethod, total_price, status } = req.body;

    console.log("📦 Incoming Order Request:", {
      firebaseUid,
      backendId,
      mess_id,
      mess_name,
      paymentMethod,
    });

    // ✅ Step 1 — Resolve actual DB user
    const dbUser = await User.findOne({
      $or: [{ _id: backendId }, { firebaseUid }],
    });

    if (!dbUser)
      return res.status(401).json({ message: "Unauthorized: user not found in DB" });

    // ✅ Step 2 — Validate items
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "No food items provided." });

    // ✅ Step 3 — Compute total
    const finalTotal =
      total_price ||
      items.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
        0
      );

    // ✅ Step 4 — Find Mess
    let mess = null;
    if (mess_id && mongoose.Types.ObjectId.isValid(mess_id)) {
      mess = await Mess.findById(mess_id);
    }
    if (!mess && mess_id && !isNaN(Number(mess_id))) {
      mess = await Mess.findOne({ mess_id: Number(mess_id) });
    }
    if (!mess && mess_name && mess_name !== "Unknown Mess") {
      mess = await Mess.findOne({ name: mess_name });
    }

    if (!mess) {
      console.warn(
        "⚠️ Mess lookup failed, saving with fallback mess_name:",
        mess_name
      );
    }

    // ✅ Step 5 — Normalize items
    const updatedItems = items.map((item) => ({
      ...item,
      type: item.type || "veg",
      category: item.category || "other",
      image: item.image || "default.png",
    }));

    // ✅ Step 6 — Payment & status
    const paymentMode = paymentMethod || "Online";
    const orderStatus =
      paymentMode === "COD" ? "Pending (COD)" : status || "confirmed";

    // ✅ Step 7 — Create order linked to correct user
    const newOrder = await Order.create({
      user_id: dbUser._id,
      mess_id:
        mess?._id?.toString() || (mess_id && String(mess_id)) || "N/A",
      mess_name: mess?.name || mess_name || "Unknown Mess",
      items: updatedItems,
      total_price: finalTotal,
      paymentMethod: paymentMode,
      status: orderStatus,
    });

    console.log("✅ Order Saved Successfully:", {
      orderId: newOrder._id,
      mess_name: newOrder.mess_name,
      user_id: dbUser._id,
    });

    /* ============================================================
       🔔 Step 8 — Notify MessOwner (Socket.io + FCM fallback)
       ============================================================ */
    try {
      const io = req.app.get("io");
      const ownerId = mess?.owner_id?.toString();

      if (io && ownerId) {
        io.to(`owner_${ownerId}`).emit("new_order", newOrder);
        console.log(`📡 Sent live new_order event to owner_${ownerId}`);
      }

      const owner = await User.findById(ownerId);
      if (owner?.fcmToken) {
        await admin.messaging().send({
          token: owner.fcmToken,
          notification: {
            title: "🍱 New Order Received!",
            body: `${newOrder.items.length} items worth ₹${newOrder.total_price}`,
          },
          data: {
            orderId: newOrder._id.toString(),
            messName: newOrder.mess_name,
          },
        });
        console.log("📨 FCM push sent to owner:", owner.name);
      }
    } catch (notifyErr) {
      console.warn("⚠️ Notification failed:", notifyErr.message);
    }

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
   🟢 PUT /orders/:id/status → Owner updates order status
   ============================================================ */
router.put("/:id/status", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Status is required" });

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!updatedOrder)
      return res.status(404).json({ message: "Order not found" });

    // 🔔 Notify user
    const io = req.app.get("io");
    if (io && updatedOrder.user_id) {
      io.to(`user_${updatedOrder.user_id}`).emit("order_status", updatedOrder);
      console.log(`📡 Sent order_status update to user_${updatedOrder.user_id}`);
    }

    // 🔔 FCM fallback
    const user = await User.findById(updatedOrder.user_id);
    if (user?.fcmToken) {
      await admin.messaging().send({
        token: user.fcmToken,
        notification: {
          title: "🍽️ Order Update",
          body: `Your order is now ${status}`,
        },
        data: { orderId: updatedOrder._id.toString() },
      });
      console.log("📨 FCM push sent to user:", user.name);
    }

    res.json({ success: true, order: updatedOrder });
  } catch (err) {
    console.error("💥 Status update error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ============================================================
   🧩 GET /orders/my-orders → User order history (Firebase + JWT Safe)
   ============================================================ */
router.get("/my-orders", verifyToken, async (req, res) => {
  try {
    const firebaseUid = req.user?.uid;
    const backendId = req.user?.id;

    const dbUser = await User.findOne({
      $or: [{ _id: backendId }, { firebaseUid }],
    });

    if (!dbUser) {
      console.warn("⚠️ No user found for token");
      return res.status(404).json({ message: "User not found" });
    }

    const orders = await Order.find({ user_id: dbUser._id }).sort({
      createdAt: -1,
    });

    console.log(`✅ Found ${orders.length} orders for user ${dbUser._id}`);

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (err) {
    console.error("💥 Error fetching orders:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: err.message,
    });
  }
});

/* ============================================================
   🧩 GET /orders/owner/:ownerId → All orders for owner
   ============================================================ */
router.get("/owner/:ownerId", verifyToken, async (req, res) => {
  try {
    const ownerId = req.params.ownerId;
    const messes = await Mess.find({ owner_id: ownerId });
    const messObjectIds = messes.map((m) => m._id.toString());
    const messNumericIds = messes.map((m) => String(m.mess_id));

    const orders = await Order.find({
      $or: [
        { mess_id: { $in: messObjectIds } },
        { mess_id: { $in: messNumericIds } },
      ],
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error("💥 Error fetching owner orders:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching owner orders",
      error: err.message,
    });
  }
});

export default router;
