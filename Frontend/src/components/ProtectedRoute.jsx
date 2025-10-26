// src/components/ProtectedRoute.jsx
import React, { useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useContext(AuthContext);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // ✅ Check if user and token exist
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && (user || storedUser)) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [user]);

  // 🕒 While verifying authentication (initially)
  if (isAuthenticated === null) {
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "100px",
          fontSize: "1.2rem",
          color: "#555",
        }}
      >
        Checking authentication...
      </div>
    );
  }

  // 🚪 Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // ⚙️ Role-based route guard (optional)
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    console.warn(
      `🚫 Access denied. User role "${user?.role}" not allowed for this route.`
    );
    return <Navigate to="/" replace />;
  }

  // ✅ If authenticated (and authorized), render the protected content
  return children;
};

export default ProtectedRoute;
