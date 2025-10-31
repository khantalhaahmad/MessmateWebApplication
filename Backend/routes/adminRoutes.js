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
   5️⃣ Owner Payouts (Monthly) — Unified, Deduplicated, Dynamic Commission
   ============================================================ */
router.get("/owner-payouts", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const COMMISSION_RATE = Number(process.env.COMMISSION_RATE || 10);

    // 🧠 Step 1: Aggregate orders (include all relevant statuses)
    const monthlyOrders = await Order.aggregate([
      {
        $match: {
          status: { $in: ["confirmed", "Pending (COD)", "delivered"] },
          createdAt: { $gte: start },
        },
      },
      {
        $group: {
          _id: {
            mess_id: "$mess_id",
            mess_name: "$mess_name",
          },
          totalRevenue: { $sum: "$total_price" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // 🧠 Step 2: Normalize + merge duplicates by mess name or ID
    const mergedMap = new Map();

    monthlyOrders.forEach((entry) => {
      const rawMessId = entry._id.mess_id?.toString()?.trim();
      const rawMessName = entry._id.mess_name?.toLowerCase()?.trim();

      // 🧩 Create a unique key using either mess_id or mess_name
      const key =
        rawMessId && rawMessId !== "N/A" && rawMessId !== "null"
          ? rawMessId
          : rawMessName || "unknown";

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

        // ✅ Try matching by ObjectId
        if (entryId && /^[0-9a-fA-F]{24}$/.test(entryId)) {
          mess = await Mess.findById(entryId).populate("owner_id", "name email");
        }

        // ✅ Try matching by numeric mess_id
        if (!mess && !isNaN(Number(entryId))) {
          mess = await Mess.findOne({ mess_id: Number(entryId) }).populate("owner_id", "name email");
        }

        // ✅ Try matching by name
        if (!mess && entryName && entryName !== "Unknown Mess") {
          mess = await Mess.findOne({ name: entryName }).populate("owner_id", "name email");
        }

        // ✅ Compute payout values
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
        };
      })
    );

    // ✅ Step 4: Merge duplicates that might differ only by case or type
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
    handleError(res, error, "Error fetching pending mess requests");
  }
});

router.put("/mess-request/:id/approve", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const request = await MessRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });

    const newMess = await Mess.create({
      name: request.name,
      location: request.location,
      owner_id: request.owner_id,
      price_range: request.price_range || "",
      offer: request.offer || "",
      menu: request.menu || { items: [] },
      status: "active",
      documents: {
        pancard: request.pancard || "",
        fssai: request.fssai || "",
        menuPhoto: request.menuPhoto || "",
        bankDetails: request.bankDetails || "",
      },
    });

    await request.deleteOne();
    res.json({ success: true, message: "Mess approved", mess: newMess });
  } catch (error) {
    handleError(res, error, "Error approving mess request");
  }
});

router.put("/mess-request/:id/reject", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await MessRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Mess request rejected" });
  } catch (error) {
    handleError(res, error, "Error rejecting mess request");
  }
});

/* ============================================================
   7️⃣ Delivery Requests (Approve / Reject)
   ============================================================ */
router.get("/delivery-requests/pending", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pending = await DeliveryRequest.find({ status: "pending" }).sort({ createdAt: -1 });
    res.json(pending);
  } catch (error) {
    handleError(res, error, "Error fetching delivery requests");
  }
});

router.put("/delivery-request/:id/approve", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const request = await DeliveryRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });

    await DeliveryAgent.create({
      name: request.name,
      phone: request.phone,
      email: request.email,
      city: request.city,
      vehicleType: request.vehicleType,
      vehicleNumber: request.vehicleNumber,
      status: "available",
    });

    await request.deleteOne();
    res.json({ success: true, message: "Delivery agent approved" });
  } catch (error) {
    handleError(res, error, "Error approving delivery request");
  }
});

router.put("/delivery-request/:id/reject", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await DeliveryRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Delivery request rejected" });
  } catch (error) {
    handleError(res, error, "Error rejecting delivery request");
  }
});

/* ============================================================
   8️⃣ Lists, Top Messes, Reviews (✅ FIXED)
   ============================================================ */
router.get("/mess-list", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const messes = await Mess.find()
      .sort({ createdAt: -1 })
      .populate("owner_id", "name email");
    res.json(messes);
  } catch (error) {
    handleError(res, error, "Error fetching mess list");
  }
});

router.get("/owners", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const owners = await User.find({ role: "owner" }).select("name email");
    const messes = await Mess.find().select("name owner_id");
    const data = owners.map((o) => ({
      ownerName: o.name,
      email: o.email,
      messes: messes
        .filter((m) => m.owner_id?.toString() === o._id.toString())
        .map((m) => m.name),
    }));
    res.json(data);
  } catch (error) {
    handleError(res, error, "Error fetching owners");
  }
});

router.get("/students", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select(
      "name email createdAt"
    );
    res.json(students);
  } catch (error) {
    handleError(res, error, "Error fetching students");
  }
});

router.get("/delivery-agents", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const agents = await DeliveryAgent.find().sort({ createdAt: -1 });
    res.json(agents);
  } catch (error) {
    handleError(res, error, "Error fetching delivery agents");
  }
});

/* ============================================================
   🏆 Top Performing Messes — FIXED for Real Database Data
   ============================================================ */
router.get("/top-messes", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 5, 20);
    const sinceDays = Number(req.query.sinceDays) || 30;

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - sinceDays);
    sinceDate.setHours(0, 0, 0, 0);

    // ✅ 1. Aggregate orders by both mess_id & mess_name
    const agg = await Order.aggregate([
      {
        $match: {
          status: { $in: ["confirmed", "Pending (COD)", "delivered"] },
          createdAt: { $gte: sinceDate },
        },
      },
      {
        $group: {
          _id: { messId: "$mess_id", messName: "$mess_name" },
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ["$total_price", 0] } },
        },
      },
      { $sort: { totalRevenue: -1, orderCount: -1 } },
      { $limit: limit },
    ]);

    // ✅ 2. Collect all unique mess IDs to fetch actual Mess documents
    const messIds = agg.map((a) => a._id.messId).filter(Boolean);
    const objectIds = messIds.filter((id) => /^[0-9a-fA-F]{24}$/.test(String(id)));
    const numericIds = messIds
      .map((id) => Number(id))
      .filter((id) => !isNaN(id) && id !== 0);

    const messes = await Mess.find({
      $or: [
        { _id: { $in: objectIds } },
        { mess_id: { $in: numericIds } },
      ],
    })
      .select("name location mess_id")
      .lean();

    // ✅ 3. Combine order aggregation + mess data
    const result = agg.map((a) => {
      const mess =
        messes.find(
          (m) =>
            String(m._id) === String(a._id.messId) ||
            String(m.mess_id) === String(a._id.messId)
        ) || null;

      return {
        messId: a._id.messId || "N/A",
        name: mess?.name || a._id.messName || "Unnamed Mess",
        location: mess?.location || "N/A",
        orderCount: a.orderCount,
        totalRevenue: a.totalRevenue,
      };
    });

    // ✅ 4. Return clean data sorted by revenue
    result.sort((a, b) => b.totalRevenue - a.totalRevenue);
    res.json(result);
  } catch (error) {
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

