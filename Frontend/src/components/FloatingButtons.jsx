// ✅ src/components/FloatingButtons.jsx — FINAL (Drawer-aware + Click-safe)
import React, { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import "../styles/FloatingButtons.css";

const FloatingButtons = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const [visible, setVisible] = useState(true);
  const [isOnWhiteSection, setIsOnWhiteSection] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // 🔥 KEY STATE

  /* ======================================================
     SHOW ONLY ON HOME PAGE
  ====================================================== */
  useEffect(() => {
    if (location.pathname !== "/") {
      setVisible(false);
      return;
    }
    setVisible(true);
  }, [location.pathname]);

  /* ======================================================
     OPTIONAL: section-based visibility + theme
  ====================================================== */
  useEffect(() => {
    if (location.pathname !== "/") return;

    const messSection = document.querySelector("#mess-section");
    const footerSection = document.querySelector("#footer-section");
    const betterFoodSection = document.querySelector("#betterfood-section");

    if (!messSection || !footerSection || !betterFoodSection) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            (entry.target.id === "mess-section" &&
              entry.intersectionRatio === 1) ||
            (entry.target.id === "footer-section" && entry.isIntersecting)
          ) {
            setVisible(false);
          } else {
            setVisible(true);
          }
        });
      },
      { threshold: [0, 0.5, 1] }
    );

    observer.observe(messSection);
    observer.observe(footerSection);

    const colorObserver = new IntersectionObserver(
      ([entry]) => setIsOnWhiteSection(entry.isIntersecting),
      { threshold: 0.3 }
    );

    colorObserver.observe(betterFoodSection);

    return () => {
      observer.disconnect();
      colorObserver.disconnect();
    };
  }, [location.pathname]);

  /* ======================================================
     🔥 LISTEN AUTH DRAWER OPEN + CLOSE EVENTS (MAIN FIX)
  ====================================================== */
  useEffect(() => {
    const handleDrawerOpen = () => {
      console.log("🟣 FloatingButtons: auth-drawer-open");
      setIsDrawerOpen(true);
    };

    const handleDrawerClose = () => {
      console.log("🟢 FloatingButtons: auth-drawer-close");
      setIsDrawerOpen(false);
    };

    window.addEventListener("auth-drawer-open", handleDrawerOpen);
    window.addEventListener("auth-drawer-close", handleDrawerClose);

    return () => {
      window.removeEventListener("auth-drawer-open", handleDrawerOpen);
      window.removeEventListener("auth-drawer-close", handleDrawerClose);
    };
  }, []);

  /* ======================================================
     🔥 OPEN AUTH DRAWER (CLICK-SAFE)
  ====================================================== */
  const openAuthDrawer = (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("🟢 Floating Login / Signup CLICKED");

    if (typeof window.openAuthDrawer === "function") {
      setIsDrawerOpen(true); // instant hide (UX smooth)
      window.openAuthDrawer();
    } else {
      console.error("❌ window.openAuthDrawer NOT FOUND");
    }
  };

  /* ======================================================
     DASHBOARD (WHEN LOGGED IN)
  ====================================================== */
  const handleDashboardClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) return;

    switch (user.role) {
      case "admin":
        window.location.href = "/admin/dashboard";
        break;
      case "owner":
      case "messowner":
      case "student":
        window.location.href = "/dashboard";
        break;
      default:
        window.location.href = "/";
        break;
    }
  };

  /* ======================================================
     🔥 MAIN VISIBILITY RULE
  ====================================================== */
  if (!visible || isDrawerOpen) return null;

  return (
    <div
      className={`floating-buttons ${
        isOnWhiteSection ? "dark-mode" : "light-mode"
      }`}
    >
      {!user ? (
        <>
          <button
            type="button"
            onMouseDown={openAuthDrawer}
            className="floating-btn glass-btn glow-btn"
          >
            Login
          </button>

          <button
            type="button"
            onMouseDown={openAuthDrawer}
            className="floating-btn glass-btn glow-btn"
          >
            Signup
          </button>
        </>
      ) : (
        <button
          type="button"
          onMouseDown={handleDashboardClick}
          className="floating-btn dashboard-btn glow-btn"
        >
          Dashboard
        </button>
      )}
    </div>
  );
};

export default FloatingButtons;