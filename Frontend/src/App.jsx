import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./Context/AuthContext";
import { CartProvider } from "./Context/CartContext";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import AddMessForm from "./components/AddMessForm";
import FloatingButtons from "./components/FloatingButtons";
import Footer from "./components/Footer";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DashboardRouter from "./pages/DashboardRouter";
import MessMenu from "./pages/MessMenu";
import Checkout from "./pages/Checkout";
import DeliveryJoin from "./pages/DeliveryJoin";
import DeliveryPartners from "./pages/DeliveryPartners";
import PartnerLanding from "./pages/PartnerLanding";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminStudents from "./pages/AdminStudents";
import AdminOwners from "./pages/AdminOwners";
import AdminRevenueReport from "./pages/AdminRevenueReport";
import AdminDeliveryAgents from "./pages/AdminDeliveryAgents";

// Info Pages
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Security from "./pages/Security";
import TermsOfService from "./pages/TermsOfService";
import HelpSupport from "./pages/HelpSupport";
import ReportFraud from "./pages/ReportFraud";
import Blog from "./pages/Blog";

function App() {
  const location = useLocation();

  // ✅ Show footer only on UI/home pages
  const showFooterRoutes = ["/", "/messes", "/checkout"];
  const shouldShowFooter = showFooterRoutes.some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <AuthProvider>
      <CartProvider>
        <FloatingButtons />
        <main>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Mess */}
            <Route path="/messes/:mess_id" element={<MessMenu />} />
            <Route path="/checkout" element={<Checkout />} />

            {/* Delivery */}
            <Route path="/delivery-partners" element={<DeliveryPartners />} />
            <Route path="/delivery-join" element={<DeliveryJoin />} />

            {/* Partner */}
            <Route path="/partner-with-us" element={<PartnerLanding />} />
            <Route path="/addmess" element={<AddMessForm />} />

            {/* Dashboards */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["student", "owner", "messowner"]}>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />

            {/* Admin */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/delivery-agents"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDeliveryAgents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/owners"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminOwners />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/revenue-report"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminRevenueReport />
                </ProtectedRoute>
              }
            />

            {/* Info Pages */}
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/security" element={<Security />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/help-support" element={<HelpSupport />} />
            <Route path="/report-fraud" element={<ReportFraud />} />
            <Route path="/blog" element={<Blog />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* ✅ Render footer ONLY on homepage/UI routes */}
        {shouldShowFooter && <Footer />}
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
