# Build Log -- worldlabs-mcp

## 2026-06-25 -- Fleet compliance upgrade

| Phase | Status | Notes |
|-------|--------|-------|
| 0: API_BASE port check | Added | Verifies web_sota/src/lib/api.ts matches backend port 10865 |
| 1: .env -> .env.example | Fixed | build.ps1 and tauri.conf.json now bundle .env.example (NOT .env) |
| 1: Backend size gate | Added | >= 5 MB gate on PyInstaller binary |
| 2: NSIS hooks | Fixed | Added UninstallPrevious macro, Stop-Process layer before taskkill |
| 3: Zustand store | Added | web_sota/src/lib/store.ts for backend health state |
| 4: Dashboard KPIs | Fixed | Added data-testid attributes, backend-dot, exponential backoff [1,2,4,8,16]s |
| 5: Dependencies | Added | zustand, framer-motion installed in web_sota/ |
| 6: .bak cleanup | Done | Removed stale .bak files |
