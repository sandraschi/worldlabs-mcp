[![FastMCP Version](https://img.shields.io/badge/FastMCP-3.2.0-blue?style=flat-square&logo=python&logoColor=white)](https://github.com/sandraschi/fastmcp) [![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff) [![Linted with Biome](https://img.shields.io/badge/Linted_with-Biome-60a5fa?style=flat-square&logo=biome&logoColor=white)](https://biomejs.dev/) [![Built with Just](https://img.shields.io/badge/Built_with-Just-000000?style=flat-square&logo=gnu-bash&logoColor=white)](https://github.com/casey/just) [![Marble Adventure](https://img.shields.io/badge/🏆_Marble_Adventure-competition_entry-a855f7?style=flat-square)](docs/COMPETITION.md)

# worldlabs-mcp (v0.5.0)

**MCP gateway to World Labs Marble + Spark 2.0.** Generate navigable 3D worlds from text, images, panoramas, multi-view sets, or video; view them with a streaming Gaussian-splat renderer; and ground a voice agent in scene coordinates.

## Table of Contents

- 🚀 **[Setup & Quick Start](docs/SETUP.md)** — install, API key, launch
- 💎 **[Features & Tools](docs/FEATURES.md)** — 20 MCP tools, generation modes, spatial voice agent, export pipelines
- 🏆 **[Marble Adventure](docs/COMPETITION.md)** — Godot 4.4 agent-built gallery; 5+3 Marble portals; [itch draft](https://sandraschi.itch.io/marble-adventure) · [MCD](https://github.com/sandraschi/mcp-central-docs/blob/main/docs/games/MARBLE_ADVENTURE.md)
- 🏗️ **[Architecture](docs/ARCHITECTURE.md)** — system design, ports, data flow
- 🎯 **[Prompt Engineering Guide](docs/PROMPT_GUIDE.md)** — artist styles, landmarks, materials, categories
- 🥽 **[VR & WebXR](docs/WEBXR.md)** — Quest, Pico 4, Vive streaming
- 🎙️ **[Spatial Voice & TTS](docs/TTS.md)** — edge-tts narration, audio spatialization
- ⚡ **[Spark 2.0 Renderer](docs/SPARK_V2.md)** — LoD splat tree, `.RAD` streaming, virtual paging
- 🎮 **[DCC Export](docs/EXPORT_GUIDE.md)** — Blender, Unity3D, Resonite pipelines
- 🌐 **[World Modeling](docs/WORLD_MODELING.md)** — spatial intelligence landscape

## Quickest Start

```powershell
git clone https://github.com/sandraschi/worldlabs-mcp
cd worldlabs-mcp
just bootstrap
just serve
```

Opens the web dashboard at `http://localhost:10864`. Get your API key at [platform.worldlabs.ai/api-keys](https://platform.worldlabs.ai/api-keys).

---

MIT License • Maintained by [sandraschi](https://github.com/sandraschi). Not affiliated with World Labs.
