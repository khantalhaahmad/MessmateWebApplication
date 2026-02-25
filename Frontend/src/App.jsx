// ✅ src/App.jsx — FINAL (Floating-only Home + Global Auth Drawer)
import React, { Suspense, lazy, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  matchPath,
} from "react-router-dom";
import Lenis from "@studio-freight/lenis";

import { AuthProvider } from "./Context/AuthContext";
import { CartProvider } from "./Context/CartContext";

import Navbar from "./components/Navbar";                 // ✅ Navbar
import FloatingButtons from "./components/FloatingButtons";
import AuthDrawerProvider from "./components/AuthDrawerProvider"; // ✅ NEW
import ProtectedRoute from "./components/ProtectedRoute";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";

// 🧩 Global responsive helpers
import "./styles/responsive.css";

// 💤 Lazy-loaded pages
const Home = lazy(() => import("./pages/Home"));
const DashboardRouter = lazy(() => import("./pages/DashboardRouter"));
const MessMenu = lazy(() => import("./pages/MessMenu"));
const Checkout = lazy(() => import("./pages/Checkout"));
const DeliveryJoin = lazy(() => import("./pages/DeliveryJoin"));
const DeliveryPartners = lazy(() => import("./pages/DeliveryPartners"));
const PartnerLanding = lazy(() => import("./pages/PartnerLanding"));
const AddMessForm = lazy(() => import("./components/AddMessForm"));

// 🧑‍💼 Admin
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminStudents = lazy(() => import("./pages/AdminStudents"));
const AdminOwners = lazy(() => import("./pages/AdminOwners"));
const AdminRevenueReport = lazy(() => import("./pages/AdminRevenueReport"));
const AdminDeliveryAgents = lazy(() => import("./pages/AdminDeliveryAgents"));

// 📄 Info pages
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Security = lazy(() => import("./pages/Security"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const HelpSupport = lazy(() => import("./pages/HelpSupport"));
const ReportFraud = lazy(() => import("./pages/ReportFraud"));
const Blog = lazy(() => import("./pages/Blog"));

// 🌀 Loader
const Loader = () => (
  <div className="loading-screen">
    <div className="spinner" />
    <p>Loading, please wait...</p>
  </div>
);

function App() {
  const location = useLocation();

  /* ✅ Lenis smooth scroll */
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.3,
      smooth: true,
      direction: "vertical",
      gestureDirection: "vertical",
      smoothTouch: false,
    });

    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  /* 🚫 Footer hide rules */
  const noFooterRoutes = ["/dashboard", "/admin", "/checkout", "/messes"];
  const shouldShowFooter = !noFooterRoutes.some((path) =>
    location.pathname.startsWith(path)
  );

  /* 🟢 Home detection */
  const isHome = location.pathname === "/";

  /* 🎯 Mess menu floating buttons */
  const isMessMenuPage = matchPath("/messes/:mess_id", location.pathname);

  return (
    <AuthProvider>
      <CartProvider>

        {/* 🔥 GLOBAL AUTH DRAWER (works everywhere) */}
        <AuthDrawerProvider />

        {/* ❌ Home par Navbar nahi */}
        {!isHome && <Navbar />}

        {/* ✅ Home par sirf Floating Login / Signup */}
        {isHome && <FloatingButtons />}

        {/* (optional) mess menu floating buttons */}
        {isMessMenuPage && <FloatingButtons />}

        <main className="app-main">
          <ErrorBoundary>
            <Suspense fallback={<Loader />}>
              <Routes>
                {/* 🌍 Public */}
                <Route path="/" element={<Home />} />
                <Route path="/messes/:mess_id" element={<MessMenu />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/delivery-partners" element={<DeliveryPartners />} />
                <Route path="/delivery-join" element={<DeliveryJoin />} />
                <Route path="/partner-with-us" element={<PartnerLanding />} />
                <Route path="/addmess" element={<AddMessForm />} />

                {/* 👨‍🎓 Dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["student", "owner", "messowner"]}>
                      <DashboardRouter />
                    </ProtectedRoute>
                  }
                />

                {/* 🧑‍💼 Admin */}
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

                {/* 📘 Info */}
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/security" element={<Security />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/help-support" element={<HelpSupport />} />
                <Route path="/report-fraud" element={<ReportFraud />} />
                <Route path="/blog" element={<Blog />} />

                {/* 🚫 Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>

        {/* 🦶 Footer */}
        {shouldShowFooter && <Footer />}
      </CartProvider>
    </AuthProvider>
  );
}

export default App;