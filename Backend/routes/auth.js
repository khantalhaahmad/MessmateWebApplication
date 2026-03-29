import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import verifyToken from "../middleware/authMiddleware.js";
import verifyFirebaseToken from "../middleware/firebaseAuthMiddleware.js";

const router = express.Router();

/* ============================================================
   🧾 REGISTER — ADMIN ONLY
============================================================ */
router.post(
  "/register",
  [
    body("name").trim().notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      let { name, email, password } = req.body;

      email = email.toLowerCase().trim();
      name = name.trim();

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Admin exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const adminUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "admin",
      });

      const token = jwt.sign(
        {
          id: adminUser._id,
          role: adminUser.role,
          phone: adminUser.phone || null,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(201).json({
        success: true,
        token,
        user: adminUser,
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false });
    }
  }
);

/* ============================================================
   🔐 ADMIN LOGIN
============================================================ */
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const user = await User.findOne({
      role: "admin",
      $or: [{ email: identifier }, { phone: identifier }],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        phone: user.phone || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

/* ============================================================
   🔥 FIREBASE LOGIN (OTP BASED — FINAL FIX)
============================================================ */
router.post("/firebase-login", verifyFirebaseToken, async (req, res) => {
  try {
    const { uid, email, name, picture, phone_number } = req.firebaseUser || {};

    const digits = phone_number && String(phone_number).replace(/\D/g, "");
    const normalizedPhone = digits ? `+${digits}` : undefined;
    const normalizedEmail = email ? email.toLowerCase() : undefined;

    if (!normalizedPhone && !normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Phone or email required",
      });
    }

    /* ============================================================
       🔍 FIND USER BY PHONE (ONLY)
    ============================================================ */
    let user = await User.findOne({
      ...(normalizedPhone && {
        phone: { $regex: normalizedPhone.slice(-10) + "$" }
      })
    });

    /* ============================================================
       🔗 SAFE FIREBASE UID LINKING
    ============================================================ */
    if (user && !user.firebaseUid) {
      const existing = await User.findOne({ firebaseUid: uid });

      if (!existing) {
        user.firebaseUid = uid;
        await user.save();
        console.log("🔗 Firebase UID linked");
      } else {
        console.log("⚠️ Firebase UID already linked to another user");
      }
    }

    /* ============================================================
       👤 CREATE USER IF NOT EXISTS
    ============================================================ */
    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        name: name || "User",
        phone: normalizedPhone,
        email: normalizedEmail,
        role: "student", // ✅ backend decides role later
        avatar: picture || "",
      });
    }

    /* ============================================================
       🔄 SAFE UPDATE (NO DUPLICATE UID)
    ============================================================ */
    else {
      const updates = {};

      // 🔥 SAFE UID UPDATE
      if (!user.firebaseUid) {
        const existing = await User.findOne({ firebaseUid: uid });

        if (!existing) {
          updates.firebaseUid = uid;
        } else {
          console.log("⚠️ Skipping firebaseUid update (already exists)");
        }
      }

      if (!user.phone && normalizedPhone) updates.phone = normalizedPhone;
      if (!user.email && normalizedEmail) updates.email = normalizedEmail;
      if (!user.name && name) updates.name = name;
      if (!user.avatar && picture) updates.avatar = picture;

      // 🔥 FINAL SAFETY CHECK
      if (updates.firebaseUid) {
        const existing = await User.findOne({ firebaseUid: updates.firebaseUid });
        if (existing && existing._id.toString() !== user._id.toString()) {
          delete updates.firebaseUid;
        }
      }

      if (Object.keys(updates).length) {
        await User.updateOne({ _id: user._id }, { $set: updates });
        user = await User.findById(user._id);
      }
    }

    /* ============================================================
       🔐 TOKEN
    ============================================================ */
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        phone: user.phone,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    /* ============================================================
       🚀 RESPONSE
    ============================================================ */
    res.json({
      success: true,
      message: "Login successful",
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
    console.error("🔥 Firebase login error:", error);
    res.status(500).json({
      success: false,
      message: "Firebase authentication failed",
    });
  }
});

/* ============================================================
   🧠 VERIFY TOKEN
============================================================ */
router.get("/verify", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false });
    }

    res.json({ success: true, user });

  } catch (error) {
    res.status(500).json({ success: false });
  }
});

export default router;