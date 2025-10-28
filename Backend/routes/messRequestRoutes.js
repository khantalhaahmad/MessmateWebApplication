// ✅ routes/messRequestRoutes.js — Market-Launch Final Version (Fixed)
import express from "express";
import { body, validationResult } from "express-validator";
import MessRequest from "../models/MessRequest.js";
import Mess from "../models/Mess.js";
import { verifyToken } from "../middleware/auth.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

/* ============================================================
   🧾 DEBUG LOGGER
   ============================================================ */
router.use((req, res, next) => {
  console.log(`➡️ [MessRequestRoute] ${req.method} ${req.originalUrl}`);
  next();
});

/* ============================================================
   📝 SUBMIT NEW MESS REQUEST (Owner)
   ============================================================ */
router.post(
  "/",
  verifyToken,
  // ✅ Multer first (so req.body is populated)
  upload.fields([
    { name: "pancard", maxCount: 1 },
    { name: "fssai", maxCount: 1 },
    { name: "menuPhoto", maxCount: 1 },
    { name: "bankDetails", maxCount: 1 },
  ]),
  // ✅ Validators after Multer
  [
    body("name").notEmpty().withMessage("Mess name is required"),
    body("location").notEmpty().withMessage("Location is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("mobile")
      .isLength({ min: 10 })
      .withMessage("Enter a valid 10-digit mobile number"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("❌ Validation errors:", errors.array());
        return res
          .status(400)
          .json({ success: false, errors: errors.array(), message: "Validation failed" });
      }

      console.log("📥 Incoming body:", req.body);

      const { name, location, mobile, email, price_range, offer } = req.body;

      /* ============================================================
         🍱 Parse Menu
         ============================================================ */
      let menuItems = [];
      try {
        const parsed = JSON.parse(req.body.menu || "[]");
        if (Array.isArray(parsed)) menuItems = parsed;
        else if (parsed.items && Array.isArray(parsed.items))
          menuItems = parsed.items;
      } catch (err) {
        console.error("💥 Menu JSON Parse Error:", err.message);
        return res
          .status(400)
          .json({ success: false, message: "Invalid menu format" });
      }

      /* ============================================================
         💾 Create New Mess Request
         ============================================================ */
      const messRequest = await MessRequest.create({
        name,
        location,
        mobile,
        email,
        price_range,
        offer,
        pancard: req.files?.pancard?.[0]?.path || "",
        fssai: req.files?.fssai?.[0]?.path || "",
        menuPhoto: req.files?.menuPhoto?.[0]?.path || "",
        bankDetails: req.files?.bankDetails?.[0]?.path || "",
        menu: { items: menuItems.map((i) => ({
          name: i.name,
          price: Number(i.price) || 0,
          description: i.description || "Delicious homemade food",
          isVeg: i.isVeg ?? true,
        })) },
        owner_id: req.user.id,
        status: "pending",
      });

      console.log("✅ Mess request saved:", messRequest._id);

      return res.status(201).json({
        success: true,
        message: "✅ Mess request submitted successfully.",
        messRequest,
      });
    } catch (error) {
      console.error("💥 Error submitting mess request:", error);
      res.status(500).json({
        success: false,
        message: "Server error while submitting mess request",
        error: error.message,
      });
    }
  }
);

/* ============================================================
   ✅ APPROVE REQUEST (Admin)
   ============================================================ */
router.put("/:id/approve", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Admins only" });

    const messRequest = await MessRequest.findById(req.params.id);
    if (!messRequest)
      return res.status(404).json({ message: "Request not found" });

    const data = messRequest.toObject();
    const newMess = await Mess.create({
      name: data.name,
      location: data.location,
      price_range: data.price_range,
      offer: data.offer,
      owner_id: data.owner_id,
      image: data.menuPhoto || data.pancard || "",
      menu: data.menu,
      rating: 0,
      delivery_time: "30–40 mins",
    });

    await messRequest.deleteOne();
    console.log("✅ Approved Mess:", newMess._id);
    res.json({
      success: true,
      message: "Mess approved successfully",
      mess: newMess,
    });
  } catch (error) {
    console.error("💥 Approve Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to approve mess" });
  }
});

/* ============================================================
   ❌ REJECT REQUEST (Admin)
   ============================================================ */
router.put("/:id/reject", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Admins only" });

    const messRequest = await MessRequest.findById(req.params.id);
    if (!messRequest)
      return res.status(404).json({ message: "Request not found" });

    await messRequest.deleteOne();
    console.log("❌ Mess request rejected:", req.params.id);
    res.json({ success: true, message: "Mess request rejected" });
  } catch (error) {
    console.error("💥 Reject Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to reject mess" });
  }
});

export default router;
