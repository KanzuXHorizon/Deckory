import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.DECKORY_E2E_PORT ?? "43217");
const runId = process.env.DECKORY_E2E_RUN_ID ?? "manual";
const baseURL = process.env.DECKORY_E2E_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: `output/playwright/test-results/${runId}`,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: `output/playwright/report/${runId}`, open: "never" }]
  ],
  use: {
    baseURL,
    viewport: { width: 1440, height: 900 },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: {
    command: `pnpm --filter @deckory/present exec next start -p ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe"
  }
});
