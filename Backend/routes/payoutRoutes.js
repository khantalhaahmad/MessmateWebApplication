import express from "express";
import Payout from "../models/Payout.js";

const router = express.Router();

/* ============================
   💰 GET WALLET (FINAL FIXED)
============================ */

router.get("/wallet", async (req, res) => {
  try {

    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    /* ============================
       📦 FETCH PAYOUTS
    ============================ */

    const payouts = await Payout.find({
      vendorId: userId
    });

    let wallet = 0;
    let pending = 0;
    let paid = 0;

    payouts.forEach(p => {

      if (p.status === "pending") {
        wallet += p.amount;
        pending += p.amount;
      }

      if (p.status === "completed") {
        paid += p.amount;
      }

    });

    res.json({
      success: true,
      wallet,
      pending,
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

/* ============================
   📤 WITHDRAW REQUEST
============================ */

router.post("/withdraw", async (req, res) => {

  try {

    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({
        success:false,
        message:"userId and amount required"
      });
    }

    // 🔥 check wallet from payouts
    const payouts = await Payout.find({ vendorId: userId });

    let wallet = 0;

    payouts.forEach(p => {
      if (p.status === "pending") {
        wallet += p.amount;
      }
    });

    if (wallet < amount) {
      return res.status(400).json({
        success:false,
        message:"Insufficient balance"
      });
    }

    // 🔥 create withdraw payout
    await Payout.create({
      vendorId: userId,
      amount: amount,
      payoutMethod: "manual",
      status: "processing"
    });

    res.json({
      success:true,
      message:"Withdraw request created"
    });

  } catch (err) {

    console.error("Withdraw error:", err);

    res.status(500).json({
      success:false,
      message: err.message
    });

  }

});

export default router;