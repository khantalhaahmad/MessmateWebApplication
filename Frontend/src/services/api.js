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
  : import.meta.env.VITE_API_URL_PROD || "https://messmate-backend.onrender.com";

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
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;
    let token = null;

    // 🔹 Prefer Firebase ID token
    if (currentUser) {
      token = await currentUser.getIdToken(true);
    } else {
      // 🔹 Fallback for admin or backend JWT users
      token =
        localStorage.getItem("adminToken") || localStorage.getItem("token");
    }

    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (err) {
    console.warn("⚠️ Failed to attach Firebase token:", err.message);
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

export const buildUploadConfig = (onUploadProgress, signal) => ({
  headers: {},
  onUploadProgress,
  signal,
});

export default api;
