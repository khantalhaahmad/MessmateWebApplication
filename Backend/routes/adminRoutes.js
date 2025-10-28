// Backend/routes/adminRoutes.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
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
   2️⃣ Update Payout Status
   ============================================================ */
router.put("/payout-status", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { messName, payoutStatus } = req.body;
    if (!messName) return res.status(400).json({ success: false, message: "messName missing" });

    const mess = await Mess.findOne({ name: messName });
    if (!mess) return res.status(404).json({ success: false, message: "Mess not found" });

    mess.payoutStatus = payoutStatus;
    await mess.save();

    res.json({ success: true, message: `Payout status updated to ${payoutStatus}` });
  } catch (err) {
    handleError(res, err, "Error updating payout status");
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
      status: "confirmed",
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
          status: "confirmed",
          createdAt: {
            $gte: startDate,
            $lte: new Date(), // ✅ Include orders up to right now
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
   5️⃣ Owner Payouts (Monthly) — Uses COMMISSION_RATE
   ============================================================ */
router.get("/owner-payouts", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyOrders = await Order.aggregate([
      { $match: { status: "confirmed", createdAt: { $gte: start } } },
      {
        $group: {
          _id: "$mess_id",
          messName: { $first: "$mess_name" },
          totalRevenue: { $sum: "$total_price" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const payouts = await Promise.all(
      monthlyOrders.map(async (entry) => {
        const entryId = entry._id;
        let mess = null;

        const isObjectId = typeof entryId === "string" && /^[0-9a-fA-F]{24}$/.test(entryId);
        if (isObjectId) mess = await Mess.findById(entryId).populate("owner_id", "name email");
        if (!mess) {
          const num = Number(entryId);
          if (!Number.isNaN(num))
            mess = await Mess.findOne({ mess_id: num }).populate("owner_id", "name email");
        }

        const owner = mess?.owner_id || {};
        const commission = Math.round((entry.totalRevenue * COMMISSION_RATE) / 100);
        const payable = Math.round(entry.totalRevenue - commission);

        return {
          messId: entry._id,
          messName: entry.messName || mess?.name || "Unnamed Mess",
          ownerName: owner.name || "Unknown",
          ownerEmail: owner.email || "N/A",
          totalRevenue: entry.totalRevenue,
          totalOrders: entry.totalOrders,
          commission,
          payable,
          payoutStatus: mess?.payoutStatus || "Pending",
        };
      })
    );

    res.json(payouts);
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
   8️⃣ Lists, Top Messes, Reviews
   ============================================================ */
router.get("/mess-list", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const messes = await Mess.find().sort({ createdAt: -1 }).populate("owner_id", "name email");
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
      messes: messes.filter((m) => m.owner_id?.toString() === o._id.toString()).map((m) => m.name),
    }));
    res.json(data);
  } catch (error) {
    handleError(res, error, "Error fetching owners");
  }
});

router.get("/students", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select("name email createdAt");
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

router.get("/top-messes", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 5, 20);
    const sinceDays = Number(req.query.sinceDays) || 30;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - sinceDays);
    sinceDate.setHours(0, 0, 0, 0);

    const agg = await Order.aggregate([
      { $match: { status: "confirmed", createdAt: { $gte: sinceDate } } },
      {
        $group: {
          _id: "$mess_id",
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ["$total_price", 0] } },
        },
      },
      { $sort: { orderCount: -1, totalRevenue: -1 } },
      { $limit: limit },
    ]);

    const ids = agg.map((a) => a._id);
    const numericIds = ids.filter((v) => !isNaN(Number(v)));

    const messQuery = {
      $or: [
        { _id: { $in: ids.filter((id) => /^[0-9a-fA-F]{24}$/.test(String(id))) } },
        { mess_id: { $in: ids } },
        { mess_id: { $in: numericIds } },
      ],
    };

    const messDocs = await Mess.find(messQuery).select("name location mess_id").lean();
    const result = agg.map((a) => {
      const mess = messDocs.find(
        (m) => String(m._id) === String(a._id) || String(m.mess_id) === String(a._id)
      );
      return {
        messId: a._id,
        name: mess?.name || "Unknown Mess",
        location: mess?.location || "N/A",
        orderCount: a.orderCount,
        totalRevenue: a.totalRevenue,
      };
    });

    res.json(result);
  } catch (error) {
    handleError(res, error, "Error fetching top messes");
  }
});

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
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    handleError(res, error, "Error deleting review");
  }
});

export default router;
