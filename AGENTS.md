# worldlabs-mcp — Agent Guide

## Overview

MCP server wrapping the World Labs Marble API for 3D world generation (text/image/video-to-world via Marble 1.1) and the Spark 2.0 spatial viewer. 20 MCP tools + FastAPI bridge (`:10865`) + webapp (`:10864`) + Tauri NSIS shell.

## Entry Points

- `uv run worldlabs-mcp` → `worldlabs_mcp.server:main` (stdio, Claude Desktop)
- `MCP_TRANSPORT=http uv run worldlabs-mcp` → HTTP on `:10865`
- `uv run uvicorn worldlabs_mcp.server:app --host 127.0.0.1 --port 10865` → direct ASGI
- `.\start.ps1` / `just serve` → full stack via FleetStartMode.ps1 (ports 10864/10865)

## Quick Ref

```powershell
uv run pytest tests/ -q          # 49 passed 8 skipped
uv run ruff check src/ --fix && uv run ruff format src/
uv run pyright src/              # 0 errors (basic mode)
just certify                     # five-gate: ruff + pyright + pytest + tsc + biome
just health                      # curl /health on :10865
just probe-llm                   # local LLM discovery
just pack                        # mcpb pack -> dist/worldlabs-mcp.mcpb
```

## Ports

| Port | Service | Config |
|------|---------|--------|
| 10864 | Frontend Vite (web_sota) | `fleet-start.config.ps1` FrontendPort |
| 10865 | Backend FastAPI + MCP HTTP | `fleet-start.config.ps1` BackendPort |

Registered in `mcp-central-docs/operations/WEBAPP_PORTS.md`. Never use 3000/5000/5173/8000/8080.

## Standards

- FastMCP 3.4.4 `>=3.4.4,<4` portmanteau pattern (tools use `operation` enum where >15 related)
- Responses: `{success, message, data}` dialogic, `logger.exception()` in error paths, `_error_response()` helper
- Dual transport: stdio (Claude Desktop) + HTTP (`MCP_TRANSPORT=http`)
- Prefab UI: `@mcp.tool(app=True)` on `show_worlds_card`/`show_world_card`
- Annotations: `readOnlyHint`/`destructiveHint` on 9+ tools
- Resources: `world://{world_id}`, `gallery://{tag}`; Prompts: `world-gen`, `spark-viewer`
- Docs: `docs/CONFIGURATION.md`, `DEVELOPMENT.md`, `TOOLS.md`, `TROUBLESHOOTING.md`, `ONBOARDING.md`
- See [mcp-central-docs](https://github.com/sandraschi/mcp-central-docs) fleet standards

## Key Files

- `src/worldlabs_mcp/server.py` — 20 MCP tools, resources, prompts, shutdown, FastAPI bridge
- `src/worldlabs_mcp/api_bridge.py` — Marble client, gallery, LLM discovery
- `src/worldlabs_mcp/logger.py` — RotatingFile + SSE handlers
- `src/worldlabs_mcp/prefab_cards.py` — Prefab cards
- `web_sota/src/pages/` — 23 pages (Dashboard, Chat, Skills, Library, Gallery, etc.)
- `web_sota/src/components/layout/app-layout.tsx` — nav (Chat, Skills, Tools, Library, Bridge Health, Logs, Config)
- `native/tauri.conf.json` — NSIS bundle, resources include `.env.example`
- `pyproject.toml` — ruff T20 + pyright basic, FastMCP pin
- `justfile` — Marble Adventure + fleet.just (cua-nsis-test, cua-webapp-test)

Install docs: `mcp-central-docs/standards/AGENT_INSTALL_REFERENCE.md` + `docs/ONBOARDING.md`.
