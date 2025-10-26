import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LoginPopup.css";

const LoginPopup = ({ onClose }) => {
  const navigate = useNavigate();

  return (
    <div className="login-popup-overlay">
      <div className="login-popup">
        <h2>🍽️ Welcome to MessMate</h2>
        <p>Please log in or sign up to continue ordering or adding messes.</p>

        <div className="popup-buttons">
          <button className="login-btn" onClick={() => navigate("/login")}>
            Login
          </button>
          <button className="signup-btn" onClick={() => navigate("/signup")}>
            Sign Up
          </button>
        </div>

        <button className="close-popup" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
};

export default LoginPopup;
