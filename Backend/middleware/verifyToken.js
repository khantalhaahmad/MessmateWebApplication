import jwt from "jsonwebtoken";
import admin from "../config/firebaseAdmin.js";
import User from "../models/User.js";

/* ============================================================
   🔐 UNIVERSAL VERIFY TOKEN (Firebase + JWT Compatible)
   ============================================================ */
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token)
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Token missing",
      });

    let decoded = null;
    let dbUser = null;

    /* ============================================================
       🟢 1️⃣ Try verifying Firebase token
       ============================================================ */
    try {
      decoded = await admin.auth().verifyIdToken(token);

      if (decoded?.uid) {
        dbUser = await User.findOne({
          $or: [{ firebaseUid: decoded.uid }, { email: decoded.email }],
        });

        // Link existing user by email if found
        if (dbUser && !dbUser.firebaseUid) {
          dbUser.firebaseUid = decoded.uid;
          await dbUser.save();
          console.log("🔗 Linked firebaseUid to existing user:", dbUser._id);
        }

        // Create new user if not found
        if (!dbUser) {
          dbUser = await User.create({
            firebaseUid: decoded.uid,
            name: decoded.name || decoded.email || "Firebase User",
            email: decoded.email || "no-email@firebase.com",
            role: "student",
          });
          console.log("🆕 Created new Firebase user:", dbUser._id);
        }

        req.user = {
          id: dbUser._id.toString(),
          uid: decoded.uid,
          role: dbUser.role,
          name: dbUser.name,
          email: dbUser.email,
          source: "firebase",
        };
        return next();
      }
    } catch (firebaseErr) {
      console.log("⚠️ Not a Firebase token, trying JWT...");
    }

    /* ============================================================
       🟠 2️⃣ Try verifying backend JWT token
       ============================================================ */
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      dbUser = await User.findById(decoded.id);

      if (!dbUser) {
        dbUser = await User.create({
          _id: decoded.id,
          name: decoded.name || "JWT User",
          email: decoded.email || "unknown@user.com",
          role: decoded.role || "student",
        });
        console.log("🆕 Created missing JWT user:", dbUser._id);
      }

      req.user = {
        id: dbUser._id.toString(),
        role: dbUser.role,
        name: dbUser.name,
        email: dbUser.email,
        source: "jwt",
      };
      return next();
    } catch (jwtErr) {
      console.error("💥 JWT verify error:", jwtErr.message);
      return res.status(401).json({
        success: false,
        message:
          jwtErr.name === "TokenExpiredError"
            ? "Session expired. Please log in again."
            : "Invalid token. Authentication failed.",
      });
    }
  } catch (error) {
    console.error("💥 verifyToken general error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export default verifyToken;
