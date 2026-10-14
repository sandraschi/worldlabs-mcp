import { defineConfig } from "@playwright/test";

// E2E smoke: Playwright manages BOTH servers, so `just e2e` works from a
// cold machine. Backend = run_server.py in HTTP mode (server.py main() is
// stdio-only and takes no --port flag); frontend = vite preview of the
// production build (run `bun run build` first - CI does).
export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  retries: 1,
  use: {
    baseURL: "http://localhost:10864",
    headless: true,
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "uv run --project .. python ../run_server.py",
      env: { WORLDLABS_MCP_PORT: "10865" },
      port: 10865,
      timeout: 60000,
      reuseExistingServer: true,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      // npx (not bun): Playwright spawns servers with a minimal PATH where
      // bun is unavailable; nodejs/npx is system-installed.
      command: "npx vite preview --port 10864 --strictPort",
      port: 10864,
      timeout: 30000,
      reuseExistingServer: true,
    },
  ],
});
