import jwt from "jsonwebtoken";

/* ============================================================
   🔐 VERIFY TOKEN MIDDLEWARE (Production-safe)
   ============================================================ */
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Token missing",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Role check: must exist in token
    if (!decoded.role) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Role missing in token",
      });
    }

    req.user = {
      id: decoded.id || decoded._id,
      role: decoded.role,
      name: decoded.name || "User",
      email: decoded.email || "unknown",
    };

    next();
  } catch (error) {
    console.error("💥 Token verify error:", error.message);
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ success: false, message: "Session expired. Please log in again." });
    }
    if (error.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token. Authentication failed." });
    }
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};

export default verifyToken;
