// jobs/payoutJob.js

import cron from "node-cron";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Payout from "../models/Payout.js";
import Mess from "../models/Mess.js";
import { getSettlementCycle } from "../utils/getSettlementCycle.js";

/* ============================================================
   🕒 WEEKLY PAYOUT JOB (WEDNESDAY 2 AM)
============================================================ */

cron.schedule("0 2 * * 3", async () => {
  console.log("🚀 Running Weekly Payout Job...");

  try {

    /* ============================================================
       👤 GET ALL VENDORS
    ============================================================ */

    const vendors = await User.find({ role: "owner", isActive: true });

    for (const vendor of vendors) {

      try {

        /* ============================================================
           🏪 FIND VENDOR MESSES
        ============================================================ */

        const messes = await Mess.find({ owner_id: vendor._id });
        const messIds = messes.map(m => m._id.toString());

        if (messIds.length === 0) continue;

        /* ============================================================
           📦 GET UNPAID ORDERS
        ============================================================ */

        const orders = await Order.find({
          mess_id: { $in: messIds },
          status: "delivered",
          payoutStatus: "pending"
        });

        if (!orders.length) continue;

        /* ============================================================
           💰 CALCULATE TOTALS
        ============================================================ */

        let totalAmount = 0;
        let totalCommission = 0;
        let totalRevenue = 0;

        orders.forEach(order => {
          totalAmount += order.vendorEarning || 0;
          totalCommission += order.platformCommission || 0;
          totalRevenue += order.total_price || 0;
        });

        if (totalAmount <= 0) continue;

        /* ============================================================
           ⚙️ CHECK MANUAL REQUEST
        ============================================================ */

        const manualPayout = await Payout.findOne({
          vendorId: vendor._id,
          payoutMethod: "manual",
          status: "pending"
        });

        let payoutAmount = totalAmount;
        let payoutMethod = "auto";

        if (manualPayout) {
          payoutAmount = manualPayout.amount;
          payoutMethod = "manual";
        }

        /* ============================================================
           🏦 CREATE PAYOUT ENTRY
        ============================================================ */

        const payout = await Payout.create({
          vendorId: vendor._id,
          messId: messIds[0],
          messName: messes[0]?.name || "",
          ownerName: vendor.name,
          ownerEmail: vendor.email,

          amount: payoutAmount,

          orders: orders.map(o => o._id),

          totalOrders: orders.length,
          totalRevenue,
          totalCommission,

          payoutMethod,
          status: "processing",

          settlementCycle: getSettlementCycle(),

          bankDetailsSnapshot: vendor.bankDetails,

          requestedAt: new Date()
        });

        /* ============================================================
           🧾 MARK ORDERS AS PAID
        ============================================================ */

        await Order.updateMany(
          { _id: { $in: orders.map(o => o._id) } },
          { payoutStatus: "paid" }
        );

        /* ============================================================
           💰 UPDATE USER WALLET
        ============================================================ */

        if (payoutMethod === "manual") {
          vendor.pendingPayout -= payoutAmount;
        }

        vendor.walletBalance = 0;
        vendor.totalPayout += payoutAmount;

        await vendor.save();

        /* ============================================================
           ✅ MARK PAYOUT COMPLETED (SIMULATION)
        ============================================================ */

        payout.status = "completed";
        payout.paidAt = new Date();

        await payout.save();

        console.log(`✅ Paid ₹${payoutAmount} to vendor ${vendor._id}`);

      } catch (vendorErr) {
        console.error(`❌ Vendor payout error (${vendor._id}):`, vendorErr.message);
      }
    }

    console.log("✅ Weekly payout job completed");

  } catch (err) {
    console.error("❌ Payout job failed:", err.message);
  }
});