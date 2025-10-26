import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import UserDashboard from "./UserDashboard";
import OwnerDashboard from "./OwnerDashboard";

const DashboardRouter = () => {
  const { user } = useContext(AuthContext);

  // ✅ While user is still being fetched from localStorage, show loading
  if (user === undefined || user === null) {
    return (
      <div style={{ textAlign: "center", marginTop: "3rem" }}>
        <h2>Loading dashboard...</h2>
      </div>
    );
  }

  // ✅ Redirect to login if no user
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Role-based rendering (supports both 'messowner' and 'owner')
  switch (user?.role) {
    case "student":
      return <UserDashboard />;

    case "messowner":
    case "owner": // ✅ added this for your backend
      return <OwnerDashboard />;

    default:
      console.warn("⚠️ Unknown user role:", user.role);
      return <Navigate to="/" replace />;
  }
};

export default DashboardRouter;
