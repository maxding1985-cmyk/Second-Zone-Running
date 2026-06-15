import { defineConfig, devices } from "@playwright/test";

const apiPort = 4100;
const webPort = 4173;
const apiBaseUrl = `http://127.0.0.1:${apiPort}`;
const webBaseUrl = `http://127.0.0.1:${webPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: webBaseUrl,
    trace: "retain-on-failure"
  },
  webServer: [
    {
      command: `PORT=${apiPort} HOST=127.0.0.1 npm --workspace apps/api run build && PORT=${apiPort} HOST=127.0.0.1 node apps/api/dist/apps/api/src/server.js`,
      url: `${apiBaseUrl}/health`,
      timeout: 60_000,
      reuseExistingServer: false
    },
    {
      command: `EXPO_PUBLIC_API_URL=${apiBaseUrl} EXPO_PUBLIC_MOCK_SPEECH=1 npm run export:web && python3 -m http.server ${webPort} --bind 127.0.0.1 --directory apps/mobile/dist`,
      url: webBaseUrl,
      timeout: 300_000,
      reuseExistingServer: false
    }
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
