import React, { useContext, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import AuthPage from "../pages/AuthPage";
import "./Navbar.css";

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const [openAuth, setOpenAuth] = useState(false);

  const isHome = location.pathname === "/";

  /* ======================================================
     🔥 GLOBAL AUTH DRAWER (SINGLE SOURCE OF TRUTH)
  ====================================================== */
  useEffect(() => {
    window.openAuthDrawer = () => {
      console.log("🟢 window.openAuthDrawer CALLED");
      setOpenAuth(true);

      // 🔥 INFORM ALL COMPONENTS
      window.dispatchEvent(new CustomEvent("auth-drawer-open"));
    };

    return () => {
      delete window.openAuthDrawer;
    };
  }, []);

  /* ======================================================
     🔒 BODY SCROLL LOCK
  ====================================================== */
  useEffect(() => {
    if (openAuth) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [openAuth]);

  /* ======================================================
     🔥 CLOSE HANDLER
  ====================================================== */
  const closeAuthDrawer = () => {
    console.log("🔴 AuthPage onClose CALLED");
    setOpenAuth(false);

    // 🔥 INFORM ALL COMPONENTS
    window.dispatchEvent(new CustomEvent("auth-drawer-close"));
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">
            MessMate
          </Link>
        </div>

        <div className="navbar-right">
          {!isHome && (
            <Link to="/" className="nav-btn">
              Home
            </Link>
          )}

          {user && (
            <Link to="/dashboard" className="nav-btn">
              Dashboard
            </Link>
          )}

          {user?.role === "owner" && (
            <Link to="/addmess" className="nav-btn add-mess-btn">
              + Add Mess
            </Link>
          )}

          {/* 🔥 MAIN FIX: HIDE WHEN DRAWER OPEN */}
          {!user && !openAuth && (
            <>
              <button
                type="button"
                className="nav-btn auth-btn"
                onClick={() => window.openAuthDrawer()}
              >
                Login
              </button>

              <button
                type="button"
                className="nav-btn auth-btn"
                onClick={() => window.openAuthDrawer()}
              >
                Signup
              </button>
            </>
          )}
        </div>
      </nav>

      <AuthPage open={openAuth} onClose={closeAuthDrawer} />
    </>
  );
};

export default Navbar;