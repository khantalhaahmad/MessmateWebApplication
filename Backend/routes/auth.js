import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import verifyToken from "../middleware/authMiddleware.js";
import verifyFirebaseToken from "../middleware/firebaseAuthMiddleware.js";

console.log("✅ Auth routes file loaded successfully");

const router = express.Router();

/* ============================================================
   🧾 REGISTER — ADMIN ONLY (Email + Password)
   ============================================================ */
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Enter a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    try {
      let { name, email, password } = req.body;

      email = email.toLowerCase().trim();
      name = name.trim();

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Admin already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const adminUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "admin", // 🔒 ADMIN ONLY
      });

      const token = jwt.sign(
        { id: adminUser._id, role: adminUser.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(201).json({
        success: true,
        message: "Admin registered successfully",
        token,
        user: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
        },
      });
    } catch (error) {
      console.error("💥 Admin Register Error:", error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }
  }
);

/* ============================================================
   🔐 LOGIN — ADMIN ONLY (Email + Password) [DEBUG ENABLED]
   ============================================================ */
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    console.log("🟡 ADMIN LOGIN HIT");
    console.log("📥 Raw req.body:", req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn("❌ Validation failed:", errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    try {
      const email = String(req.body.email || "").toLowerCase().trim();
      const password = String(req.body.password || "");

      console.log("📧 Parsed Email:", email);
      console.log("🔑 Password received:", password ? "YES" : "NO");

      // 🔍 Find admin
      const user = await User.findOne({ email, role: "admin" });
      console.log("👤 Admin found:", user ? "YES" : "NO");

      if (!user) {
        console.warn("❌ Admin not found in DB");
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }

      // 🔐 Password compare
      const isMatch = await bcrypt.compare(password, user.password);
      console.log("🔐 Password match:", isMatch);

      if (!isMatch) {
        console.warn("❌ Password mismatch");
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // 🎫 Generate token
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      console.log("✅ ADMIN LOGIN SUCCESS:", {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      return res.json({
        success: true,
        message: "Admin login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("💥 ADMIN LOGIN SERVER ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }
);

/* ============================================================
   🔥 FIREBASE LOGIN — PHONE / GOOGLE / FACEBOOK
   🔒 ROLE DECISION = BACKEND ONLY
   ============================================================ */
router.post("/firebase-login", verifyFirebaseToken, async (req, res) => {
  try {
    const { uid, email, name, picture, phone_number } = req.firebaseUser || {};

    const digits =
      phone_number && String(phone_number).replace(/\D/g, "");

    if (!digits && !email) {
      return res.status(400).json({
        success: false,
        message: "Phone or email required from Firebase",
      });
    }

    const normalizedPhone = digits ? `+${digits}` : undefined;
    const normalizedEmail = email ? email.toLowerCase() : undefined;

    let user = await User.findOne({
      $or: [
        { firebaseUid: uid },
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
        ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
      ],
    });

    // 🔒 FIRST TIME USER → STUDENT ONLY
    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        name:
          name?.trim() ||
          (digits ? `User ${digits.slice(-4)}` : "User"),
        email: normalizedEmail,
        phone: normalizedPhone,
        role: "student", // 🔥 HARD RULE
        avatar: picture || "",
      });
    } else {
      // Update missing profile info ONLY (NO ROLE CHANGE)
      const updates = {};

      if (!user.phone && normalizedPhone) updates.phone = normalizedPhone;
      if (!user.email && normalizedEmail) updates.email = normalizedEmail;
      if (!user.name && name) updates.name = name.trim();
      if (!user.avatar && picture) updates.avatar = picture;

      if (Object.keys(updates).length) {
        await User.updateOne({ _id: user._id }, { $set: updates });
        user = await User.findById(user._id);
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Firebase login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("🔥 Firebase Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Firebase authentication failed",
    });
  }
});

/* ============================================================
   🧠 VERIFY TOKEN — Protected Route
   ============================================================ */
router.get("/verify", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error("💥 Token Verify Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

export default router;