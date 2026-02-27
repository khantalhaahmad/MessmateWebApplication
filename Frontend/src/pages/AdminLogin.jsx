// ✅ src/pages/AdminLogin.jsx — PRODUCTION UI
import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../services/api";
import { AuthContext } from "../Context/AuthContext";

const AdminLogin = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.identifier || !form.password) {
      Swal.fire("Missing fields", "Email / Phone and password required", "warning");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        identifier: form.identifier,
        password: form.password,
      });

      if (!res.data?.success) {
        throw new Error(res.data?.message || "Login failed");
      }

      const { user, token } = res.data;

      if (user.role !== "admin") {
        Swal.fire("Access Denied", "You are not an admin", "error");
        return;
      }

      login({ user, token });

      Swal.fire({
        icon: "success",
        title: "Welcome Admin",
        text: "Redirecting to dashboard…",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire(
        "Login Failed",
        err.response?.data?.message || "Invalid credentials",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #020617 0%, #020617 40%, #0f172a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          background: "#ffffff",
          borderRadius: "14px",
          padding: "32px 30px",
          boxShadow: "0 30px 60px rgba(0,0,0,0.35)",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        {/* 🔰 LOGO */}
        <div style={{ textAlign: "center", marginBottom: "18px" }}>
          <img
            src="/assets/messmate.png"
            alt="MessMate Logo"
            style={{
              width: "64px",
              height: "64px",
              objectFit: "contain",
              marginBottom: "8px",
            }}
          />
          <h2 style={{ margin: 0, color: "#0f172a" }}>Admin Login</h2>
          <p
            style={{
              fontSize: "13px",
              color: "#64748b",
              marginTop: "4px",
            }}
          >
            MessMate Control Panel
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email / Phone */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#334155",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Email or Phone
            </label>
            <input
              type="text"
              name="identifier"
              value={form.identifier}
              onChange={handleChange}
              placeholder="admin@messmate.com"
              autoComplete="username"
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "22px" }}>
            <label
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#334155",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
              style={inputStyle}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              background: loading
                ? "#94a3b8"
                : "linear-gradient(135deg, #0f172a, #020617)",
              color: "#fff",
              fontWeight: 600,
              fontSize: "14px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Logging in..." : "Login as Admin"}
          </button>
        </form>

        {/* Back */}
        <div style={{ textAlign: "center", marginTop: "18px" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "none",
              border: "none",
              color: "#2563eb",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

/* 🎨 Shared input style */
const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  outline: "none",
  fontSize: "14px",
};

export default AdminLogin;