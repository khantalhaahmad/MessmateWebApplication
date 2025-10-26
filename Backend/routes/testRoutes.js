// routes/testRoutes.js
import express from "express";
import authMiddleware from "./authMiddleware.js";

const router = express.Router();

// ✅ Public route — no token needed
router.get("/public", (req, res) => {
  res.json({ message: "🟢 Public route works fine — no token needed!" });
});

// 🔒 Protected route — token required
router.get("/protected", authMiddleware, (req, res) => {
  res.json({
    message: "🔐 Protected route accessed successfully!",
    user: req.user, // this shows decoded user info from token
  });
});

export default router;
