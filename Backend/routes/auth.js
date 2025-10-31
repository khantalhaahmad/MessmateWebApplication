import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import verifyToken from "../middleware/authMiddleware.js"; // ✅ FIXED IMPORT ✅

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
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    try {
      let { name, email, password, role } = req.body;

      // Normalize role
      role = (role || "student").toLowerCase().trim();
      if (role.startsWith("owne")) role = "owner";
      const validRoles = ["student", "owner", "admin"];
      if (!validRoles.includes(role)) role = "student";

      // Check duplicate
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
      });

      // Generate token
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
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }
);

/* ============================================================
   🔐 LOGIN — Secure + Validated
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
      const { identifier, password } = req.body;
      const user = await User.findOne({
        $or: [{ email: identifier }, { name: identifier }],
      });

      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res
          .status(401)
          .json({ success: false, message: "Invalid password" });

      const token = jwt.sign(
        { id: user._id, role: user.role, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
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
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  }
);

/* ============================================================
   🧠 VERIFY TOKEN — Protected Route
   ============================================================ */
router.get("/verify", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json({ success: true, user });
  } catch (error) {
    console.error("💥 Token Verify Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

export default router;
