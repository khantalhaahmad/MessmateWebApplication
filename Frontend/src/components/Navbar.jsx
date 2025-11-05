import React, { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === "/";

  // 🔁 Navigate to AuthPage with mode (optional)
  const handleAuthRedirect = (mode) => {
    navigate("/auth", { state: { mode } }); // "mode" can be "login" or "signup"
  };

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
            <button onClick={() => handleAuthRedirect("login")} className="nav-btn auth-btn">
              Login
            </button>
            <button onClick={() => handleAuthRedirect("signup")} className="nav-btn auth-btn">
              Signup
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
