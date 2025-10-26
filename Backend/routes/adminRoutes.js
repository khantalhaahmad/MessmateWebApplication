import express from "express";
import authMiddleware from "../middleware/authMiddleware.js"; // ✅ Correct path (authMiddleware is inside routes)
import adminMiddleware from "../middleware/adminMiddleware.js"; // ✅ Correct path (adminMiddleware is inside middleware)
import Order from "../models/Order.js";
import Mess from "../models/Mess.js";
import User from "../models/User.js";

const router = express.Router();

/* ============================================================
   📊 1. DAILY SUMMARY (Orders + Revenue + Users + Messes)
   ============================================================ */
router.get("/daily-summary", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Start and end of today
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    // Fetch confirmed orders for today
    const todayOrders = await Order.find({
      status: "confirmed",
      createdAt: { $gte: start, $lt: end },
    });

    // Calculate totals
    const totalOrders = todayOrders.length;
    const totalRevenue = todayOrders.reduce((sum, o) => sum + o.total_price, 0);

    // Count entities
    const totalMesses = await Mess.countDocuments();
    const totalOwners = await User.countDocuments({ role: "owner" });
    const totalStudents = await User.countDocuments({ role: "student" });

    res.status(200).json({
      totalOrders,
      totalRevenue,
      totalMesses,
      totalOwners,
      totalStudents,
    });
  } catch (error) {
    console.error("💥 Error in /daily-summary:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

/* ============================================================
   💰 2. MESS-WISE EARNINGS (Daily)
   ============================================================ */
router.get("/mess-earnings", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    // Aggregate total orders and earnings for each mess
    const earnings = await Order.aggregate([
      {
        $match: {
          status: "confirmed",
          createdAt: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: "$mess_id",
          mess_name: { $first: "$mess_name" },
          totalOrders: { $sum: 1 },
          totalEarnings: { $sum: "$total_price" },
        },
      },
    ]);

    // Fetch all messes for owner mapping
    const messes = await Mess.find();
    const messMap = {};
    messes.forEach((m) => (messMap[m.mess_id] = m));

    // Combine order data with mess info
    const result = earnings.map((e) => {
      const mess = messMap[e._id] || {};
      return {
        mess_id: e._id,
        mess_name: e.mess_name,
        totalOrders: e.totalOrders,
        totalEarnings: e.totalEarnings,
        owner_id: mess.owner_id || null,
      };
    });

    // Fetch all owners to map with mess
    const owners = await User.find({ role: "owner" });
    const ownerMap = {};
    owners.forEach((o) => (ownerMap[o._id] = o));

    // Final combined result with owner info
    const final = result.map((e) => ({
      ...e,
      owner_name: ownerMap[e.owner_id]?.name || "Unknown",
      owner_email: ownerMap[e.owner_id]?.email || "N/A",
    }));

    res.status(200).json(final);
  } catch (error) {
    console.error("💥 Error in /mess-earnings:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

export default router;
