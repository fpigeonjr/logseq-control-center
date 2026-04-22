// Root vite.config.ts — used only by Vitest for Svelte plugin resolution.
// Dev server and build use src/web/vite.config.ts directly.
import { defineConfig } from "vite";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [svelte({ preprocess: vitePreprocess() })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
