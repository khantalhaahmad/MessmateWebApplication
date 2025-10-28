// src/services/api.js
import axios from "axios";

const VITE_ENV = import.meta.env.VITE_ENV || "";
const isLocalhost = typeof window !== "undefined" && /localhost|127\.0\.0\.1/.test(window.location.hostname);
const ENV = VITE_ENV || (isLocalhost ? "development" : "production");

const BASE_URL =
  ENV === "production"
    ? `${import.meta.env.VITE_API_URL_PROD}/api`
    : `${import.meta.env.VITE_API_URL}/api`;

// If env vars missing, fallback to localhost
const finalBase = import.meta.env.VITE_API_URL ? BASE_URL : (isLocalhost ? "http://localhost:4000/api" : BASE_URL);

const api = axios.create({
  baseURL: finalBase,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// attach JWT automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.warn("⚠️ Token expired or invalid. Redirecting to login...");
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

console.log(`✅ API Base URL: ${finalBase}`);
export default api;
