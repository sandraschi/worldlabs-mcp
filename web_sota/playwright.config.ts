import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  retries: 1,
  use: {
    baseURL: "http://localhost:10864",
    headless: true,
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "uv run python -m worldlabs_mcp.server --port 10865",
    port: 10865,
    timeout: 30000,
    reuseExistingServer: false,
  },
});
