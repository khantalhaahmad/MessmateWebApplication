import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "25vh" }}>
        <h3>Loading authentication...</h3>
      </div>
    );
  }

  if (!user) {
    console.warn("🚫 No user found — redirecting to login");
    return <Navigate to="/login" replace />;
  }

  const role = (user.role || "").toLowerCase();
  const allowed = allowedRoles?.map((r) => r.toLowerCase()) || [];

  if (allowed.length > 0 && !allowed.includes(role)) {
    console.warn(`🚫 Access denied for role: ${user.role}`);
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
