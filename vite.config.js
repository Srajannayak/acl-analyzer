import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    watch: {
      ignored: [
        "**/backend/**",
        "**/backend/uploads/**",
        "**/backend/outputs/**",
        "**/backend/data/**",
        "**/backend/reports/**",
        "**/*.mp4",
        "**/*.json",
      ],
    },
    proxy: {
      "/upload": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
      "/outputs": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
      "/history": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
      "/analysis": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
      "/report": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept && req.headers.accept.includes("text/html")) {
            return "/index.html";
          }
        },
      },
    },
  },
});