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
   🧾 REGISTER — Secure + Validated
   ============================================================ */
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Enter a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("role").optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ success: false, message: "Validation failed", errors: errors.array() });
    }

    try {
      let { name, email, password, role } = req.body;

      // Normalize inputs
      email = String(email || "").trim().toLowerCase();
      name = String(name || "").trim();
      role = (role || "student").toLowerCase().trim();

      if (role.startsWith("owne")) role = "owner";
      const validRoles = ["student", "owner", "admin"];
      if (!validRoles.includes(role)) role = "student";

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
      });

      const token = jwt.sign(
        { id: newUser._id, role: newUser.role, name: newUser.name },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(201).json({
        success: true,
        message: "🎉 Registered successfully",
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      });
    } catch (error) {
      console.error("💥 Register Error:", error);
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }
);

/* ============================================================
   🔐 LOGIN — Secure + Normalized + Case-insensitive
   ============================================================ */
router.post(
  "/login",
  [
    body("identifier").notEmpty().withMessage("Email or username required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const rawId = String(req.body.identifier || "").trim();
      const password = String(req.body.password || "");
      const isEmail = rawId.includes("@");

      const identifier = rawId.toLowerCase();
      console.log("🔐 Login attempt:", { identifier, isEmail });

      const query = isEmail
        ? { email: identifier }
        : { name: new RegExp(`^${identifier}$`, "i") };

      const user = await User.findOne(query);
      if (!user)
        return res.status(404).json({ success: false, message: "User not found" });

      const isMatch = await bcrypt.compare(password, user.password || "");
      if (!isMatch)
        return res.status(401).json({ success: false, message: "Invalid password" });

      const token = jwt.sign(
        { id: user._id, role: user.role, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      console.log(`✅ Login successful for user: ${user.email}`);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("💥 Login Error:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }
);

/* ============================================================
   🔥 FIREBASE LOGIN (Google / Facebook / Phone OTP)
   ============================================================ */
router.post("/firebase-login", verifyFirebaseToken, async (req, res) => {
  try {
    const { uid, email, name, picture, phone_number } = req.firebaseUser || {};

    const digits = (phone_number && String(phone_number).replace(/\D/g, "")) || null;
    const pseudoEmail = digits ? `p${digits}@messmate.phone` : null;
    const emailToUse = (email || pseudoEmail || "").trim().toLowerCase();

    if (!emailToUse && !digits) {
      return res.status(400).json({
        success: false,
        message: "Unable to derive identity (no email/phone). Contact support.",
      });
    }

    let user = await User.findOne({
      $or: [
        { firebaseUid: uid },
        ...(emailToUse ? [{ email: emailToUse }] : []),
        ...(digits ? [{ phone: `+${digits}` }, { phone: digits }] : []),
      ],
    });

    // ✅ Capture selected role from frontend
    const roleInput = (req.body.role || "").toLowerCase();
    const validRoles = ["student", "owner"];
    const chosenRole = validRoles.includes(roleInput) ? roleInput : "student";

    if (!user) {
      // 🔹 Create new user with chosen role
      user = await User.create({
        firebaseUid: uid,
        name: (name || (digits ? `User ${digits.slice(-4)}` : "User")).trim(),
        email: emailToUse || undefined,
        phone: digits ? `+${digits}` : undefined,
        role: chosenRole,
        avatar: picture || "",
      });
    } else {
      // 🔹 Update user if missing info or if role changed
      const updates = {};

      if (name && !user.name) updates.name = name.trim();
      if (picture && !user.avatar) updates.avatar = picture;
      if (digits && !user.phone) updates.phone = `+${digits}`;
      if (email && user.email !== email.toLowerCase()) updates.email = email.toLowerCase();

      // ✅ Allow changing student → owner if chosen on frontend
      if (chosenRole === "owner" && user.role !== "owner") {
        updates.role = "owner";
      }

      if (Object.keys(updates).length) {
        await User.updateOne({ _id: user._id }, { $set: updates });
        user = await User.findById(user._id);
      }
    }

    // 🔹 Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Firebase user verified successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("🔥 Firebase Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying Firebase user",
      error: error.message,
    });
  }
});

/* ============================================================
   🧠 VERIFY TOKEN — Protected Route
   ============================================================ */
router.get("/verify", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    console.error("💥 Token Verify Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

export default router;
