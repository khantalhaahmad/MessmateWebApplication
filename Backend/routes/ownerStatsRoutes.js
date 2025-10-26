import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Mess from "../models/Mess.js";
import Review from "../models/Review.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/* ============================================================
   ✅ MAIN ROUTE: Get Owner Dashboard Stats
   ============================================================ */
router.get("/:ownerId/stats", authMiddleware, async (req, res) => {
  try {
    const { ownerId } = req.params;
    console.log("📊 Owner stats route hit for ID:", ownerId);

    // Step 1: Find all messes owned by this owner (string or ObjectId)
    const messes = await Mess.find({
      $or: [
        { owner_id: ownerId },
        { owner_id: new mongoose.Types.ObjectId(ownerId) },
      ],
    });

    console.log(`✅ Found ${messes.length} mess(es) for owner ${ownerId}`);

    // Step 2: Return empty stats if no mess found
    if (!messes.length) {
      return res.json({
        totalOrders: 0,
        totalRevenue: 0,
        activeCustomers: 0,
        avgRating: 0,
        weeklyOrders: Array(7).fill(0),
        monthlyRevenue: Array(4).fill(0),
        recentOrders: [],
      });
    }

    // Step 3: Extract mess IDs
    const messIds = messes.map((m) => m.mess_id?.toString() || m._id.toString());

    // Step 4: Fetch orders for those messes
    const orders = await Order.find({ mess_id: { $in: messIds } });
    console.log(`📦 Found ${orders.length} order(s) for messes:`, messIds);

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum, o) => sum + (o.total_price || 0),
      0
    );
    const activeCustomers = new Set(
      orders.map((o) => o.user_id?.toString())
    ).size;

    // Step 5: Fetch reviews safely
    let reviews = [];
    try {
      reviews = await Review.find({
        mess_id: { $in: messIds.map((id) => id.toString()) },
      });
    } catch (err) {
      console.error("⚠️ Skipping ObjectId cast for reviews:", err.message);
      reviews = await Review.find({
        mess_id: {
          $in: messIds.map((id) =>
            mongoose.isValidObjectId(id)
              ? new mongoose.Types.ObjectId(id)
              : id
          ),
        },
      });
    }

    console.log(`⭐ Found ${reviews.length} review(s) for messes:`, messIds);

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        : 0;

    // Step 6: Weekly & Monthly calculations
    const weeklyOrders = Array(7).fill(0);
    const monthlyRevenue = Array(4).fill(0);

    orders.forEach((o) => {
      const d = new Date(o.createdAt);
      if (!isNaN(d)) {
        weeklyOrders[d.getDay()]++;
        monthlyRevenue[Math.floor((d.getDate() - 1) / 7)] += o.total_price || 0;
      }
    });

    // Step 7: Prepare recent 5 orders
    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map((o) => ({
        orderId: o._id,
        messId: o.mess_id,
        items: o.items || [],
        totalPrice: o.total_price || 0,
        status: o.status || "Pending",
      }));

    // Step 8: Send response
    res.json({
      totalOrders,
      totalRevenue,
      activeCustomers,
      avgRating,
      weeklyOrders,
      monthlyRevenue,
      weeklyLabels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      monthlyLabels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      recentOrders,
    });
  } catch (error) {
    console.error("💥 Error generating stats:", error);
    res.status(500).json({
      message: "Error generating stats",
      error: error.message,
    });
  }
});

/* ============================================================
   ✅ ADDITIONAL ROUTES to stop 404 errors and send real data
   ============================================================ */

// 👇 Owner Menu (placeholder)
router.get("/:ownerId/menu", authMiddleware, (req, res) => {
  res.json({ message: "✅ Owner menu route working", data: [] });
});

// 👇 Owner Orders (real recent orders)
router.get("/:ownerId/orders", authMiddleware, async (req, res) => {
  try {
    const { ownerId } = req.params;
    const messes = await Mess.find({
      $or: [
        { owner_id: ownerId },
        { owner_id: new mongoose.Types.ObjectId(ownerId) },
      ],
    });

    const messMap = {};
    messes.forEach((m) => {
      messMap[m.mess_id?.toString() || m._id.toString()] = m.name || "Unnamed Mess";
    });

    const messIds = Object.keys(messMap);
    const orders = await Order.find({ mess_id: { $in: messIds } })
      .sort({ createdAt: -1 })
      .limit(10);

    const formattedOrders = orders.map((o) => ({
      _id: o._id,
      mess_name: messMap[o.mess_id] || "Unknown Mess",
      items: o.items || [],
      total_price: o.total_price || 0,
      status: o.status || "Pending",
    }));

    res.json({ data: formattedOrders });
  } catch (error) {
    console.error("💥 Error fetching owner orders:", error);
    res.status(500).json({ message: "Error fetching owner orders", error });
  }
});

// 👇 Owner Reviews
router.get("/:ownerId/reviews", authMiddleware, async (req, res) => {
  try {
    const { ownerId } = req.params;
    const messes = await Mess.find({ owner_id: ownerId });
    const messIds = messes.map((m) => m.mess_id?.toString() || m._id.toString());
    const reviews = await Review.find({
      mess_id: { $in: messIds.map((id) => id.toString()) },
    });
    res.json({ data: reviews });
  } catch (error) {
    res.status(500).json({ message: "Error fetching owner reviews", error });
  }
});

export default router;
