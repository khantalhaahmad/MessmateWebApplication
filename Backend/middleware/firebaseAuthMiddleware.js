// ✅ Backend/middleware/firebaseAuthMiddleware.js
import admin from "../config/firebaseAdmin.js";

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Missing Firebase ID token",
      });
    }

    const idToken = authHeader.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    if (!decodedToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid Firebase token",
      });
    }

    // ✅ Attach Firebase user to request
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    console.error("🔥 Firebase token verification failed:", error.message);
    return res.status(401).json({
      success: false,
      message: "Firebase authentication failed",
      error: error.message,
    });
  }
};

export default verifyFirebaseToken;
