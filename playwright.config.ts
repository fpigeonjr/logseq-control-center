import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  // Run tests serially — we have one local server
  fullyParallel: false,
  workers: 1,
  // Retry once on CI, zero locally
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],

  use: {
    // All e2e tests hit the local dev server
    baseURL: "http://localhost:7890",
    // Capture trace on first retry for debugging
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 14"] },
    },
  ],

  // Start the server before e2e tests run
  webServer: {
    command: "npm run dev:server",
    url: "http://localhost:7890/api/health",
    reuseExistingServer: !process.env.CI,
    // Give the server up to 15s to start
    timeout: 15_000,
    env: {
      NOTES_DIR: process.env.NOTES_DIR ?? "~/Notes",
      PORT: "7890",
    },
  },
});
