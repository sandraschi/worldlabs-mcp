# Features & Tools

## Core Engines

| Engine | Role |
|--------|------|
| **Marble (LWM)** | Large World Model — generates persistent, coordinate-consistent 3D worlds from text/image/video |
| **Spark 2.0** | Gaussian splat renderer — hierarchical LoD, virtual GPU paging, 100M+ primitives, WebXR |
| **Chisel** | Geometry distillation — extracts watertight collision meshes (GLB) from radiance fields |

## 21 MCP Tools

### World Generation (6)

| Tool | Input | Model |
|------|-------|-------|
| `generate_world_from_text` | Text prompt | marble-1.1 / marble-1.1-plus |
| `generate_world_from_image` | Public image URL | marble-1.1 |
| `generate_world_from_multi_image` | 2–8 images + azimuth angles | marble-1.1 |
| `generate_world_from_video` | Public video URL | marble-1.1 |
| `generate_world_from_media_asset` | Pre-uploaded asset ID | marble-1.1 |
| `upload_and_generate` | Local file (end-to-end) | marble-1.1 |

All accept `seed` (deterministic), `tags`, and `disable_recaption`.

### Upload (1)

| Tool | Description |
|------|-------------|
| `prepare_media_upload` | Get signed GCS upload URL for manual two-step flow |

### Polling (2)

| Tool | Description |
|------|-------------|
| `get_operation` | Single-shot status check |
| `wait_for_world` | Blocking poll (default 90s timeout) |

### World Management (3)

| Tool | Description |
|------|-------------|
| `list_worlds` | Paginated world library (newest first) |
| `get_world` | Full details: SPZ, GLB, panorama, thumbnail, caption |
| `delete_world` | Permanent removal |

### Spatial Scene Tools (4)

| Tool | Description |
|------|-------------|
| `broadcast_spatial_notification` | Speak text at a 3D coordinate (edge-tts) |
| `broadcast_spatial_audio` | Play ambient audio/music at a 3D coordinate |
| `place_world_tv` | Spawn a virtual 16:9 video screen in the 3D scene |
| `spawn_agent_avatar` | Place a humanoid GLB avatar (raycast-grounded) |

### Meta & UI (3)

| Tool | Description |
|------|-------------|
| `worldlabs_help` | Structured API reference (3 detail levels) |
| `show_worlds_card` | Rich in-chat world library |
| `show_world_card` | Rich in-chat single world view |

### Refinement (1)

| Tool | Description |
|------|-------------|
| `refine_with_local_llm` | Expand a short prompt via Ollama/LM Studio |

### Community Gallery (1)

| Tool | Description |
|------|-------------|
| `gallery_explore` | Portmanteau: `browse` (tag tabs), `world` (detail), `prompts` (mining list), `search` (keyword AND across title/prompt/owner/tags) |

Public worlds from marble.worldlabs.ai — each entry carries the creator's original
prompt, seed, owner, and SPZ/minimap asset URLs. Webapp page `/gallery`, bridge
`GET /api/gallery` + `GET /api/gallery/search`, bulk script `scripts/gallery_scrape.py`.
Prompts are the creators' originals — credit owners when reusing.

## Shipping

### Marble Adventure (competition game)

Godot 4.4 FPS hub with **8 ring portals** (A–H) into real **Marble 1.1** Gaussian splat worlds in the browser. Players need **no World Labs account** (`public_marble` default).

| | |
|--|--|
| **Play** | `just marble-adventure-play` |
| **Ship** | `just marble-adventure-ship-push` (Butler, hidden channel) |
| **itch** | [sandraschi.itch.io/marble-adventure](https://sandraschi.itch.io/marble-adventure) (draft) |
| **Docs** | [COMPETITION.md](./COMPETITION.md) · [PRD](./PRD_MARBLE_ADVENTURE.md) · [MCD games page](https://github.com/sandraschi/mcp-central-docs/blob/main/docs/games/MARBLE_ADVENTURE.md) |

- **Painting Portals** — 14 famous paintings as image-to-world seeds
- **Spatial Voice Agent** — Built-in TTS (edge-tts), no external service needed
- **Default Agent Avatar** — Procedural 2KB GLB humanoid figure
- **Headless Headset Setup** — Quest/Pico 4/Vive wireless ADB wizard
- **DCC Export**: Blender (SPZ+GLB), Unity3D, Resonite (OSC)
- **Narration SSE Stream** — Real-time spatial events for Spark viewer
- **avatar-mcp Integration** — VRM avatar placement from avatar-mcp
- **Step into worlds**: Overte export spawns a world's GLB mesh + viewer panel
  in a domain (auto-start chain), Resonite import via resonite-mcp
- **Hub life**: potted plants, benches, standing lamps, rotating beacon,
  orbiting light orbs, pulsing floor rings — all animated, no shaders
- **Webapp launcher**: Apps page Play button starts the Godot hub
  (`/api/marble-adventure/launch`); hero prompts in WORLD_PROMPTS.md

## Under Refinement

- Automatic Chisel grounding for complex Blender meshes
- DCC Live Link — real-time transform sync with Blender
