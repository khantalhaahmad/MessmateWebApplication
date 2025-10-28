// src/pages/Login.jsx
import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../Context/AuthContext";
import "../styles/Auth.css";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useContext(AuthContext);

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    // Already logged in? Redirect immediately
    if (user?.role) {
      if (user.role === "admin") navigate("/admin/dashboard", { replace: true });
      else navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/login", { identifier, password });
      const { user, token } = res.data;

      if (!token || !user) throw new Error("Invalid login response");

  // Use AuthContext.login to persist & redirect (login normalizes role)
  login({ user, token });
  alert(`✅ Welcome back, ${user.name}!`);
    } catch (err) {
      console.error("❌ Login error:", err);
      setError(err.response?.data?.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <h2>Login to MessMate</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Email or Username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
};

export default Login;
