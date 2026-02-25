import React, { useContext, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import AuthPage from "../pages/AuthPage"; // ✅ drawer component
import "./Navbar.css";

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const [openAuth, setOpenAuth] = useState(false);

  const isHome = location.pathname === "/";

  /* 🧪 DEBUG: Navbar render */
  useEffect(() => {
    console.log("📍 Navbar render");
    console.log("➡️ location.pathname =", location.pathname);
    console.log("➡️ openAuth =", openAuth);
  });

  /* 🔒 BODY SCROLL LOCK (Swiggy style) */
  useEffect(() => {
    if (openAuth) {
      console.log("🔒 Body scroll LOCK");
      document.body.style.overflow = "hidden";
    } else {
      console.log("🔓 Body scroll UNLOCK");
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [openAuth]);

  return (
    <>
      <nav className="navbar">
        {/* ✅ Logo */}
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">
            MessMate
          </Link>
        </div>

        {/* ✅ Right side */}
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

          {!user && (
            <>
              <button
                type="button"
                className="nav-btn auth-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("🟢 LOGIN BUTTON CLICKED");
                  setOpenAuth(true);
                }}
              >
                Login
              </button>

              <button
                type="button"
                className="nav-btn auth-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("🟢 SIGNUP BUTTON CLICKED");
                  setOpenAuth(true);
                }}
              >
                Signup
              </button>
            </>
          )}
        </div>
      </nav>

      {/* 🧪 DEBUG: AuthPage props */}
      <AuthPage
        open={openAuth}
        onClose={() => {
          console.log("🔴 AuthPage onClose CALLED");
          setOpenAuth(false);
        }}
      />
    </>
  );
};

export default Navbar;