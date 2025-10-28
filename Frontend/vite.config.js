import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: "bundle-analysis.html",
      open: false, // set true to auto-open after build
      gzipSize: true,
      brotliSize: true,
    }),
  ],

  server: {
    port: 5173,
    open: true,
    cors: true,
    hmr: { overlay: true },
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          charts: ["recharts"],
          icons: ["lucide-react"],
          ui: ["sweetalert2"],
        },
      },
    },
  },

  esbuild: { legalComments: "none" },
  define: { "process.env": {} },
});
