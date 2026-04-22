import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Run tests in Node environment (no browser needed for unit tests)
    environment: "node",
    // Glob for test files — co-located __tests__ dirs or *.test.ts files
    include: ["src/**/*.test.ts", "src/**/__tests__/**/*.ts"],
    exclude: ["src/web/**", "tests/e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "./coverage",
      include: ["src/indexer/**", "src/server/**", "src/shared/**"],
      exclude: ["src/indexer/cli.ts", "src/server/index.ts"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
      },
    },
    // Print a clean diff on failures
    reporters: ["verbose"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
