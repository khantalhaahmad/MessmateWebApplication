import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Mess from "../models/Mess.js";
import Review from "../models/Review.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/* ============================================================
   ✅ MAIN ROUTE: Get Owner Dashboard Stats (WITH messId FIX)
   ============================================================ */

router.get("/:ownerId/stats", authMiddleware, async (req, res) => {
  try {
    const { ownerId } = req.params;

    console.log("📊 Owner stats route hit for ID:", ownerId);

    /* -----------------------------
       1️⃣ Find owner's messes
    ------------------------------*/

    const messes = await Mess.find({
      $or: [
        { owner_id: ownerId },
        { owner_id: new mongoose.Types.ObjectId(ownerId) }
      ]
    });

    console.log(`✅ Found ${messes.length} mess(es) for owner ${ownerId}`);

    /* -----------------------------
       2️⃣ No mess case
    ------------------------------*/

    if (!messes.length) {
      return res.json({
        messId: null,
        totalOrders: 0,
        totalRevenue: 0,
        activeCustomers: 0,
        avgRating: 0,
        weeklyOrders: Array(7).fill(0),
        monthlyRevenue: Array(4).fill(0),
        recentOrders: []
      });
    }

    /* -----------------------------
       3️⃣ Extract mess IDs
    ------------------------------*/

    const messObjectIds = messes.map(m => m._id);
    const messNumericIds = messes
      .map(m => (m.mess_id ? Number(m.mess_id) : null))
      .filter(id => !isNaN(id));

    // 🔥 IMPORTANT FOR ANDROID
    const messId = messObjectIds[0].toString();

    console.log("🏠 Primary messId:", messId);

    /* -----------------------------
       4️⃣ Fetch orders
    ------------------------------*/

    const orders = await Order.find({
      $or: [
        { mess_id: { $in: messNumericIds } },
        { mess_id: { $in: messObjectIds.map(id => id.toString()) } },
        { mess_id: { $in: messObjectIds } }
      ]
    });

    console.log(`📦 Found ${orders.length} order(s)`);

    /* -----------------------------
       5️⃣ Calculate stats
    ------------------------------*/

    const totalOrders = orders.length;

    const totalRevenue = orders.reduce(
      (sum, o) => sum + (o.total_price || 0),
      0
    );

    const activeCustomers = new Set(
      orders.map(o => o.user_id?.toString())
    ).size;

    /* -----------------------------
       6️⃣ Fetch reviews
    ------------------------------*/

    const reviewMessIds = [
      ...messObjectIds.map(id => id.toString()),
      ...messNumericIds.map(id => id.toString())
    ];

    const reviews = await Review.find({
      mess_id: { $in: reviewMessIds }
    });

    console.log(`⭐ Found ${reviews.length} review(s)`);

    /* -----------------------------
       7️⃣ Average rating
    ------------------------------*/

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        : 0;

    /* -----------------------------
       8️⃣ Weekly + Monthly stats
    ------------------------------*/

    const weeklyOrders = Array(7).fill(0);
    const monthlyRevenue = Array(4).fill(0);

    orders.forEach(o => {
      const d = new Date(o.createdAt);

      if (!isNaN(d)) {
        weeklyOrders[d.getDay()]++;

        monthlyRevenue[Math.floor((d.getDate() - 1) / 7)] +=
          o.total_price || 0;
      }
    });

    /* -----------------------------
       9️⃣ Recent orders
    ------------------------------*/

    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(o => ({
        orderId: o._id,
        messId: o.mess_id,
        messName:
          messes.find(
            m =>
              m.mess_id?.toString() === o.mess_id?.toString() ||
              m._id?.toString() === o.mess_id?.toString()
          )?.name || "Unknown Mess",
        items: o.items || [],
        totalPrice: o.total_price || 0,
        status: o.status || "Pending"
      }));

    /* -----------------------------
       🔟 Send response
    ------------------------------*/

    res.json({
      messId, // 🔥 REQUIRED FOR ANDROID MENU API

      totalOrders,
      totalRevenue,
      activeCustomers,
      avgRating: Number(avgRating.toFixed(1)),

      weeklyOrders,
      monthlyRevenue,

      weeklyLabels: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
      monthlyLabels: ["Week 1","Week 2","Week 3","Week 4"],

      recentOrders
    });

    console.log("✅ Owner stats sent successfully");

  } catch (error) {

    console.error("💥 Error generating stats:", error);

    res.status(500).json({
      message: "Error generating stats",
      error: error.message
    });
  }
});

/* ============================================================
   ✅ ADDITIONAL ROUTES
   ============================================================ */

/* -----------------------------
   Owner Menu
------------------------------*/

router.get("/:ownerId/menu", authMiddleware, (req, res) => {

  res.json({
    message: "✅ Owner menu route working",
    data: []
  });

});

/* -----------------------------
   Owner Orders
------------------------------*/

router.get("/:ownerId/orders", authMiddleware, async (req, res) => {
  try {

    const { ownerId } = req.params;

    const messes = await Mess.find({
      $or: [
        { owner_id: ownerId },
        { owner_id: new mongoose.Types.ObjectId(ownerId) }
      ]
    });

    const messMap = {};

    messes.forEach(m => {
      messMap[m.mess_id?.toString() || m._id.toString()] =
        m.name || "Unnamed Mess";
    });

    const messIds = Object.keys(messMap);

    const orders = await Order.find({
      mess_id: { $in: messIds }
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const formattedOrders = orders.map(o => ({
      _id: o._id,
      mess_name: messMap[o.mess_id] || "Unknown Mess",
      items: o.items || [],
      total_price: o.total_price || 0,
      status: o.status || "Pending"
    }));

    res.json({ data: formattedOrders });

  } catch (error) {

    console.error("💥 Error fetching owner orders:", error);

    res.status(500).json({
      message: "Error fetching owner orders",
      error
    });

  }
});

/* -----------------------------
   Owner Reviews
------------------------------*/

router.get("/:ownerId/reviews", authMiddleware, async (req, res) => {
  try {

    const { ownerId } = req.params;

    const messes = await Mess.find({ owner_id: ownerId });

    const messIds = messes.map(
      m => m.mess_id?.toString() || m._id.toString()
    );

    const reviews = await Review.find({
      mess_id: { $in: messIds }
    });

    res.json({ data: reviews });

  } catch (error) {

    res.status(500).json({
      message: "Error fetching owner reviews",
      error
    });

  }
});

export default router;