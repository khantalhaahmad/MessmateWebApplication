// ✅ src/components/FloatingButtons.jsx — Updated for AuthPage
import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import "../styles/FloatingButtons.css";

const FloatingButtons = () => {
  const { user } = useContext(AuthContext);
  const [visible, setVisible] = useState(true);
  const [isOnWhiteSection, setIsOnWhiteSection] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ Hide floating buttons on non-home pages
    if (location.pathname !== "/") {
      setVisible(false);
      return;
    }

    const messSection = document.querySelector("#mess-section");
    const footerSection = document.querySelector("#footer-section");
    const betterFoodSection = document.querySelector("#betterfood-section");

    if (!messSection || !footerSection || !betterFoodSection) return;

    // ✅ Visibility control
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            (entry.target.id === "mess-section" && entry.intersectionRatio === 1) ||
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

    // ✅ Detect white section for color theme
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

  // ✅ Handle dashboard navigation based on role
  const handleDashboardClick = () => {
    if (!user) {
      navigate("/auth", { state: { mode: "login" } });
      return;
    }

    switch (user.role) {
      case "admin":
        navigate("/admin/dashboard");
        break;
      case "owner":
      case "messowner":
      case "student":
        navigate("/dashboard");
        break;
      default:
        navigate("/");
        break;
    }
  };

  // ✅ Handle login/signup redirects
  const handleAuthRedirect = (mode) => {
    navigate("/auth", { state: { mode } });
  };

  return (
    <div
      className={`floating-buttons ${visible ? "show" : "hide"} ${
        isOnWhiteSection ? "dark-mode" : "light-mode"
      }`}
    >
      {!user ? (
        <>
          <button
            onClick={() => handleAuthRedirect("login")}
            className="floating-btn glass-btn glow-btn"
          >
            Login
          </button>
          <button
            onClick={() => handleAuthRedirect("signup")}
            className="floating-btn glass-btn glow-btn"
          >
            Signup
          </button>
        </>
      ) : (
        <button
          onClick={handleDashboardClick}
          className="floating-btn dashboard-btn glow-btn"
        >
          Dashboard
        </button>
      )}
    </div>
  );
};

export default FloatingButtons;
