// src/services/api.js
import axios from "axios";

/* ============================================================
   ⚙️ BASE URL CONFIGURATION (Auto Environment Switch)
   ============================================================ */
const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const baseURL = isLocal
  ? import.meta.env.VITE_API_URL || "http://localhost:4000" // ✅ removed `/api` from here
  : import.meta.env.VITE_API_URL_PROD ||
    "https://messmate-backend.onrender.com";

/* ============================================================
   🧩 AXIOS INSTANCE
   ============================================================ */
const api = axios.create({
  baseURL: `${baseURL}/api`, // ✅ append `/api` only once
  withCredentials: true,
  timeout: 60000,
});

/* ============================================================
   🔐 AUTH TOKEN INTERCEPTOR
   ============================================================ */
api.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem("adminToken");
  const userToken = localStorage.getItem("token");
  const token = adminToken || userToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ============================================================
   ⚠️ RESPONSE ERROR INTERCEPTOR
   ============================================================ */
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.warn("⚠️ Unauthorized → Clearing session...");
      localStorage.clear();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

/* ============================================================
   🧠 DEV LOGGING
   ============================================================ */
if (import.meta.env.DEV) {
  console.log("✅ API Base URL →", `${baseURL}/api`);
}

/* ============================================================
   📦 UPLOAD CONFIG HELPER
   ============================================================ */
export const buildUploadConfig = (onUploadProgress, signal) => ({
  headers: {},
  onUploadProgress,
  signal,
});

export default api;
