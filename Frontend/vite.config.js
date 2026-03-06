import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: "bundle-analysis.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],

  server: {
    host: true,              // 🔥 VERY IMPORTANT
    port: 5173,
    strictPort: true,
    open: true,
    cors: true,

    hmr: {
      host: "localhost",     // 🔥 prevents white screen
    },

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