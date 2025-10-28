// src/services/api.js
import axios from "axios";

const ENV = import.meta.env.VITE_ENV || (
  typeof window !== "undefined" && /localhost|127\.0\.0\.1/.test(window.location.hostname)
    ? "development"
    : "production"
);

// ✅ Use the API URLs exactly from .env (Do NOT add extra /api here)
const BASE_URL =
  ENV === "production"
    ? import.meta.env.VITE_API_URL_PROD     // Already contains /api
    : import.meta.env.VITE_API_URL;         // Already contains /api (local)

// ✅ Fallback for safety
const finalBase = BASE_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: finalBase,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ✅ Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ Handle Token Expiry
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

console.log(`🔥 API Connected: ${finalBase}`);
export default api;
