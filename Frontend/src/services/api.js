import axios from "axios";
import { getFirebaseAuth } from "../firebase";

/* ============================================================
   ⚙️ BASE URL CONFIGURATION (Auto Environment Switch)
   ============================================================ */
const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const baseURL = isLocal
  ? import.meta.env.VITE_API_URL || "http://localhost:4000"
  : import.meta.env.VITE_API_URL_PROD || "https://messmatewebapplication.onrender.com";
/* ============================================================
   🧩 AXIOS INSTANCE
   ============================================================ */
const api = axios.create({
  baseURL: `${baseURL}/api`,
  withCredentials: true,
  timeout: 60000,
});

/* ============================================================
   🔐 AUTH TOKEN INTERCEPTOR (Firebase-aware)
   ============================================================ */
api.interceptors.request.use(async (config) => {
  try {
    // Skip auth for login/register
    if (
      config.url?.includes("/auth/login") ||
      config.url?.includes("/auth/register")
    ) {
      return config;
    }

    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;

    let token = null;

    // 🔹 Firebase users
    if (currentUser) {
      token = await currentUser.getIdToken(); // 🔥 FIXED (removed force refresh)
    } 
    // 🔹 Backend JWT fallback
    else {
      token = localStorage.getItem("token");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🔐 Token attached →", config.url);
    } else {
      console.warn("⚠️ No auth token found for request:", config.url);
    }

  } catch (err) {
    console.warn("⚠️ Failed to attach auth token:", err.message);
  }

  return config;
});

/* ============================================================
   ⚠️ RESPONSE ERROR INTERCEPTOR
   ============================================================ */
api.interceptors.response.use(
  (res) => res,
  (err) => {

    console.error("💥 API Error:", err.response?.data || err.message);

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
   📦 Upload helper
   ============================================================ */
export const buildUploadConfig = (onUploadProgress, signal) => ({
  headers: {},
  onUploadProgress,
  signal,
});

export default api;