# Release Tier: T3 (Desktop NSIS)

Per `mcp-central-docs/standards/RELEASE_TIERS.md` (2026-07-11):

- **T1 (MCPB)**: `just pack` produces `dist/worldlabs-mcp.mcpb` from the `mcpb/` staging bundle (synced from `src/` via `just mcpb-sync`).
- **T2 (Webapp)**: React/Vite frontend + FastAPI bridge on ports **10864/10865** (`just start`).
- **T3 (Desktop NSIS)**: Tauri shell in `native/` with a PyInstaller sidecar backend; `just build-native` produces the NSIS installer.

Release artifacts: `.mcpb` bundle + NSIS `-setup.exe`, uploaded to GitHub releases (triple-play, see `mcp-central-docs/scripts/release-template.ps1`).
