[![FastMCP Version](https://img.shields.io/badge/FastMCP-3.2.0-blue?style=flat-square&logo=python&logoColor=white)](https://github.com/sandraschi/fastmcp) [![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff) [![Linted with Biome](https://img.shields.io/badge/Linted_with-Biome-60a5fa?style=flat-square&logo=biome&logoColor=white)](https://biomejs.dev/) [![Built with Just](https://img.shields.io/badge/Built_with-Just-000000?style=flat-square&logo=gnu-bash&logoColor=white)](https://github.com/casey/just)

# worldlabs-mcp (v0.4.0)

**MCP gateway to World Labs Marble + Spark 2.0.** Generate navigable 3D worlds from text, images, panoramas, multi-view sets, or video; view them with a streaming Gaussian-splat renderer; and (work-in-progress) ground a voice agent in scene coordinates.

## 🚀 Quick Start

1. **Setup**: `uv pip install -e ".[dev]"`
2. **Key**: Set `WORLDLABS_API_KEY` environment variable (get one at https://platform.worldlabs.ai/api-keys).
3. **Launch**: `python scripts/run_server.py`

## 💎 Features

### Shipping
- **Marble 1.1 + 1.1-plus** world generation from text, image, multi-image, video, or local file upload.
- **Operation polling** (single-shot `get_operation` + blocking `wait_for_world`) with World Labs-specific 401/402/429 error handling.
- **Local bridge webapp** (Vite + React + TS under `web_sota/`, FastAPI on port 10865) with prompt history, LLM-refined prompts via Ollama/LM Studio, and DCC handoff to Blender / Unity / Resonite.
- **`worldlabs_help` tool** with three detail levels (quick / standard / verbose) and topic filtering.

### Speculative (scaffolded, not fully wired)
- **Spark 2.0 viewer page** — streams `.rad` / `.spz` Gaussian-splat worlds using `@sparkjsdev/spark@2.0.0`, with in-browser LoD, WebXR-ready.
- **Spatial Voice Agent** — posts narration events to an SSE bridge; the viewer plays the audio through a WebAudio `PannerNode` (HRTF) at scene coordinates. End-to-end needs `speech-mcp` for TTS output.
- **Scene primitives** — `broadcast_spatial_audio`, `place_world_tv`, `spawn_agent_avatar` for agent-driven scene composition.

## 📚 Documentation

- 📥 **[Installation](./docs/INSTALL.md)**
- 🏗️ **[Architecture](./docs/ARCHITECTURE.md)**
- 🌐 **[World Modeling](./docs/WORLD_MODELING.md)** — spatial intelligence market context
- 🎙️ **[Spatial Voice & TTS](./docs/TTS.md)** — Gemini 3.1 Flash TTS + WebAudio HRTF
- 🥽 **[VR & WebXR](./docs/WEBXR.md)**
- ⚡ **[Spark 2.0](./docs/SPARK_V2.md)** — LoD splat tree, `.RAD` streaming format

## 🛠️ Tools (16)

| Group | Tool |
|-------|------|
| generate | `generate_world_from_text`, `generate_world_from_image`, `generate_world_from_multi_image`, `generate_world_from_video`, `generate_world_from_media_asset` |
| upload | `upload_and_generate`, `prepare_media_upload` |
| poll | `get_operation`, `wait_for_world` |
| world | `list_worlds`, `get_world` |
| spatial *(speculative)* | `broadcast_spatial_notification`, `broadcast_spatial_audio`, `place_world_tv`, `spawn_agent_avatar` |
| meta | `worldlabs_help` |

## 🛡️ Quality

Ruff for Python, Biome for Web, Just for automation. Pytest + pytest-httpx for the Marble wrapper. FastMCP 3.2+ with Prefab UI for in-chat rich tool results.

---
MIT License • Maintained by [sandraschi](https://github.com/sandraschi). Not affiliated with World Labs.
