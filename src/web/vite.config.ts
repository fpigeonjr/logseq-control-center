import { defineConfig } from "vite";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import { fileURLToPath } from "url";

// Config lives at src/web/vite.config.ts — root is this directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // root = src/web/ (where index.html lives)
  root: __dirname,
  plugins: [svelte({ preprocess: vitePreprocess() })],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:7890",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../../dist/web"),
    emptyOutDir: true,
  },
});
