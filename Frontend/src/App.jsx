// ✅ src/App.jsx — Updated with Global Lenis Smooth Scroll + Responsive Base
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
import ProtectedRoute from "./components/ProtectedRoute";
import FloatingButtons from "./components/FloatingButtons";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";

// 🧩 Global responsive helpers
import "./styles/responsive.css";

// 💤 Lazy-Loaded Pages (Main)
const Home = lazy(() => import("./pages/Home"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
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

// 🌀 Loader for Suspense
const Loader = () => (
  <div className="loading-screen">
    <div className="spinner" />
    <p>Loading, please wait...</p>
    <style>{`
      .loading-screen {
        display: flex; flex-direction: column; justify-content: center; align-items: center;
        height: 100vh; background: linear-gradient(135deg, #f1f4ff, #fafaff);
        color: #2a2a2a; font-family: 'Poppins', sans-serif;
      }
      .spinner {
        border: 5px solid #e0e0e0; border-top: 5px solid #6c63ff;
        border-radius: 50%; width: 45px; height: 45px; animation: spin 1s linear infinite;
        margin-bottom: 12px;
      }
      @keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
    `}</style>
  </div>
);

function App() {
  const location = useLocation();

  // ✅ Initialize Lenis for smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.3,
      smooth: true,
      direction: "vertical",
      gestureDirection: "vertical",
      smoothTouch: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  // 🚫 Routes where footer should be hidden
  const noFooterRoutes = ["/auth", "/dashboard", "/admin", "/checkout", "/messes"];
  const shouldShowFooter = !noFooterRoutes.some((path) =>
    location.pathname.startsWith(path)
  );
  const isMessMenuPage = matchPath("/messes/:mess_id", location.pathname);

  return (
    <AuthProvider>
      <CartProvider>
        {isMessMenuPage && <FloatingButtons />}

        <main className="app-main">
          <ErrorBoundary>
            <Suspense fallback={<Loader />}>
              <Routes>
                {/* 🌍 Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/messes/:mess_id" element={<MessMenu />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/delivery-partners" element={<DeliveryPartners />} />
                <Route path="/delivery-join" element={<DeliveryJoin />} />
                <Route path="/partner-with-us" element={<PartnerLanding />} />
                <Route path="/addmess" element={<AddMessForm />} />

                {/* 👨‍🎓 Dashboard (Protected) */}
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

                {/* 📘 Info Pages */}
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

        {/* 🦶 Footer visible only on main pages */}
        {shouldShowFooter && <Footer />}
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
