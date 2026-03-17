// routes/paymentRoutes.js
import Razorpay from "razorpay";
import crypto from "crypto";
import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

/* ============================================================
   ⚙️ RAZORPAY INIT
============================================================ */

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ============================================================
   🧾 CREATE PAYMENT ORDER
============================================================ */

router.post("/create-order", async (req, res) => {
  try {
    const { amount, orderId } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    const options = {
      amount: amount * 100, // paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),

      notes: {
        orderId: orderId || "",
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order,
    });

  } catch (err) {
    console.error("Create payment error:", err);
    res.status(500).json({
      success: false,
      message: "Payment order creation failed",
    });
  }
});

/* ============================================================
   ✅ VERIFY PAYMENT
============================================================ */

router.post("/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    /* ============================================================
       💰 PAYMENT VERIFIED
    ============================================================ */

    if (orderId) {
      const order = await Order.findById(orderId);

      if (order) {
        order.paymentMethod = "Online";
        // future: add paymentStatus if needed
        await order.save();
      }
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
    });

  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  }
});

/* ============================================================
   🚀 OPTIONAL: RAZORPAY WEBHOOK (ADVANCED)
============================================================ */

// future use (recommended for production)
// router.post("/webhook", async (req, res) => {
//   // handle payment success/failure securely from Razorpay
// });

export default router;