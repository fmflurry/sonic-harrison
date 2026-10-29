import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "tests",
  testMatch: "**/*.spec.js",
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 1280, height: 720 },
    // A VM without the pinned browser download can point at a local Chromium build.
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  webServer: {
    command: "python3 -m http.server 4173 --bind 127.0.0.1",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
})
