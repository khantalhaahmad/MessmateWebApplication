import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Mess from "../models/Mess.js";
import Review from "../models/Review.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/* ============================================================
   GET OWNER DASHBOARD + ANALYTICS
============================================================ */

router.get("/:ownerId/stats", authMiddleware, async (req, res) => {
  try {

    const { ownerId } = req.params;

    console.log("Owner stats route hit:", ownerId);

    /* -----------------------------
       1. Find messes
    ------------------------------*/

    const messes = await Mess.find({
      $or: [
        { owner_id: ownerId },
        { owner_id: mongoose.Types.ObjectId.isValid(ownerId)
            ? new mongoose.Types.ObjectId(ownerId)
            : ownerId }
      ]
    });

    console.log("Messes found:", messes.length);

    if (!messes.length) {
      return res.json({
        messId: null,
        ordersToday: 0,
        revenueToday: 0,
        customersToday: 0,
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        activeCustomers: 0,
        avgRating: 0,
        topItems: [],
        weeklyOrders: Array(7).fill(0),
        monthlyRevenue: Array(4).fill(0),
        recentOrders: []
      });
    }

    /* -----------------------------
       2. Extract mess IDs
    ------------------------------*/

    const messObjectIds = messes.map(m => m._id);
    const messNumericIds = messes
      .map(m => Number(m.mess_id))
      .filter(id => !isNaN(id));

    const messId = messObjectIds[0].toString();

    /* -----------------------------
       3. Fetch orders
    ------------------------------*/

    const orders = await Order.find({
      $or: [
        { mess_id: { $in: messNumericIds } },
        { mess_id: { $in: messObjectIds.map(id => id.toString()) } },
        { mess_id: { $in: messObjectIds } }
      ]
    }).lean();

    console.log("Orders found:", orders.length);

    /* -----------------------------
       4. TOTAL STATS
    ------------------------------*/

    const totalOrders = orders.length;

    const totalRevenue = orders.reduce(
      (sum, o) => sum + (o.total_price || 0),
      0
    );

    const averageOrderValue =
      totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const activeCustomers = new Set(
      orders.map(o => o.user_id?.toString())
    ).size;

    /* -----------------------------
       5. TODAY STATS
    ------------------------------*/

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= today;
    });

    const ordersToday = todaysOrders.length;

    const revenueToday = todaysOrders.reduce(
      (sum, o) => sum + (o.total_price || 0),
      0
    );

    const customersToday = new Set(
      todaysOrders.map(o => o.user_id?.toString())
    ).size;

    /* -----------------------------
       6. TOP SELLING ITEMS
    ------------------------------*/

    const itemCount = {};

    orders.forEach(order => {

      if (!order.items) return;

      order.items.forEach(item => {

        const name = item.name;

        if (!itemCount[name]) {
          itemCount[name] = 0;
        }

        itemCount[name] += item.quantity || 1;

      });

    });

    const topItems = Object.entries(itemCount)
      .map(([name, count]) => ({
        name,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    /* -----------------------------
       7. REVIEWS
    ------------------------------*/

    const reviewMessIds = [
      ...messObjectIds.map(id => id.toString()),
      ...messNumericIds.map(id => id.toString())
    ];

    const reviews = await Review.find({
      mess_id: { $in: reviewMessIds }
    });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        : 0;

    /* -----------------------------
       8. WEEKLY + MONTHLY STATS
    ------------------------------*/

    const weeklyOrders = Array(7).fill(0);
    const monthlyRevenue = Array(4).fill(0);

    orders.forEach(o => {

      const d = new Date(o.createdAt);

      if (!isNaN(d)) {

        weeklyOrders[d.getDay()]++;

        const weekIndex = Math.floor((d.getDate() - 1) / 7);

        if (weekIndex >= 0 && weekIndex < 4) {
          monthlyRevenue[weekIndex] += o.total_price || 0;
        }

      }

    });

    /* -----------------------------
       9. RECENT ORDERS
    ------------------------------*/

    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(o => ({
        orderId: o._id,
        messId: o.mess_id,
        items: o.items || [],
        totalPrice: o.total_price || 0,
        status: o.status || "Pending"
      }));

    /* -----------------------------
       10. RESPONSE
    ------------------------------*/

    res.json({

      messId,

      ordersToday,
      revenueToday,
      customersToday,

      totalOrders,
      totalRevenue,
      averageOrderValue,

      activeCustomers,

      avgRating: Number(avgRating.toFixed(1)),

      topItems,

      weeklyOrders,
      monthlyRevenue,

      weeklyLabels: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
      monthlyLabels: ["Week 1","Week 2","Week 3","Week 4"],

      recentOrders

    });

    console.log("Owner stats sent successfully");

  } catch (error) {

    console.error("Error generating stats:", error);

    res.status(500).json({
      message: "Error generating stats",
      error: error.message
    });

  }
});

/* ============================================================
   OWNER MENU
============================================================ */

router.get("/:ownerId/menu", authMiddleware, (req, res) => {

  res.json({
    message: "Owner menu route working",
    data: []
  });

});

/* ============================================================
   OWNER ORDERS
============================================================ */

router.get("/:ownerId/orders", authMiddleware, async (req, res) => {

  try {

    const { ownerId } = req.params;

    const messes = await Mess.find({
      $or: [
        { owner_id: ownerId },
        { owner_id: mongoose.Types.ObjectId.isValid(ownerId)
            ? new mongoose.Types.ObjectId(ownerId)
            : ownerId }
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

    console.error("Error fetching owner orders:", error);

    res.status(500).json({
      message: "Error fetching owner orders",
      error
    });

  }

});

/* ============================================================
   OWNER REVIEWS
============================================================ */

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