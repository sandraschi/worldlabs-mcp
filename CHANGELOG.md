# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-04-18

### Added
- **Spark 2.0 viewer page** (`web_sota/src/pages/spark-viewer.tsx`) using `@sparkjsdev/spark@2.0.0` with `.RAD` LoD streaming, `.spz`/`.ply`/`.ksplat` fallback, WebAudio HRTF listener, local file drag-and-drop.
- **Local asset bridge** — `GET /api/local-assets/{filename}` serves `.spz` / `.rad` / `.ply` / `.ksplat` / `.splat` from `WORLDLABS_LOCAL_PATH` (defaults to `~/Downloads`, portable).
- **Narration SSE stream** — `GET /api/narration/stream` + `POST /api/narration` for scene events (`speech` / `audio` / `video` / `avatar`).
- **Four speculative spatial tools** registered on the MCP surface and documented in `_TOOL_CATALOG` under a new `spatial` group: `broadcast_spatial_notification`, `broadcast_spatial_audio`, `place_world_tv`, `spawn_agent_avatar`. End-to-end voice path needs `speech-mcp`.
- `test_tool_count_matches_catalog` — new test enforcing that `_TOOL_CATALOG` and the MCP registry stay in sync.

### Changed
- **Bridge consolidation**: `src/worldlabs_mcp/api_bridge.py` is now the single source of truth for the `/api/*` surface. The previous standalone `web_sota/backend/bridge.py` (which had the production-quality history persistence, LLM discovery, real DCC exports, and SSE operation status, but was orphaned from the start.ps1 boot path) has been merged in. `web_sota/backend/bridge.py` is now a thin re-export so `uvicorn web_sota.backend.bridge:app` still works for webapp-only development. `web_sota/start.ps1` unchanged — it already ran `worldlabs_mcp.server:app` on 10865.
- **Port story resolved**: `WORLDLABS_BRIDGE_URL` now defaults to `http://localhost:10865` (was `:10718` — never correct). The four spatial tools post narration events to the bridge served by the same MCP server process. Documented in `docs/ARCHITECTURE.md` and `.env.example`.
- **CORS tightened**: `server.py`'s ASGI wrapper no longer uses `allow_origins=["*"]` with `allow_credentials=True` (invalid per CORS spec). Uses explicit `FRONTEND_ORIGIN` env var (default `http://localhost:10864`) plus `127.0.0.1:10864`.
- **Model defaults updated**: all generate tools now default to `marble-1.1` instead of the non-existent `Marble 0.1-mini`. Plus variant is `marble-1.1-plus` (auto-expanding, variable cost 1500 + 300/dynamic cube up to 5 cubes). Pricing notes in `worldlabs_help` verbose mode corrected.
- **FastMCP bumped** from `>=3.1.0` to `>=3.2.0,<4`; `prefab-ui` bumped to `>=0.18.0`. Matches fleet SOTA (mcp-central-docs §2.2 Prefab mandate).
- **Python versions aligned**: `.python-version` → 3.13, mypy target 3.13; ruff target stays at py312 for compatibility.
- **README** rewritten with honest feature tiers (shipping vs speculative), accurate tool count (16), removed fictional "Built by Google DeepMind team" line.
- **docs/ARCHITECTURE.md** rewritten with real port table, real component diagram, real data flow for the voice agent.
- **docs/SPARK_V2.md** rewritten against real Spark 2.0 docs — LoD splat tree (tiny-lod / bhatt-lod), `.RAD` format, virtual splat paging, composite LoD worlds, ExtSplats. Removed fictional "native programmable physics" claim.
- **docs/TTS.md** corrected — model is `gemini-3.1-flash-tts-preview` (not "Gemini 3.1 Pro"). Added known-gaps section, clarified the speech-mcp dependency.
- **`.env.example`** expanded to document the full config surface (bridge URL, local assets path, DCC targets).

### Added
- **`GET /api/capabilities`** — runtime feature-gating endpoint per AGENT_PROTOCOLS §1.4.
- **`GET /api/history/remote`** — Marble account-wide world listing (was conflated with local history before).

### Fixed
- **`Context` import** — `src/worldlabs_mcp/server.py` used `Context` as a type hint without importing it. Added `from fastmcp import Context` and changed signatures to `ctx: Context | None = None` so tool registration doesn't treat it as required.
- **`spark-viewer.tsx` compile errors** — added missing `useEffect`, `useRef`, `useState` from `react`; added all referenced `lucide-react` icons (`Globe2`, `Volume2`, `FolderOpen`, `Maximize2`, `Minimize2`, `Check`, `Link`, `AlertCircle`, `Info`); switched `GLTFLoader` import from the deprecated `three/examples/jsm/loaders/GLTFLoader` path to `three/addons/loaders/GLTFLoader.js`.
- **Hardcoded user path** — `api_bridge.py:get_local_asset` no longer falls back to `C:/Users/sandr/Downloads`; uses `os.path.expanduser("~/Downloads")`.
- **glama.json drift** — corrected `framework` (FastMCP 3.2+) and `tools` count (16).

## [0.3.1] - 2026-04-04

### Changed
- **Billing Clarification**: Added prominent warnings across `README.md`, `CHANGELOG.md`, and the `worldlabs_help` tool regarding the separation of Web App and API Platform credits.
- **Improved Error Messaging**: Hardened the 402 "Payment Required" exception handler to explicitly mention that web app credits are not valid for API access.
- **Accessibility Fix**: Converted boolean `aria-selected` and `aria-pressed` values to string literals in `world-gen.tsx` for proper HTML/JSX compliance.

## [0.3.0] - 2026-04-04

### Added
- **`worldlabs_help` tool** — structured API reference at three detail levels:
  - `quick` — tool names + one-line descriptions
  - `standard` (default) — names, descriptions, args, returns, workflow, model reference
  - `verbose` — full docstrings, examples, notes, World Labs company context, output format docs, pricing note, gallery download guidance
  - Optional `topic` filter: `generate`, `upload`, `poll`, `world`, `meta`
  - `_TOOL_CATALOG`, `_MODELS`, `_WORKFLOW`, `_WORLDLABS_CONTEXT` constants in `server.py` for maintainability
- **Full test scaffold** (`tests/test_generation_scaffold.py`):
  - Five interesting Marble 0.1-mini prompts: gothic cathedral magic shop, Fallingwater exterior, Fallingwater interior, Victorian botanical conservatory, abandoned Soviet research station
  - Live test fixtures guarded by `@pytest.mark.live` + `WORLDLABS_API_KEY` skip guard
  - Tests: generate + poll + world detail round-trip, `wait_for_world` helper, `list_worlds` post-generation
  - `_generate_and_poll` helper with configurable poll interval and deadline
- **Help tool test suite** (`tests/test_help_tool.py`):
  - Tool registry assertions (all 12 tools including `worldlabs_help`)
  - Per-detail-level response shape validation (quick, standard, verbose)
  - Verbose: worldlabs_context keys, output_formats, pricing, company info
  - Topic filter: generate, upload, poll, invalid fallback
  - Default detail level assertion
  - Invalid detail level graceful fallback
- **Webapp Help page rebuild** (`web_sota/src/pages/help.tsx`):
  - Collapsible sections with expand/collapse state
  - Detail level switcher: quick / standard / verbose
  - Group filter: generate / upload / poll / world / meta / all
  - Expandable per-tool cards with args, docstring (verbose), example (verbose), notes
  - New sections: "What is this?", "World Labs — The Company & Marble API", "Spatial Intelligence Landscape (2026)", "Gallery & Download"
  - World Labs company history, Fei-Fei Li background, Marble pipeline description
  - Output format docs: SPZ, GLB, panorama, thumbnail/caption
  - 2026 LWM landscape: generative/persistent vs latent/predictive vs interactive vs industrial
  - Gallery download guidance (interactive browser task, no API endpoint)
  - External links section

### Changed
- Help page is now collapsible-section based rather than a flat list of static cards
- `worldlabs_help` is the authoritative tool reference; webapp help.tsx mirrors its tool catalog

## [0.2.1] - 2026-04-02

### Changed
- Synchronized core and dashboard versions to 0.2.1.
- Updated documentation for local LLM refinement.

### Fixed
- **Dashboard Crash**: Resolved `TypeError` in `availableModels` useMemo hook when LLM providers are missing or offline.

## [0.2.0] - 2026-02-25

### Added
- **SOTA 2026 Web Dashboard**: High-fidelity React dashboard for world management.
- **Prompt Refinement**: Local LLM integration (Ollama/LM Studio) for 20-line prompt optimization.
- **Unified Handoff**: Cross-MCP asset transfer to Unity3D, Resonite, and Blender.
- **History Persistence**: Backend `history.json` for session tracking across restarts.
- **Technical Specification**: Comprehensive `TECH_SPEC_MARBLE_API.md` for the bridge.
- **Local Bridge**: FastAPI server (`bridge.py`) on port 10865.

### Changed
- Refactored `RefineRequest` to support style-driven prompt optimization.
- Updated `RefinePrompt` logic to strictly aim for 20-line outputs.
- Consolidated world generation polling in the web UI.

### Fixed
- Duplicate `refine_prompt` endpoint definitions in `bridge.py`.
- ARIA accessibility lints in `world-gen.tsx`.

## [0.1.0] - 2026-02-23

### Added
- Initial release of worldlabs-mcp MCP server
- FastMCP 2.12+ integration for Claude Desktop
- `generate_world_from_text` — text prompt to 3D world
- `generate_world_from_image` — public image URL to 3D world (with panorama support)
- `generate_world_from_multi_image` — multiple images at azimuth angles
- `generate_world_from_video` — public video URL to 3D world
- `upload_and_generate` — local file upload + generation (end-to-end)
- `prepare_media_upload` — signed GCS URL for manual file upload
- `generate_world_from_media_asset` — generate from uploaded asset
- `get_operation` — single status poll
- `wait_for_world` — blocking poll with error detection and timeout
- `get_world` — fetch world details and asset URLs
- `list_worlds` — paginated world listing
- Proper error detection in `wait_for_world` (raises RuntimeError on API errors)
- `main()` entry point wired to `[project.scripts]`
- Full test suite (pytest-httpx mocks, 20+ tests)
- `scripts/run_server.py` for stdio and HTTP modes
- `glama.json` for Glama marketplace
- `mcp_config.json` example Claude Desktop config
- CHANGELOG, CONTRIBUTING, SECURITY docs
- `.python-version` pinned to 3.10
- GitHub Actions CI workflow

### Technical Stack
- Python 3.10+
- FastMCP 2.12.0+
- httpx 0.27.0+
- pytest + pytest-asyncio + pytest-httpx
- Ruff (lint + format)

[Unreleased]: https://github.com/sandraschi/worldlabs-mcp/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/sandraschi/worldlabs-mcp/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/sandraschi/worldlabs-mcp/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/sandraschi/worldlabs-mcp/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/sandraschi/worldlabs-mcp/releases/tag/v0.1.0
