// routes/messRequestRoutes.js
import express from "express";
import MessRequest from "../models/MessRequest.js";
import Mess from "../models/Mess.js";
import { verifyToken } from "../middleware/auth.js";
import upload from "../middleware/uploadMiddleware.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

/* ==============================================
   ✅ SUBMIT NEW MESS REQUEST (with Cloudinary Upload)
   ============================================== */
router.post(
  "/",
  verifyToken,
  upload.fields([
    { name: "pancard", maxCount: 1 },
    { name: "fssai", maxCount: 1 },
    { name: "menuPhoto", maxCount: 1 },
    { name: "bankDetails", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { name, location, mobile, email, price_range, offer, menu } = req.body;

      if (!name || !location || !mobile || !email || !menu) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }

      // ✅ Verify Cloudinary uploads
      console.log("📸 Uploaded files:", req.files);

      let parsedMenu;
      try {
        parsedMenu = JSON.parse(menu);
        if (!Array.isArray(parsedMenu.items)) throw new Error("Menu items missing");
      } catch (err) {
        console.error("Invalid menu JSON:", err.message);
        return res.status(400).json({ success: false, message: "Invalid menu format" });
      }

      const pancardUrl = req.files?.pancard?.[0]?.path || "";
      const fssaiUrl = req.files?.fssai?.[0]?.path || "";
      const menuPhotoUrl = req.files?.menuPhoto?.[0]?.path || "";
      const bankDetailsUrl = req.files?.bankDetails?.[0]?.path || "";

      const messRequest = await MessRequest.create({
        name,
        location,
        mobile,
        email,
        price_range,
        offer,
        pancard: pancardUrl,
        fssai: fssaiUrl,
        menuPhoto: menuPhotoUrl,
        bankDetails: bankDetailsUrl,
        menu: {
          items: parsedMenu.items.map((i) => ({
            name: i.name,
            price: Number(i.price) || 0,
            image: i.image || "",
            description: i.description || "Delicious homemade food",
            isVeg: i.isVeg ?? true,
          })),
        },
        owner_id: req.user.id,
        status: "pending",
      });

      console.log("✅ Mess request stored successfully:", messRequest._id);

      res.status(201).json({
        success: true,
        message: "✅ Mess request submitted successfully!",
        messRequest,
      });
    } catch (error) {
      console.error("💥 Error submitting mess request:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit mess request.",
        error: error.message,
      });
    }
  }
);

/* ==============================================
   ✅ APPROVE REQUEST (Admin Only)
   ============================================== */
router.put("/:id/approve", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admins only." });
    }

    const messRequest = await MessRequest.findById(req.params.id).populate(
      "owner_id",
      "name email"
    );

    if (!messRequest) return res.status(404).json({ message: "Request not found" });

    const newMess = await Mess.create({
      name: messRequest.name,
      location: messRequest.location,
      menu: messRequest.menu,
      price_range: messRequest.price_range,
      offer: messRequest.offer,
      mobile: messRequest.mobile,
      email: messRequest.email,
      pancard: messRequest.pancard,
      fssai: messRequest.fssai,
      menuPhoto: messRequest.menuPhoto,
      bankDetails: messRequest.bankDetails,
      owner_id: messRequest.owner_id,
      rating: 0,
      delivery_time: "30–40 mins",
    });

    await messRequest.deleteOne();
    res.status(200).json({
      success: true,
      message: "✅ Mess approved and added successfully!",
      mess: newMess,
    });
  } catch (error) {
    console.error("💥 Error approving mess:", error);
    res.status(500).json({ success: false, message: "Failed to approve mess request." });
  }
});

/* ==============================================
   ❌ REJECT REQUEST (Admin Only)
   ============================================== */
router.put("/:id/reject", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admins only." });

    const messRequest = await MessRequest.findById(req.params.id);
    if (!messRequest) return res.status(404).json({ message: "Request not found" });

    await messRequest.deleteOne();

    res.status(200).json({
      success: true,
      message: "❌ Mess request rejected and removed from database.",
    });
  } catch (error) {
    console.error("💥 Error rejecting mess request:", error);
    res.status(500).json({ success: false, message: "Failed to reject request" });
  }
});

export default router;
