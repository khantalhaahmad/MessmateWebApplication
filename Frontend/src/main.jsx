// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./Context/AuthContext";
import { Toaster } from "react-hot-toast";

// ✅ Create React Root
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* ✅ Auth context is now inside the router */}
      <AuthProvider>
        <App />
        {/* ✅ Global Toast Notification Provider */}
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            duration: 3000,
            style: {
              background: "#333",
              color: "#fff",
              borderRadius: "10px",
              fontSize: "15px",
            },
            success: {
              style: { background: "#16a34a" }, // green
            },
            error: {
              style: { background: "#dc2626" }, // red
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
