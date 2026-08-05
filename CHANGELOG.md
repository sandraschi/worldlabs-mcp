# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed (2026-08-05)
- **Reality Hub (/immersive) crashed to a blank page** - ExternalLink used at
  web_sota/src/pages/immersive-detail.tsx was never imported from lucide-react,
  throwing ReferenceError: ExternalLink is not defined at render. Import added; tsc --noEmit clean.
- **Plex integration token wired up** - PLEX_BASE_URL + PLEX_TOKEN copied from
  plex-mcp/.env into .env (token read at import time in api_bridge.py).
  GET /api/plex/status now reports the live server. .env.example documents both vars.

### Added (2026-08-05)
- **Marble Community Gallery webapp page** (/gallery) - browse public worlds from
  marble.worldlabs.ai with tag tabs (curated/stylized/realism/interior/hq/fantasy/sci-fi),
  pagination, prompt expand/copy, "Use prompt" seeding the Architect, and per-entry
  attribution. Backed by GET /api/gallery on the bridge (60s TTL cache).
- **gallery_explore MCP tool** - portmanteau (browse | world | prompts) over the public
  gallery API for agents: prompt mining, world detail, asset URLs.
- **10 presets mined from community showpieces** in web_sota/src/lib/presets.ts
  (Lisbon Tram, Wild West Town, Tokyo Oden Alley, Retro Diner, Sorcerer's Hallway,
  Temple of Sacred Statues, Tokyo Vinyl Bar, Bayou PI Office, Orbital Research Station,
  Rustic Cabin Winter) - each credited to its original creator.
- **scripts/gallery_scrape.py** - polite bounded scraper for the same public API.
- **Step into Marble worlds**: fixed resonite-mcp import endpoint mismatch (now calls the real /api/resonite/integrations/worldlabs); new POST /api/export/overte spawns the world's GLB mesh + viewer panel in an Overte domain via the overte-mcp bridge (auto-fetches mesh from the Marble API when not supplied); spark-viewer gained a 'Spawn world in domain' button.
- **Marble Adventure hero worlds**: authored competition/marble-adventure/WORLD_PROMPTS.md with 8 stunning Marble-optimized prompts + seeds for regeneration.
- **gallery_explore search operation** + GET /api/gallery/search - keyword search (AND tokens, case-insensitive) over title/prompt/owner/tags with bounded per-tag page scans and TTL cache; tag='all' scans every tab.

### Added (Tauri desktop — June 2026)
- Tauri native wrapper (`native/`) with `bundle.resources` + `std::process::Command` sidecar spawn
- CUA-NSIS: `just cua-nsis-test` recipe, `scripts/cua-smoke.py`, `scripts/cua-nsis-config.json`
- Tauri CORS: `tauri://localhost` origins for WebView API access
- NSIS installer at `dist/` and `native/target/release/bundle/nsis/`
- Frontend API calls use absolute `http://127.0.0.1:{port}` URLs in production build

### Changed (audit remediation — 2026-07-12)
- **Version unified to 0.5.0** across pyproject, mcpb manifest/pyproject, tauri.conf.json, Cargo.toml, web package.json; `__init__.py` now single-sources `__version__` from installed metadata; server.py FastMCP/FastAPI read it.
- **glama.json** corrected: 20 tools, FastMCP 3.4+.
- `just pack` / `just validate` now stage-sync `src/` into `mcpb/` and run mcpb inside `mcpb/` (previously broken: no root manifest.json).

### Removed (audit remediation — 2026-07-12)
- Stale transpiled `web_sota/src/main.js` / `App.js` (dead May-era CommonJS output).
- `web_sota/vite.config.js` — it shadowed `vite.config.ts` in Vite's resolve order, making the TS config dead; the TS config's `__dirname` fixed for ESM.
- Loose duplicate `mcpb/src/*.py` files; tracked `stderr.txt`/`stdout.txt` and `start.ps1.bak.*`.

### Security (audit remediation — 2026-07-12)
- **CORS wildcard removed** — bridge no longer allows `*` origin with credentials; explicit allow-list (frontend + tauri origins, `WORLDLABS_EXTRA_ORIGINS` to extend).
- **`GET /api/handoff` SSRF guard** — proxy restricted to `worldlabs.ai` / `storage.googleapis.com` host suffixes (`WORLDLABS_HANDOFF_ALLOWED_HOSTS` to extend); was an open URL proxy reachable from any local browser tab.
- MCP bridge proxy registration failures are now logged instead of silently swallowed.

### Added (Marble Adventure — June 2026)
- **Vision pass (P6)** — Alphabetic portals A–H; shape tour puzzle; architect tokens; 3 fleet terminals; E-key portal agent notes; Fleet Museum title screen; layered procedural hub ambient; `SparkNarrator` autoload for local Spark TTS welcome.
- **`data/portal_meta.json`** — kiosk copy, fleet tools, Spark welcome lines per portal.
- **`WORLD_PROMPTS.md`** — multiline gallery-style Marble regen prompts; **`regenerate_worlds.ps1`** + `just marble-adventure-regen-worlds`.
- **itch ship pipeline** — `ship-itch.ps1`, `export_presets.cfg`, hidden Butler push to `sandraschi/marble-adventure:win`; [SHIP_ITCH.md](competition/SHIP_ITCH.md).
- **Docs** — [PRD_MARBLE_ADVENTURE.md](docs/PRD_MARBLE_ADVENTURE.md), [competition/README.md](competition/README.md), MCD [docs/games/MARBLE_ADVENTURE.md](https://github.com/sandraschi/mcp-central-docs/blob/main/docs/games/MARBLE_ADVENTURE.md).

### Added (Marble Adventure — initial)
- **8 Marble 1.1 worlds** — Gothic Cathedral, Sea of Fog, Midcentury Villa, Wonderland, Deep Forest, Neon Alley, Zen Temple, Sunken Ruins. Generated from detailed 100+ word prompts with `marble-1.1` model.
- **World panoramas & thumbnails** — downloaded for each competition world, used as preview images in portal rings.
- **Spark 2.0 viewer URLs** in portal configs — opens minimal viewer (no World Labs UI chrome) on local webapp port 10864.
- **World Library page** (`web_sota/src/pages/library.tsx`) — dedicated `/library` route with card grid and table list views, thumbnail display with lazy backfill, search by name/caption, model filter chips, per-card asset downloads (SPZ/G LB/Panorama), "View in Spark 2.0" links, auto-refresh every 30s, and empty/loading/error states.
- **Prompt Engineering Guide** (`docs/PROMPT_GUIDE.md`) — comprehensive reference covering artist styles (Giger ✓, Monet ✗), landmarks, materials selection, weather/season prompting, architectural styles, the "archetype not reference" rule, and a structured prompt template. Linked from the webapp Help page.
- **15 high-detail world presets** — each 100-200 words with specific spatial layout, dimensions, materials, lighting, and colour palette. Replaced the old short 1-2 sentence presets. Each tagged with categories (interior, exterior, nature, fantasy, scifi, urban, etc.) with filter chips in the Style Gallery.
- **`delete_world` MCP tool** — permanently removes a world and all its assets. 17th MCP tool. Available in the Library page via trash icon on each card/row.
- **`seed` parameter** on all generation tools — enables deterministic world generation (0 to 2^32-1).
- **`tags` parameter** on all generation tools — tag worlds on creation for organisation.
- **`disable_recaption` parameter** on image/video generation — prevents the API from rewriting your text prompt.
- **`GET /api/media-assets/{id}`** — lightweight endpoint to query uploaded media asset metadata without downloading.
- **Category filter chips** in Style Gallery — filter 15 presets by category (interior, exterior, nature, fantasy, scifi, urban, sacred, industrial, ruins, surreal, domestic, landmark, historical).
- **Built-in TTS engine** (`src/worldlabs_mcp/tts.py`) — auto-generates audio for `broadcast_spatial_notification` via edge-tts. Speaker no longer needs speech-mcp running separately.
- **Default agent avatar** (`src/worldlabs_mcp/default_agent.py`) — generates a 2KB GLB humanoid figure. `spawn_agent_avatar(avatar_url="default_agent")` now produces a actual in-world figure.
- **Painting Portals page** (`/portals`) — 14 public-domain paintings as image-to-world seeds. Click a painting → generates 3D world via Marble → "Enter the Painting" link to Spark viewer. Live elapsed timer, SSE progress.
- **File upload tab** in generation page — drag-and-drop local image/video files. Supports JPG, PNG, WebP, MP4, MOV, MKV. Handles prepare_upload → PUT to GCS → generate server-side via `POST /api/generate/upload`.
- **Headset Setup page** (`/onboarding`) — step-by-step wizard for Quest/Pico 4 wireless setup. Live ADB device detection via `GET /api/adb/devices`. Copy-to-clipboard command builder. Troubleshooting guide.
- **Headset Setup guide** (`docs/HEADSET_SETUP.md`) — covers ADB installation, Developer Mode, USB debugging, wireless ADB, port forwarding, and "Enter VR" troubleshooting for Quest, Pico 4, Vive, and Vision Pro. Includes Resonite import guide.
- **Reality Hub accordion refactor** — `/immersive` page converted from a crowded single-page layout to collapsible sections (Protocols, Connection Wizard, Spark Controls). Connection wizard has live ADB device scanning.
- **avatar-mcp integration** — `GET /api/avatars/status` probes avatar-mcp on port 10793. `POST /api/avatars/place` fetches an avatar GLB and pushes it into the Spark viewer via narration SSE.
- **Spark viewer CORS proxy** — `GET /api/handoff?url=` streams remote SPZ/GLB files through the bridge to avoid CORS issues with Marble CDN.
- **Resonite export with resonite-mcp support** — `POST /api/export/resonite` now tries resonite-mcp (port 10715) first for ResoniteLink import, falls back to direct OSC.

### Changed
- **Spark viewer camera** — initial position from `(-1, -4, 6)` looking up to auto-fit. Uses `Box3.setFromObject()` to compute splat bounding box once loaded. Detects interior vs exterior from proportions: interiors start **inside** the space at centre, exteriors start outside at 1.5× distance. Loading spinner stays visible until splat finishes downloading.
- **Spark viewer OrbitControls** — `minPolarAngle`/`maxPolarAngle` to prevent going under/over, zoom limits, ground-plane panning, and explicit `controls.update()` after position changes.
- **Spark viewer renderer** — `alpha: false` (was `true`) to fix compositing black-screen issue. Added explicit resize on initialization and `fullscreenchange` listener.
- **Spark viewer XR stabilisation removed** — the localFrame hack that fought OrbitControls every frame is removed. Controls no longer fight the render loop.
- **Reality Hub** — converted from a single dense page to accordion sections. Added live ADB device detection panel.
- **Version bumped** — `0.4.0` → `0.5.0`.
- **World Library replaces old viewer page** — `/library` now shows the full world library. The legacy Gaussian splat viewer moved to `/library/viewer`.
- **Sidebar navigation** — "World Library" icon changed from `Globe2` to `Library`. Sidebar nav still points to `/library`.
- **Spatial tools promoted from speculative** — removed "(speculative)" labels from all four spatial tools (`broadcast_spatial_notification`, `broadcast_spatial_audio`, `place_world_tv`, `spawn_agent_avatar`). They now fail loud with exceptions instead of silently returning error strings.
- **`broadcast_spatial_audio` docstring** — corrected to describe URL-based audio playback. Removed misleading "Lyria / VeoGen generation not wired up" note.
- **Startup scripts fixed** — `web_sota/start.ps1` `PYTHONPATH` now points to repo root `src/` (was `web_sota/;web_sota/src/`). Root `start.ps1` rewritten to use correct ports (10864/10865) and uvicorn HTTP mode instead of stdio MCP mode.
- **World Labs API compatibility**: Multi-image format updated to new spec (`type: "multi-image"`, array-based `multi_image_prompt` with `azimuth`/`content`). Upload response field `headers` → `required_headers`. Worlds listing endpoint changed from `GET /worlds` to `POST /worlds:list` with JSON body.
- **`world_id` field** — Marble API now returns `world_id` instead of `id` in World objects. Frontend `World` interface updated to accept both with fallback.
- **Imports modernized**: `AsyncGenerator` from `collections.abc` (not `typing`), `list` instead of `typing.List`, unused imports removed.
- **`subprocess` security**: Changed nvidia-smi from `shell=True` to explicit command list.
- **Model defaults**: `marble-1.1` remains the default. New `marble-1.0-draft` cheaper tier documented.

### Fixed
- **`_get_disk_usage_percent` undefined** (`api_bridge.py:370`) — added missing function.
- **Broken local asset route** (`api_bridge.py:511`) — restored missing route decorator and function signature for `serve_local_asset`, added path traversal protection.
- **`logger` redefinition** (`api_bridge.py:22`) — removed duplicate import shadowing the module-level logger.
- **`broadcast_spatial_notification` silent degradation** — removed `try/except Exception` that swallowed all errors. Now raises properly like other spatial tools.
- **Hardcoded Plex token** (`api_bridge.py:60`) — removed default fallback token. `PLEX_TOKEN` must now be set via environment variable or returns a 400 error.
- **Worlds list 404** — changed from `GET /worlds` (returned 404) to `POST /worlds:list` with JSON `{"page_size", "sort_by", "status"}`.
- **`api.js` / `utils.js` stale fallbacks** — removed `.js` files shadowing TypeScript sources in `lib/`. `api.js` was missing `getWorldsRemote` causing library page crash.
- **Trailing/blank-line whitespace** — cleaned up 30+ instances across server.py and api_bridge.py.
- **RUF010 f-string**: `str(e)` → `{e!s}` in server.py broadcast handler.
- **B905 zip strict**: Added `strict=True` to zip in `generate_world_from_multi_image`.
- **Plex exception chain**: Added `raise ... from e` to preserve exception context.
- **E501 line length**: Broke up Plex thumbnail URL construction across two lines.

### Security
- **Hardcoded Plex token removed** — the fallback default `"oGA9iEfVYh8ATXmzYrU8"` is removed. `PLEX_TOKEN` env var is now required for Plex features.
- **Path traversal**: `serve_local_asset` validates resolved path stays within `local_root`.
- **`shell=True` removed**: nvidia-smi now uses explicit argument list.

### Tests
- **New tests (9)**: `upload_and_generate` (happy path, file not found, invalid kind), `generate_world_from_text_payload_format` (match_json verification), `broadcast_spatial_notification` (success + no-bridge), `broadcast_spatial_audio`, `place_world_tv`, `spawn_agent_avatar`.
- **API format alignment**: Multi-image test uses `match_json` to verify exact payload shape. Upload mock uses `required_headers`. Worlds list test updated from GET to POST.
- **Coverage**: 49 offline tests. All server.py MCP tools covered.

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
