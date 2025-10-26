// src/services/api.js
import axios from "axios";

// ============================================================
// 🌍 ENVIRONMENT DETECTION
// ============================================================
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// ============================================================
// 🌐 BACKEND URL SELECTION (Robust Auto-Detection)
// ============================================================
// Localhost  ➜ uses local backend
// Production ➜ uses VITE_API_URL (from .env) or fallback Render URL
const BASE_URL = isLocalhost
  ? "http://localhost:4000/api" // 🧩 Local backend (dev mode)
  : import.meta.env.VITE_API_URL_PROD
  ? `${import.meta.env.VITE_API_URL_PROD}/api`
  : import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "https://messmate-backend-nvpe.onrender.com/api"; // ✅ safe fallback

// ============================================================
// ⚙️ AXIOS INSTANCE SETUP
// ============================================================
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // ⏱️ 15 seconds timeout
  withCredentials: false, // ⚠️ keep false unless backend uses cookies
});

// ============================================================
// 🔐 ATTACH JWT TOKEN TO EVERY REQUEST
// ============================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// 🚨 GLOBAL ERROR HANDLER (auto-logout + dev logs)
// ============================================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Unauthorized → redirect to login
    if (error.response?.status === 401) {
      console.warn("🔒 Session expired. Redirecting to login...");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    // Development detailed error logs
    if (isLocalhost) {
      console.group("❌ API Error");
      console.error("📍 URL:", error.config?.url);
      console.error("📡 Status:", error.response?.status);
      console.error("💬 Message:", error.message);
      console.groupEnd();
    }

    return Promise.reject(error);
  }
);

// ============================================================
// 🧾 EXPORT CONFIGURED INSTANCE
// ============================================================
export default api;

console.log("✅ API Base URL:", BASE_URL);
