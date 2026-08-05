# worldlabs-mcp — Product Requirements Document

**Version**: 0.5.0 (2026-08-05)
**Status**: Beta (shipped, actively maintained)
**Owner**: Sandra Schipal

## Purpose

worldlabs-mcp is a Model Context Protocol server that wraps the World Labs Marble API
for 3D world generation, paired with a Spark 2.0 Gaussian-splat spatial viewer. An
agent (or a human via the web dashboard) can generate navigable 3D worlds from text,
images, panoramas, multi-view sets, or video, then walk through them, ground a
spatial voice agent in scene coordinates, export to DCC tools, and stream to XR
headsets.

The product exists to make the Marble/Spark platform usable from AI coding assistants
(Claude Desktop, Cursor, opencode) and from a dedicated dashboard, without hand-rolled
REST calls.

## Architecture

```
Marble API (api.worldlabs.ai) ──► worldlabs_mcp (FastMCP 3.4+)
        │                            │
        │                            ├─► stdio transport (Claude Desktop / Cursor)
        │                            └─► FastAPI bridge (uvicorn :10865)
        │                                 ├─► REST /api/* (library, generate, plex, adb, handoff)
        │                                 └─► SSE narration bridge (spatial voice agent)
        └── Plex server (:32400) ──► /api/plex/* (Cinema Worlds; PLEX_TOKEN)
                          Vite/React webapp (:10864)
                          ├─► Spark 2.0 splat viewer (.RAD LoD streaming)
                          └─► Dashboard, Library, Portals, Reality Hub, Settings, Help
```

## Shipped Features (v0.5.0)

| Area | What |
|------|------|
| Generation | text / image / panorama / multi-image (azimuth) / video / local file upload (100 MB) / media asset flow |
| World management | list, get, delete, tags, seeds, disable_recaption, asset URLs (SPZ, GLB, panorama, thumbnail, caption) |
| Viewer | Spark 2.0 streaming splat renderer with HRTF spatial audio, WebXR handoff |
| Spatial voice agent | coordinate-anchored TTS narration over SSE bridge (edge-tts, built-in) |
| Avatars | default agent avatar GLB, avatar-mcp probe (10793) placement |
| Export | Blender, Unity3D, Resonite (OSC / ResoniteLink) |
| Plex integration | Cinema Worlds: browse libraries, stream via proxy, generate worlds from video (token from plex-mcp) |
| Community gallery | Marble Gallery page + `gallery_explore` MCP tool + `scripts/gallery_scrape.py`: browse public marble.worldlabs.ai worlds, mine prompts (10 presets mined from showpieces, credited) |
| Web dashboard | 10864 Vite/React: dashboard, library, painting portals (14 presets), reality hub (ADB), settings, help, logs |
| XR | Quest 3 / Pico 4 / Vive streaming, ADB wizard, port-forward guidance |
| Competition | Marble Adventure — Godot 4.4 gallery with 8 Marble portals (itch draft) |
| Native | Tauri 2.0 NSIS installer with embedded PyInstaller backend |

## Non-Goals

- Not a general-purpose 3D editor (no mesh editing/UV workflows).
- Not a Plex client — Plex is a media *source* for world generation, not a library UI.
- No cloud hosting; single-workstation deployment (localhost ports 10864/10865).

## Ports

| Port | Service |
|------|---------|
| 10864 | Frontend (Vite dev server) |
| 10865 | Backend bridge (FastAPI REST + SSE, MCP HTTP) |
| 32400 | Plex server (external, read-only access) |

## Stack

FastMCP 3.4+ (Python) · FastAPI · Vite + React + Tailwind · Tauri 2.0 (NSIS) ·
PyInstaller · uv/just · ruff + biome.
