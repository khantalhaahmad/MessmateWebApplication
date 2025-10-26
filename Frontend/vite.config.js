import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ✅ Automatically read from .env (e.g. VITE_API_BASE_URL)
export default defineConfig({
  plugins: [react()],

  // 🌍 Development server config
  server: {
    port: 5173, // default dev port
    open: true, // auto-open browser
    cors: true,
    hmr: {
      overlay: true, // shows full-screen errors on dev
    },

    // ✅ Proxy API calls to backend (for local dev)
    proxy: {
      "/api": {
        target: "http://localhost:4000", // your Express backend
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // ⚙️ Build optimizations
  build: {
    outDir: "dist",
    sourcemap: false,
  },

  // 🚀 Remove license comments from builds
  esbuild: {
    legalComments: "none",
  },

  // 🧠 Define global environment variables if needed
  define: {
    "process.env": {},
  },
});
