[![FastMCP Version](https://img.shields.io/badge/FastMCP-3.2.0-blue?style=flat-square&logo=python&logoColor=white)](https://github.com/sandraschi/fastmcp) [![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff) [![Linted with Biome](https://img.shields.io/badge/Linted_with-Biome-60a5fa?style=flat-square&logo=biome&logoColor=white)](https://biomejs.dev/) [![Built with Just](https://img.shields.io/badge/Built_with-Just-000000?style=flat-square&logo=gnu-bash&logoColor=white)](https://github.com/casey/just)

# worldlabs-mcp (v0.5.0)

**MCP gateway to World Labs Marble + Spark 2.0.** Generate navigable 3D worlds from text, images, panoramas, multi-view sets, or video; view them with a streaming Gaussian-splat renderer; and ground a voice agent in scene coordinates.

## 🚀 Quick Start

1. **Setup**: `uv pip install -e ".[dev]"`
2. **Account & Key**: You need a [World Labs account](https://platform.worldlabs.ai) with API credits (separate from Web App credits). Generate a key at [platform.worldlabs.ai/api-keys](https://platform.worldlabs.ai/api-keys) and set `WORLDLABS_API_KEY` in your environment.
3. **Launch**: `.\start.ps1`

##  Webapp Dashboard

This MCP server includes a free, premium web interface for monitoring and control.
By default, the web dashboard runs on port **10864**.
*(Assigned ports: **10864** (Frontend), **10865** (Backend))*

To start the webapp dashboard and backend:
```powershell
.\start.ps1
```

### Advanced Startup Flags
- `-Headless`: Runs everything in the background (hidden windows).
- `-BackendOnly`: Starts only the Python API server (no Vite frontend).
- `-NoBrowser`: Prevents the automatic browser opening.

Access the dashboard at `http://localhost:10864`.

### 🏛️ Core Engines (v0.4.0)
- **Marble (LWM)**: The Large World Model foundation. Generatively persistent reconstructed worlds with coordinate consistency.
- **Spark 2.0 (Renderer)**: Hierarchical LoD splat trees with virtual GPU memory paging. Handles 100M+ primitives.
- **Chisel (Geometry)**: Geometric distillation pipeline for extracting watertight physics proxies and triangular meshes from radiance fields.

## 💎 Features

### Shipping
- **Marble 1.1 + 1.1-plus** world generation from text, image, multi-image, video, or local file upload.
- **Spark 2.0 Spatial Engine** — High-fidelity Gaussian-splat streaming (`.rad` / `.spz`) with hierarchical LoD and virtual GPU paging.
- **World Library** — Beautiful card/list view of all generated worlds with thumbnails, search, filters, asset downloads, and delete.
- **Painting Portals** — Generate 3D worlds from famous paintings. Mona Lisa, Starry Night, Nighthawks, and 11 more.
- **Spatial Voice Agent** — Built-in TTS (edge-tts) auto-generates audio for coordinate-grounded narration. No external service needed.
- **Default Agent Avatar** — Built-in humanoid GLB figure for populating scenes. No external model required.
- **Headless Headset Setup** — Step-by-step wizard for Quest/Pico 4 wireless streaming via ADB.
- **Resonite Import** — One-click export to Resonite via OSC or resonite-mcp.
- **Blender/Unity3D Export** — Download SPZ + GLB to temp, POST to blender-mcp/unity3d-mcp.
- **Local LLM Prompt Refinement** — Ollama/LM Studio for prompt engineering.
- **Narration SSE Stream** — Real-time spatial events for the Spark viewer (speech, audio, video, avatar).
- **avatar-mcp Integration** — List and place VRM avatars from avatar-mcp into generated worlds.

### Under Refinement
- **Automatic Grounding**: Chisel-based raycast physics for complex imported Blender meshes.
- **DCC Live Link**: Real-time transformation sync between Blender and the Spark Viewer.

## 📚 Documentation

- 📥 **[Installation](./docs/INSTALL.md)**
- 🏗️ **[Architecture](./docs/ARCHITECTURE.md)**
- 🎯 **[Prompt Engineering Guide](./docs/PROMPT_GUIDE.md)** — artist styles, landmarks, materials, weather, categories
- 🎮 **[Headset Setup Guide](./docs/HEADSET_SETUP.md)** — Connect Quest, Pico 4, or Vive for wireless streaming
- 🌐 **[World Modeling](./docs/WORLD_MODELING.md)** — spatial intelligence market context
- 🎙️ **[Spatial Voice & TTS](./docs/TTS.md)** — Gemini 3.1 Flash TTS + WebAudio HRTF
- 🥽 **[VR & WebXR](./docs/WEBXR.md)**
- 🎮 **[Headset Setup Guide](./docs/HEADSET_SETUP.md)** — Connect Quest, Pico 4, or Vive for wireless streaming
- ⚡ **[Spark 2.0](./docs/SPARK_V2.md)** — LoD splat tree, `.RAD` streaming format

> **World Labs API compatibility**: Targets the **current** Marble API (May 2026). Worlds listing uses `POST /marble/v1/worlds:list`. Multi-image uses `type: "multi-image"` with array-based `multi_image_prompt`. `prepare_media_upload` returns `required_headers`. See the **[Prompt Engineering Guide](./docs/PROMPT_GUIDE.md)** for artist styles, landmarks, materials, and weather prompting.

## 🛠️ Tools (19)

| Group | Tool |
|-------|------|
| generate | `generate_world_from_text`, `generate_world_from_image`, `generate_world_from_multi_image`, `generate_world_from_video`, `generate_world_from_media_asset` |
| upload | `upload_and_generate`, `prepare_media_upload` |
| poll | `get_operation`, `wait_for_world` |
| world | `list_worlds`, `get_world`, **`delete_world`** |
| spatial | `broadcast_spatial_notification`, `broadcast_spatial_audio`, `place_world_tv`, `spawn_agent_avatar` |
| meta | `worldlabs_help` |
| ui | `show_worlds_card`, `show_world_card` |

Generation tools now accept `seed` (deterministic generation), `tags` (organisation), and `disable_recaption` (image/video).

## 🛡️ Quality

Ruff for Python, Biome for Web, Just for automation. Pytest + pytest-httpx for the Marble wrapper. FastMCP 3.2+ with Prefab UI for in-chat rich tool results.

---
MIT License • Maintained by [sandraschi](https://github.com/sandraschi). Not affiliated with World Labs.
