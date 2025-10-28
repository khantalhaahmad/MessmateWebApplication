// ✅ src/App.jsx — Optimized with Lazy Loading, Spinner & Clean Suspense
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./Context/AuthContext";
import { CartProvider } from "./Context/CartContext";
import ProtectedRoute from "./components/ProtectedRoute";
import FloatingButtons from "./components/FloatingButtons";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";

// 💤 Lazy-Loaded Pages (Main)
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const DashboardRouter = lazy(() => import("./pages/DashboardRouter"));
const MessMenu = lazy(() => import("./pages/MessMenu"));
const Checkout = lazy(() => import("./pages/Checkout"));
const DeliveryJoin = lazy(() => import("./pages/DeliveryJoin"));
const DeliveryPartners = lazy(() => import("./pages/DeliveryPartners"));
const PartnerLanding = lazy(() => import("./pages/PartnerLanding"));
const AddMessForm = lazy(() => import("./components/AddMessForm"));

// 🧑‍💼 Admin Pages
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminStudents = lazy(() => import("./pages/AdminStudents"));
const AdminOwners = lazy(() => import("./pages/AdminOwners"));
const AdminRevenueReport = lazy(() => import("./pages/AdminRevenueReport"));
const AdminDeliveryAgents = lazy(() => import("./pages/AdminDeliveryAgents"));

// 📄 Info / Static Pages
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Security = lazy(() => import("./pages/Security"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const HelpSupport = lazy(() => import("./pages/HelpSupport"));
const ReportFraud = lazy(() => import("./pages/ReportFraud"));
const Blog = lazy(() => import("./pages/Blog"));

// 🌀 Custom Fallback Loader
const Loader = () => (
  <div className="loading-screen">
    <div className="spinner"></div>
    <p>Loading, please wait...</p>
  </div>
);

function App() {
  const location = useLocation();

  // 🦶 Hide footer on dashboards, login/signup/admin pages
  const noFooterRoutes = ["/login", "/signup", "/dashboard", "/admin"];
  const shouldShowFooter = !noFooterRoutes.some((r) =>
    location.pathname.startsWith(r)
  );

  return (
    <AuthProvider>
      <CartProvider>
        <FloatingButtons />
        <main>
          <ErrorBoundary>
            <Suspense fallback={<Loader />}>
              <Routes>
                {/* 🌐 Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/messes/:mess_id" element={<MessMenu />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/delivery-partners" element={<DeliveryPartners />} />
                <Route path="/delivery-join" element={<DeliveryJoin />} />
                <Route path="/partner-with-us" element={<PartnerLanding />} />
                <Route path="/addmess" element={<AddMessForm />} />

                {/* 👨‍🎓 Authenticated User / Owner Dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["student", "owner", "messowner"]}>
                      <DashboardRouter />
                    </ProtectedRoute>
                  }
                />

                {/* 🧑‍💼 Admin Routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminDashboard />
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
                <Route
                  path="/admin/delivery-agents"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminDeliveryAgents />
                    </ProtectedRoute>
                  }
                />

                {/* 📄 Info Pages */}
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/security" element={<Security />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/help-support" element={<HelpSupport />} />
                <Route path="/report-fraud" element={<ReportFraud />} />
                <Route path="/blog" element={<Blog />} />

                {/* 🚫 Catch-All Redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
        {shouldShowFooter && <Footer />}
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
