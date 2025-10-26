// routes/adminExtraRoutes.js
import express from "express";
import Order from "../models/Order.js";
import Mess from "../models/Mess.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import MessRequest from "../models/MessRequest.js";
import { verifyToken } from "../middleware/auth.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import DeliveryAgent from "../models/DeliveryAgent.js";

const router = express.Router();

// ✅ Centralized error handler helper
const handleError = (res, err, msg) => {
  console.error(`💥 ${msg}:`, err);
  res.status(500).json({ message: msg, error: err.message });
};

/* ============================================================
   🧾 ADMIN OVERVIEW — Enhanced for Dashboard
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
   📊 REVENUE SUMMARY — Last 7 days grouped by date
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

export default router;
