import express from "express";
import Payout from "../models/Payout.js";
import User from "../models/User.js";

const router = express.Router();

/* ============================================================
   💰 GET WALLET (FINAL CORRECT)
============================================================ */

router.get("/wallet", async (req, res) => {
  try {

    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    const payouts = await Payout.find({ vendorId: userId });

    let pending = 0;
    let processing = 0;
    let paid = 0;

    payouts.forEach(p => {

      if (p.status === "pending") {
        pending += p.amount;
      }

      if (p.status === "processing") {
        processing += p.amount;
      }

      if (p.status === "completed") {
        paid += p.amount;
      }

    });

    // 🔥 REAL WALLET
    const wallet = pending - processing;

    res.json({
      success: true,
      wallet,        // withdrawable
      pending,       // total earning
      processing,    // locked
      paid
    });

  } catch (err) {

    console.error("Wallet error:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
});


/* ============================================================
   📤 WITHDRAW REQUEST (🔥 FINAL CORRECT LOGIC)
============================================================ */

router.post("/withdraw", async (req, res) => {
  try {

    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({
        success:false,
        message:"userId and amount required"
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success:false,
        message:"Invalid amount"
      });
    }

    /* ============================
       💰 CALCULATE AVAILABLE BALANCE
    ============================ */

    const payouts = await Payout.find({ vendorId: userId });

    let pending = 0;
    let processing = 0;

    payouts.forEach(p => {
      if (p.status === "pending") pending += p.amount;
      if (p.status === "processing") processing += p.amount;
    });

    const available = pending - processing;

    if (amount > available) {
      return res.status(400).json({
        success:false,
        message:"Insufficient balance"
      });
    }

    /* ============================
       🔥 CREATE SINGLE REQUEST (NO SPLIT)
    ============================ */

    const payout = await Payout.create({
      vendorId: userId,
      amount: amount,
      payoutMethod: "manual",
      status: "processing",
      requestedAt: new Date()
    });

    res.json({
      success:true,
      message:"Withdraw request created",
      payout
    });

  } catch (err) {

    console.error("Withdraw error:", err);

    res.status(500).json({
      success:false,
      message: err.message
    });

  }
});


/* ============================================================
   🧾 ADMIN: GET WITHDRAW REQUESTS
============================================================ */

router.get("/admin/withdraw-requests", async (req, res) => {
  try {

    const requests = await Payout.find({
      status: "processing",
      payoutMethod: "manual"
    })
    .populate("vendorId", "name email")
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests
    });

  } catch (err) {

    res.status(500).json({
      success:false,
      message: err.message
    });

  }
});


/* ============================================================
   ✅ ADMIN: APPROVE WITHDRAW (FINAL FIX)
============================================================ */

router.patch("/admin/approve/:id", async (req, res) => {
  try {

    const payout = await Payout.findById(req.params.id);

    if (!payout) {
      return res.status(404).json({
        success:false,
        message:"Payout not found"
      });
    }

    if (payout.status !== "processing") {
      return res.status(400).json({
        success:false,
        message:"Invalid payout state"
      });
    }

    // 🔥 COMPLETE PAYMENT
    payout.status = "completed";
    payout.paidAt = new Date();

    await payout.save();

    // OPTIONAL stats update
    const user = await User.findById(payout.vendorId);

    if (user) {
      user.totalPayout = (user.totalPayout || 0) + payout.amount;
      await user.save();
    }

    res.json({
      success:true,
      message:"Withdraw approved"
    });

  } catch (err) {

    res.status(500).json({
      success:false,
      message: err.message
    });

  }
});


/* ============================================================
   ❌ ADMIN: REJECT WITHDRAW (FINAL FIX)
============================================================ */

router.patch("/admin/reject/:id", async (req, res) => {
  try {

    const payout = await Payout.findById(req.params.id);

    if (!payout) {
      return res.status(404).json({
        success:false,
        message:"Payout not found"
      });
    }

    if (payout.status !== "processing") {
      return res.status(400).json({
        success:false,
        message:"Invalid payout state"
      });
    }

    // 🔥 REJECT → REMOVE REQUEST
    payout.status = "failed";
    payout.failureReason = "Rejected by admin";

    await payout.save();

    res.json({
      success:true,
      message:"Withdraw rejected"
    });

  } catch (err) {

    res.status(500).json({
      success:false,
      message: err.message
    });

  }
});

export default router;