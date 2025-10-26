import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import "./Navbar.css"; // ✅ Path correct for component folder

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Detect current route
  const isHome = location.pathname === "/";

  return (
    <nav className="navbar">
      {/* ✅ Brand / Logo */}
      <div className="navbar-left">
        <Link to="/" className="navbar-logo">
          MessMate
        </Link>
      </div>

      {/* ✅ Right Side Buttons */}
      <div className="navbar-right">
        {/* Hide Home button if already on home */}
        {!isHome && (
          <Link to="/" className="nav-btn">
            Home
          </Link>
        )}

        {/* Show Dashboard if logged in */}
        {user && (
          <Link to="/dashboard" className="nav-btn">
            Dashboard
          </Link>
        )}

        {/* ✅ Show Add Mess only if user is OWNER */}
        {user?.role === "owner" && (
          <Link to="/addmess" className="nav-btn add-mess-btn">
            + Add Mess
          </Link>
        )}

        {/* ✅ Auth buttons only if not logged in */}
        {!user && (
          <>
            <Link to="/login" className="nav-btn auth-btn">
              Login
            </Link>
            <Link to="/signup" className="nav-btn auth-btn">
              Signup
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
