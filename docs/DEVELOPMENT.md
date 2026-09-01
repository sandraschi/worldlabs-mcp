# Development

**Single source of truth for version:** `pyproject.toml` → `[project] version` (currently `0.5.0`). Also update the README badge and `native/tauri.conf.json` `version` when cutting a release.

```powershell
just version
```

## Quick Start

```powershell
git clone https://github.com/sandraschi/worldlabs-mcp
cd worldlabs-mcp
just bootstrap   # uv sync --extra dev + pre-commit install + npm ci in web_sota
just serve       # or .\start.ps1 — boots backend :10865 + frontend :10864 + browser
```

Start flags (`start.ps1`):

| Flag | Effect |
|------|--------|
| `-Headless` | Hidden windows, no browser |
| `-BackendOnly` | API server only (`:10865`) |
| `-NoBrowser` | Skip auto-open |
| `-ReuseIfRunning` | Reuse healthy instance if ports already bound |

## Project Layout

```
src/worldlabs_mcp/   # Python MCP server (FastMCP 3.4+)
  server.py          # 19 MCP tools, FastAPI bridge, CORS, lifespan
  api_bridge.py      # Marble API client, world library, LLM discovery, gallery
  logger.py          # RotatingFile + SSE log handlers
  prefab_cards.py    # @mcp.tool(app=True) Prefab UI cards
  dcc_launcher.py    # Blender/Unity/Resonite handoff
  tts.py             # edge-tts spatial narration
web_sota/            # React + Vite + Tailwind webapp (port 10864)
  src/pages/         # Dashboard, Library, Gallery, World-gen, Spark Viewer, etc.
  src/components/    # AppLayout, FloatingChat, etc.
  src/lib/api.ts     # Typed REST client
  src/lib/store.ts   # Zustand backend health store
native/              # Tauri 2.0 NSIS shell (port 10865 backend as sidecar)
  src/               # Rust backend.rs (free_port, health poll, stream watch)
  capabilities/      # default.json (core:default, shell:allow-open, etc.)
  tauri.conf.json    # Bundle config (targets nsis, resources include .env.example)
docs/                # This file + CONFIGURATION, TOOLS, TROUBLESHOOTING, ONBOARDING
tests/               # pytest suite (async, httpx mock)
scripts/             # start helpers, FleetStartMode.ps1, cua-smoke.py, gallery_scrape.py
```

## Common Tasks

```powershell
just --list          # All recipes
just lint            # ruff + biome ci
just fmt             # ruff format + biome format
just fix             # ruff --fix + format
just certify         # ruff check + format --check + pyright + pytest + tsc + biome ci
just test            # pytest -v
just test-cov        # with coverage
just typecheck       # mypy src/
just typecheck-fe    # tsc --noEmit
just build           # vite build -> web_sota/dist
just e2e             # playwright in web_sota
just health          # curl /health on :10865
just capabilities    # curl /api/capabilities
just probe-llm       # curl /api/llm/discover
just pack            # mcpb pack -> dist/worldlabs-mcp.mcpb
just validate        # mcpb validate manifest.json
just build-native    # Tauri NSIS (needs Rust + VC vars)
just cua-nsis-test   # CUA smoke (install -> launch -> nav walk -> uninstall)
```

## Quality Gates (five-gate fleet standard)

```powershell
uv run ruff check src/ --fix
uv run ruff format src/
uv run pyright src/
# web_sota:
npx tsc --noEmit
npx @biomejs/biome ci .
uv run pytest tests/ -q
```

CI is a reusable workflow: `.github/workflows/ci.yml` → `sandraschi/fleet-ci/.github/workflows/hybrid.yml@v1` (windows-latest, ruff + pyright + pytest + biome + tsc).

Pre-commit: `ruff` + `ruff-format` + `biome-web` (via `scripts/pre-commit-biome.ps1`) + trailing-whitespace/end-of-file/yaml/large-files. Installed by `just bootstrap` (`pre-commit install`).

## Ports & Fleet Integration

Registered in `mcp-central-docs/operations/WEBAPP_PORTS.md`: 10864 (frontend Vite) + 10865 (backend FastAPI). Adjacent pair, not in forbidden set (3000/5000/5173/8000/8080). Fleet launcher entry: `fleet-start.config.ps1` (UvicornTarget `worldlabs_mcp.server:app`, HealthPath `/health`, WebRoot `web_sota`).

## Onboarding: N/A Rationale

Onboarding **is required** for this repo (has wrappee World Labs API + online account at platform.worldlabs.ai). See `docs/ONBOARDING.md` + webapp `Onboarding` page + Dashboard CTA. Missing would be a HIGH gap.

## Releasing

1. Bump `pyproject.toml` version + `native/tauri.conf.json` + README badge.
2. Update `CHANGELOG.md`.
3. `just certify` must be green (all five gates).
4. `just pack && just validate` for MCPB.
5. `just build-native` for NSIS (optional).
6. Commit + push, tag `v{version}`.

## Troubleshooting Dev Issues

- `uv lock --check` fails → `uv lock` to resync, commit `uv.lock`.
- `pre-commit` not running → `uv run pre-commit install` or `just bootstrap`.
- Port zombies → `Get-NetTCPConnection -LocalPort 10865 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }` or `start.ps1` auto-clears via `FleetStartMode.ps1`.
- Editable install false-green → `D:\Dev\repos\mcp-central-docs\scripts\check-editable-install.ps1 -RepoRoot (Get-Location).Path`.
