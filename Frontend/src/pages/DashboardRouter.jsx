import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import UserDashboard from "./UserDashboard";
import OwnerDashboard from "./OwnerDashboard";
import AdminDashboard from "./AdminDashboard";
import ErrorBoundary from "../components/ErrorBoundary";

const DashboardRouter = () => {
  const { user, loading } = useContext(AuthContext);

  console.log("🔍 DashboardRouter: user =", user);
  console.log("🔍 DashboardRouter: loading =", loading);

  if (loading)
    return (
      <div style={{ textAlign: "center", marginTop: "30vh" }}>
        <h2>Loading dashboard...</h2>
      </div>
    );

  if (!user) {
    console.warn("🚫 No user found — redirecting to login");
    return <Navigate to="/login" replace />;
  }

  const role = user?.role?.toLowerCase();
  console.log("🧩 Logged-in Role:", role);

  return (
    <ErrorBoundary>
      {role === "student" && <UserDashboard />}
      {(role === "owner" || role === "messowner") && <OwnerDashboard />}
      {role === "admin" && <AdminDashboard />}
      {!["student", "owner", "messowner", "admin"].includes(role) && (
        <div style={{ textAlign: "center", marginTop: "20vh", color: "orange" }}>
          <h2>⚠️ Unknown Role</h2>
          <p>Your account role is not recognized.</p>
        </div>
      )}
    </ErrorBoundary>
  );
};

export default DashboardRouter;
