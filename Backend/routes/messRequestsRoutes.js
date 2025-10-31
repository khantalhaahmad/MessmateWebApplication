// Backend/routes/messRequestRoutes.js
import express from "express";
import { body, validationResult } from "express-validator";
import MessRequest from "../models/MessRequest.js";
import Mess from "../models/Mess.js";
import verifyToken, { verifyToken as verifyTokenNamed } from "../middleware/auth.js";
import { messRequestUploads, handleMulterErrors } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// pick whichever export style you prefer
const guard = verifyTokenNamed || verifyToken;

/* ============================================================
   🧾 DEBUG LOGGER (optional)
   ============================================================ */
router.use((req, _res, next) => {
  console.log(`➡️ [MessRequest] ${req.method} ${req.originalUrl}`);
  next();
});

/* ============================================================
   📝 SUBMIT NEW MESS REQUEST (Owner)
   ============================================================ */
router.post(
  "/",
  guard,
  handleMulterErrors(messRequestUploads),
  [
    body("name").trim().notEmpty().withMessage("Mess name is required"),
    body("location").trim().notEmpty().withMessage("Location is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("mobile").isLength({ min: 10, max: 10 }).withMessage("Enter a valid 10-digit mobile number"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array(), message: "Validation failed" });
      }

      const { name, location, mobile, email, price_range, offer } = req.body;

      // Parse menu (array or {items:[]})
      let menuItems = [];
      try {
        const parsed = JSON.parse(req.body.menu || "[]");
        if (Array.isArray(parsed)) menuItems = parsed;
        else if (parsed?.items && Array.isArray(parsed.items)) menuItems = parsed.items;
      } catch {
        return res.status(400).json({ success: false, message: "Invalid menu format" });
      }

      // Pull uploaded files
      const bannerFile = req.files?.messBanner?.[0];
      const dishFiles = req.files?.dishImages || [];
      const pancard = req.files?.pancard?.[0]?.path || "";
      const fssai = req.files?.fssai?.[0]?.path || "";
      const menuPhoto = req.files?.menuPhoto?.[0]?.path || "";
      const bankDetails = req.files?.bankDetails?.[0]?.path || "";

      // Pair dish images with menu items by index
      const items = menuItems.map((i, idx) => ({
        name: i.name,
        price: Number(i.price) || 0,
        description: i.description || "",
        isVeg: i.isVeg ?? true,
        imageUrl: dishFiles[idx]?.path || "",          // Cloudinary secure_url
        imagePublicId: dishFiles[idx]?.filename || "", // Cloudinary public_id
      }));

      const doc = await MessRequest.create({
        name,
        location,
        mobile,
        email,
        price_range: price_range || "",
        offer: offer || "",
        messBanner: bannerFile?.path || "",
        menu: { items },
        documents: { pancard, fssai, menuPhoto, bankDetails },
        owner_id: req.user.id,
        status: "pending",
      });

      return res.status(201).json({
        success: true,
        message: "✅ Mess request submitted successfully.",
        messRequest: doc,
      });
    } catch (error) {
      console.error("💥 Submit mess request error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while submitting mess request",
        error: error.message,
      });
    }
  }
);

/* ============================================================
   ✅ APPROVE REQUEST (Admin) — with secure password verification
   ============================================================ */
import bcrypt from "bcryptjs";
import User from "../models/User.js";

router.put("/:id/approve", guard, async (req, res) => {
  try {
    // 🧠 Step 1: Ensure only admin can approve
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admins only" });
    }

    // 🧠 Step 2: Validate admin password input
    const { adminPassword, generatedPassword } = req.body;

    if (!adminPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Admin password is required" });
    }

    // 🧠 Step 3: Fetch admin user from DB
    const adminUser = await User.findById(req.user.id);
    if (!adminUser) {
      return res
        .status(404)
        .json({ success: false, message: "Admin account not found" });
    }

    // 🧠 Step 4: Verify admin password using bcrypt
    const isMatch = await bcrypt.compare(adminPassword, adminUser.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Wrong admin password" });
    }

    // 🧠 Step 5: Find mess request document
    const reqDoc = await MessRequest.findById(req.params.id);
    if (!reqDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Mess request not found" });
    }

    // 🧠 Step 6: Prepare menu items for the new Mess
    const items = (reqDoc.menu?.items || []).map((i) => ({
      name: i.name,
      price: i.price,
      description: i.description,
      isVeg: i.isVeg,
      image: i.imageUrl || "",
    }));

    // 🧠 Step 7: Create new Mess entry
    const mess = await Mess.create({
      name: reqDoc.name,
      location: reqDoc.location,
      price_range: reqDoc.price_range,
      offer: reqDoc.offer,
      owner_id: reqDoc.owner_id,
      rating: 0,
      delivery_time: "30–40 mins",
      banner: reqDoc.messBanner || reqDoc.documents?.menuPhoto || "",
      menu: { items },
      documents: reqDoc.documents || {},
    });

    // 🧠 Step 8: Optional — Update owner password if admin provided one
    if (generatedPassword) {
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);
      await User.findByIdAndUpdate(reqDoc.owner_id, {
        password: hashedPassword,
      });
    }

    // 🧠 Step 9: Delete the approved request
    await reqDoc.deleteOne();

    // 🧠 Step 10: Respond successfully
    return res.json({
      success: true,
      message: generatedPassword
        ? "Mess approved successfully with owner password updated ✅"
        : "Mess approved successfully ✅",
      mess,
    });
  } catch (error) {
    console.error("💥 Approve Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while approving mess",
      error: error.message,
    });
  }
});

/* ============================================================
   ❌ REJECT REQUEST (Admin)
   ============================================================ */
router.put("/:id/reject", guard, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admins only" });
    }
    const reqDoc = await MessRequest.findById(req.params.id);
    if (!reqDoc) return res.status(404).json({ success: false, message: "Request not found" });

    await reqDoc.deleteOne();
    return res.json({ success: true, message: "Mess request rejected" });
  } catch (error) {
    console.error("💥 Reject Error:", error);
    res.status(500).json({ success: false, message: "Failed to reject mess" });
  }
});

export default router;
