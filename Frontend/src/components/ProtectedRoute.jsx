// ✅ src/components/ProtectedRoute.jsx — Fixed & Production-Ready
import React, { useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "../firebase"; // ✅ replaced old 'auth' import

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, loading } = useContext(AuthContext);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [checkingFirebase, setCheckingFirebase] = useState(true);
  const location = useLocation();

  /* ============================================================
     🔐 Sync Firebase User (for Google / OTP / Facebook logins)
  ============================================================ */
  useEffect(() => {
    const auth = getFirebaseAuth(); // ✅ get fresh instance safely
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      setCheckingFirebase(false);
    });
    return () => unsubscribe();
  }, []);

  /* ============================================================
     🕒 Loading States — Show Smooth Loader
  ============================================================ */
  if (loading || checkingFirebase) {
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "25vh",
          fontFamily: "Poppins, sans-serif",
          color: "#264653",
        }}
      >
        <h3>Checking authentication...</h3>
        <div
          style={{
            width: "40px",
            height: "40px",
            margin: "16px auto",
            border: "4px solid #bde0c2",
            borderTop: "4px solid #2a9d8f",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        ></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  /* ============================================================
     🚫 Not Authenticated (no Firebase or backend user)
  ============================================================ */
  if (!user && !firebaseUser) {
    console.warn("🚫 Unauthorized access — redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  /* ============================================================
     ✅ Determine Role (fallback for Firebase-only users)
  ============================================================ */
  const role = (user?.role || "student").toLowerCase();
  const allowed = allowedRoles.map((r) => r.toLowerCase());

  /* ============================================================
     🚫 Access Denied (Role Restricted)
  ============================================================ */
  if (allowed.length > 0 && !allowed.includes(role)) {
    console.warn(`🚫 Access denied for role: ${role}`);
    return <Navigate to="/" replace />;
  }

  /* ============================================================
     ✅ All Good — Render Page
  ============================================================ */
  return children;
};

export default ProtectedRoute;
