import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    proxy: {
      "/gateway": {
        target: "http://165.227.252.58:8001",
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/gateway/, ""),
      },
      "/conductor": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/conductor/, ""),
      },
    },
  },
  envPrefix: ["VITE_"],
  build: {
    target: "es2022",
    minify: "esbuild",
  },
});
