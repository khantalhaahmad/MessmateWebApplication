import express from "express";
import authMiddleware from "../middleware/authMiddleware.js"; // ✅ FIXED
import adminMiddleware from "../middleware/adminMiddleware.js"; // ✅ FIXED
import Order from "../models/Order.js";
import Mess from "../models/Mess.js";
import User from "../models/User.js";
import MessRequest from "../models/MessRequest.js";
import Review from "../models/Review.js";
import DeliveryAgent from "../models/DeliveryAgent.js";
import DeliveryRequest from "../models/DeliveryRequest.js";
import Payout from "../models/Payout.js";


const router = express.Router();

// 💰 Commission Rate (from env, default 10%)
const COMMISSION_RATE = Number(process.env.COMMISSION_RATE || 10);

// Common error handler
const handleError = (res, error, message) => {
  console.error(`💥 ${message}:`, error);
  res.status(500).json({ success: false, message, error: error.message });
};

/* ============================================================
   1️⃣ Delivery Request (Public - compatibility)
   ============================================================ */
router.post("/delivery-request", async (req, res) => {
  try {
    const request = new DeliveryRequest({
      ...req.body,
      date: new Date().toLocaleDateString("en-GB"),
      status: "pending",
    });

    await request.save();
    return res.status(201).json({ message: "Request submitted successfully" });
  } catch (err) {
    handleError(res, err, "Error saving delivery request");
  }
});

/* ============================================================
   2️⃣ Update Payout Status (✅ Fixed and Logged)
   ============================================================ */
router.put("/payout-status", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log("🟢 Received payout update request:", req.body); // ✅ Debug log to check frontend payload

    const { messId, payoutStatus } = req.body; // ✅ using messId instead of messName

    // 🧠 Validate input
    if (!messId)
      return res
        .status(400)
        .json({ success: false, message: "❌ messId missing in request body" });

    // ✅ Find mess by ID
    const mess = await Mess.findById(messId);
    if (!mess)
      return res
        .status(404)
        .json({ success: false, message: `❌ Mess not found for ID: ${messId}` });

    // ✅ Update and save
    mess.payoutStatus = payoutStatus || "Paid";
    await mess.save();
    await Payout.updateMany({ messId }, { payoutStatus });


    console.log(`✅ Payout status updated for Mess: ${mess.name} (${mess._id}) → ${mess.payoutStatus}`);

    return res.json({
      success: true,
      message: `✅ Payout status updated to ${mess.payoutStatus}`,
    });
  } catch (err) {
    console.error("💥 Error updating payout status:", err);
    return res
      .status(500)
      .json({ success: false, message: "Error updating payout status", error: err.message });
  }
});

/* ============================================================
   3️⃣ Daily Summary (🧠 Fixed Commission Logic)
   ============================================================ */
router.get("/daily-summary", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const todayOrders = await Order.find({
  status: { $in: ["confirmed", "Pending (COD)", "delivered"] },
  createdAt: { $gte: start, $lt: end },
});


    const totalOrders = todayOrders.length;
    const totalGrossRevenue = todayOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
    const totalCommission = Math.round((totalGrossRevenue * COMMISSION_RATE) / 100);
    const totalOwnerRevenue = totalGrossRevenue - totalCommission;

    const [totalMesses, totalOwners, totalStudents, totalDeliveryAgents] = await Promise.all([
      Mess.countDocuments(),
      User.countDocuments({ role: "owner" }),
      User.countDocuments({ role: "student" }),
      DeliveryAgent.countDocuments(),
    ]);

    res.json({
      success: true,
      totalOrders,
      totalGrossRevenue,
      totalCommission,
      totalRevenue: totalOwnerRevenue,
      totalMesses,
      totalOwners,
      totalStudents,
      totalDeliveryAgents,
    });
  } catch (error) {
    handleError(res, error, "Error in daily summary");
  }
});

/* ============================================================
   4️⃣ Revenue Trends (7 days)
   ============================================================ */
router.get("/revenue-trends", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const data = await Order.aggregate([
      {
        $match: {
  status: { $in: ["confirmed", "Pending (COD)", "delivered"] },
  createdAt: {
    $gte: startDate,
    $lte: new Date(),
  },
},

      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "Asia/Kolkata", // ✅ Use Indian timezone (fixes chart)
            },
          },
          totalRevenue: { $sum: "$total_price" },
          totalOrders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const trendMap = {};
    data.forEach((d) => (trendMap[d._id] = d.totalRevenue));

    const finalData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const key = date.toISOString().split("T")[0];
      finalData.push({
        _id: key,
        totalRevenue: trendMap[key] || 0,
      });
    }

    res.status(200).json(finalData);
  } catch (error) {
    handleError(res, error, "Error in revenue trends");
  }
});

/* ============================================================
   5️⃣ Owner Payouts (10-Day Cycle Based like Zomato)
   ============================================================ */
import { getSettlementCycle } from "../utils/getSettlementCycle.js"; // ✅ make sure this file exists

router.get("/owner-payouts", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const COMMISSION_RATE = Number(process.env.COMMISSION_RATE || 10);
    const { cycle } = req.query;

    // 🧠 If no cycle is provided, use current one automatically
    const now = new Date();
    const activeCycle = cycle || getSettlementCycle(now);

    // 🔹 Determine 10-day window for the selected cycle
    const [year, month, cyclePart] = activeCycle.split("-");
    const y = parseInt(year);
    const m = parseInt(month) - 1;
    let startDay = 1, endDay = 10;

    if (cyclePart === "C2") {
      startDay = 11;
      endDay = 20;
    } else if (cyclePart === "C3") {
      startDay = 21;
      endDay = 30;
    }

    const start = new Date(y, m, startDay);
    const end = new Date(y, m, endDay + 1);

    console.log(`📅 Fetching payouts for cycle: ${activeCycle} (${start.toDateString()} → ${end.toDateString()})`);

    // 🧮 Step 1: Aggregate orders for this cycle
    const orders = await Order.aggregate([
      {
        $match: {
          status: { $in: ["confirmed", "Pending (COD)", "delivered"] },
          createdAt: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: { mess_id: "$mess_id", mess_name: "$mess_name" },
          totalRevenue: { $sum: "$total_price" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // 🧩 Step 2: Combine duplicates (some messes may have mixed IDs)
    const mergedMap = new Map();
    orders.forEach((entry) => {
      const rawMessId = entry._id.mess_id?.toString()?.trim();
      const rawMessName = entry._id.mess_name?.toLowerCase()?.trim();
      const key = rawMessId || rawMessName || "unknown";

      if (!mergedMap.has(key)) {
        mergedMap.set(key, { ...entry });
      } else {
        const existing = mergedMap.get(key);
        existing.totalRevenue += entry.totalRevenue;
        existing.totalOrders += entry.totalOrders;
        mergedMap.set(key, existing);
      }
    });

    const mergedOrders = Array.from(mergedMap.values());

    // 🧠 Step 3: Fetch Mess & Owner info, compute payouts
    const payouts = await Promise.all(
      mergedOrders.map(async (entry) => {
        const entryId = entry._id.mess_id;
        const entryName = entry._id.mess_name;
        let mess = null;

        // 🔍 Try matching Mess record
        if (entryId && /^[0-9a-fA-F]{24}$/.test(entryId)) {
          mess = await Mess.findById(entryId).populate("owner_id", "name email");
        } else if (!mess && !isNaN(Number(entryId))) {
          mess = await Mess.findOne({ mess_id: Number(entryId) }).populate("owner_id", "name email");
        } else if (!mess && entryName) {
          mess = await Mess.findOne({ name: entryName }).populate("owner_id", "name email");
        }

        const owner = mess?.owner_id || {};
        const commission = Math.round((entry.totalRevenue * COMMISSION_RATE) / 100);
        const payable = Math.round(entry.totalRevenue - commission);

        return {
          messId: mess?._id?.toString() || entryId || "N/A",
          messName: mess?.name || entryName || "Unknown Mess",
          ownerName: owner.name || "Unknown",
          ownerEmail: owner.email || "N/A",
          totalOrders: entry.totalOrders,
          totalRevenue: entry.totalRevenue,
          commissionRate: `${COMMISSION_RATE}%`,
          commission,
          payable,
          payoutStatus: mess?.payoutStatus || "Pending",
          settlementCycle: activeCycle, // ✅ important
        };
      })
    );

    // 🧾 Step 4: Merge duplicates that might differ by case
    const finalMerged = [];
    const seen = new Set();

    for (const p of payouts) {
      const key = p.messName.toLowerCase().trim();
      if (seen.has(key)) {
        const existing = finalMerged.find((x) => x.messName.toLowerCase().trim() === key);
        existing.totalOrders += p.totalOrders;
        existing.totalRevenue += p.totalRevenue;
        existing.commission += p.commission;
        existing.payable += p.payable;
      } else {
        seen.add(key);
        finalMerged.push(p);
      }
    }

    res.json(finalMerged);
  } catch (error) {
    handleError(res, error, "Error generating owner payouts");
  }
});
/* ============================================================
   6️⃣ Mess Requests (Approve / Reject)
   ============================================================ */
router.get("/mess-requests/pending", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pending = await MessRequest.find({ status: "pending" })
      .populate("owner_id", "name email")
      .sort({ createdAt: -1 });
    res.json(pending);
  } catch (error) {
    console.error("❌ Error fetching pending mess requests:", error);
    res.status(500).json({ success: false, message: "Error fetching pending mess requests" });
  }
});

/* ============================================================
   7️⃣ Delivery Requests (Approve / Reject)
   ============================================================ */
router.get("/delivery-requests/pending", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pending = await DeliveryRequest.find({ status: "pending" })
      .sort({ createdAt: -1 });
    res.json(pending);
  } catch (error) {
    console.error("❌ Error fetching delivery requests:", error);
    res.status(500).json({ success: false, message: "Error fetching delivery requests" });
  }
});


/* ============================================================
   🏆 Top Performing Messes — Merged + Ranked (Fixed for Real Data)
   ============================================================ */
router.get("/top-messes", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const sinceDays = Number(req.query.sinceDays) || 30;

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - sinceDays);
    sinceDate.setHours(0, 0, 0, 0);

    // ✅ 1. Aggregate orders by mess_id & mess_name
    const agg = await Order.aggregate([
      {
        $match: {
          status: { $in: ["confirmed", "Pending (COD)", "delivered"] },
          createdAt: { $gte: sinceDate },
        },
      },
      {
        $group: {
          _id: {
            messId: "$mess_id",
            messName: "$mess_name",
          },
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ["$total_price", 0] } },
        },
      },
    ]);

    // ✅ 2. Merge duplicates by normalized mess name (ignore case & spaces)
    const mergedMap = new Map();
    agg.forEach((entry) => {
      const normalizedName = (entry._id.messName || "Unknown")
        .toLowerCase()
        .replace(/\s+/g, "");
      if (!mergedMap.has(normalizedName)) {
        mergedMap.set(normalizedName, {
          messId: entry._id.messId || "N/A",
          messName: entry._id.messName || "Unknown Mess",
          orderCount: entry.orderCount,
          totalRevenue: entry.totalRevenue,
        });
      } else {
        const existing = mergedMap.get(normalizedName);
        existing.orderCount += entry.orderCount;
        existing.totalRevenue += entry.totalRevenue;
      }
    });

    const merged = Array.from(mergedMap.values());

    // ✅ 3. Fetch mess data for location enrichment
    const messes = await Mess.find().select("name location mess_id").lean();

    const result = merged.map((entry) => {
      const match = messes.find(
        (m) =>
          m.name.toLowerCase().replace(/\s+/g, "") ===
          entry.messName.toLowerCase().replace(/\s+/g, "")
      );

      return {
        messId: match?._id?.toString() || entry.messId,
        name: match?.name || entry.messName,
        location: match?.location || "N/A",
        orderCount: entry.orderCount,
        totalRevenue: entry.totalRevenue,
      };
    });

    // ✅ 4. Sort and assign ranks
    result.sort((a, b) => b.totalRevenue - a.totalRevenue);
    const ranked = result.map((m, i) => ({ rank: i + 1, ...m }));

    // ✅ 5. Return top messes (limit)
    res.json(ranked.slice(0, limit));
  } catch (error) {
    console.error("💥 Error fetching top messes:", error);
    handleError(res, error, "Error fetching top messes");
  }
});

/* ============================================================
   ⭐ Reviews
   ============================================================ */
router.get("/reviews", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("user_id", "name email")
      .populate("mess_id", "name")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    handleError(res, error, "Error fetching reviews");
  }
});

router.delete("/reviews/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review)
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    handleError(res, error, "Error deleting review");
  }
});

/* ============================================================
   🧭 Admin Dashboard Overview
   ============================================================ */
// ✅ FIXED DASHBOARD OVERVIEW — Shows real-time data from database
router.get("/dashboard", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const COMMISSION_RATE = Number(process.env.COMMISSION_RATE || 10);

    // 🔹 1. Calculate today's confirmed orders
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const todayOrders = await Order.find({
  status: { $in: ["confirmed", "Pending (COD)", "delivered"] },
  createdAt: { $gte: start, $lte: end },
});


    const totalOrders = todayOrders.length;
    const totalGrossRevenue = todayOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
    const totalCommission = Math.round((totalGrossRevenue * COMMISSION_RATE) / 100);
    const totalOwnerRevenue = totalGrossRevenue - totalCommission;

    // 🔹 2. Count messes, owners, students, delivery agents
    const [totalOwners, totalStudents, totalDeliveryAgents] = await Promise.all([
      User.countDocuments({ role: "owner" }),
      User.countDocuments({ role: "student" }),
      DeliveryAgent.countDocuments(),
    ]);

    // 🔹 3. 7-day revenue trend
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const revenueTrend = await Order.aggregate([
      {
        $match: {
  status: { $in: ["confirmed", "Pending (COD)", "delivered"] },
  createdAt: { $gte: startDate },
},

      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "Asia/Kolkata",
            },
          },
          totalRevenue: { $sum: "$total_price" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 🔹 4. Fill missing days
    const trendMap = {};
    revenueTrend.forEach((r) => (trendMap[r._id] = r.totalRevenue));

    const finalTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split("T")[0];
      finalTrend.push({
        date: key,
        revenue: trendMap[key] || 0,
      });
    }

    // ✅ Send correct response matching frontend expectations
    res.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue: totalOwnerRevenue,
        totalCommission,
        totalOwners,
        totalStudents,
        totalDeliveryAgents,
      },
      trend: finalTrend,
    });
  } catch (error) {
    console.error("💥 Dashboard Error:", error);
    res.status(500).json({ success: false, message: "Failed to load dashboard", error: error.message });
  }
});

export default router;

