// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

/**
 * 🔒 Auth Middleware (Production Version)
 * - Verifies JWT from Authorization header
 * - Attaches sanitized user object to req.user
 * - Handles expired / invalid tokens cleanly
 */
const authMiddleware = async (req, res, next) => {
  try {
    // ✅ 1. Ensure Authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access: No token provided.",
      });
    }

    // ✅ 2. Extract and verify JWT
    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Session expired. Please log in again.",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // ✅ 3. Fetch user from DB (ensures user still exists)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or account removed.",
      });
    }

    // ✅ 4. Attach user to request object
    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // ✅ 5. Proceed to next middleware or route
    next();
  } catch (error) {
    console.error("❌ [Auth Middleware Error]:", error.message);
    res.status(500).json({
      success: false,
      message: "Authentication failed due to a server error.",
    });
  }
};

export default authMiddleware;
