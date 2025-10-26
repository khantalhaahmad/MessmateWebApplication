import React from "react";
import "../styles/LogoutPopup.css";

const LogoutPopup = ({ onConfirm, onCancel }) => {
  return (
    <div className="logout-overlay">
      <div className="logout-popup">
        <h2>Logout Confirmation</h2>
        <p>Are you sure you want to log out?</p>
        <div className="logout-buttons">
          <button className="logout-yes" onClick={onConfirm}>
            Yes, Logout
          </button>
          <button className="logout-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutPopup;
