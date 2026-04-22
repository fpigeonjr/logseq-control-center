import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";

export default defineConfig({
  // Svelte plugin is required for Vitest to process .svelte files
  plugins: [svelte({ hot: false })],

  test: {
    // Default environment for server/indexer tests
    environment: "node",

    // Use happy-dom for Svelte component tests
    environmentMatchGlobs: [["src/web/**", "happy-dom"]],

    include: ["src/**/*.test.ts", "src/**/__tests__/**/*.ts"],
    exclude: ["tests/e2e/**", "node_modules/**"],

    // Load jest-dom matchers globally for component tests
    setupFiles: ["./tests/setup.ts"],

    reporters: ["verbose"],

    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "./coverage",
      include: [
        "src/indexer/**",
        "src/server/**",
        "src/shared/**",
        "src/web/lib/**",
        "src/web/stores/**",
      ],
      exclude: ["src/indexer/cli.ts", "src/server/index.ts"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
      },
    },
  },

  resolve: {
    conditions: ["browser"],
    alias: {
      "@": path.resolve("./src"),
    },
  },
});
