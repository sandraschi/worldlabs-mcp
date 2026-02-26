# World Labs MCP — Asset Export & DCC Integration Guide

**Version**: 0.2.0 · February 2026  
**Repo**: `d:/Dev/repos/worldlabs-mcp`  
**Ports**: Frontend 10864 · Backend 10865

---

## 1. What World Labs / Marble Generates

The Marble API (`api.worldlabs.ai/marble/v1`) takes text, image, or video input and returns a fully navigable 3D world. Generation takes ~5 minutes (`Marble 0.1-plus`) or ~40s (`Marble 0.1-mini`).

### Asset payload (actual API response)

```json
{
  "assets": {
    "caption": "AI description of the scene",
    "thumbnail_url": "https://...",
    "splats": {
      "spz_urls": {
        "100k":     "https://...  ← fast preview, ~5MB",
        "500k":     "https://...  ← balanced, ~25MB",
        "full_res": "https://...  ← max quality"
      }
    },
    "mesh": {
      "collider_mesh_url": "https://....glb  ← physics/collision geometry"
    },
    "imagery": {
      "pano_url": "https://...  ← 360° equirectangular image"
    }
  }
}
```

### Critical distinction
- **SPZ = the visual world**. SPZ is Google's compressed Gaussian Splat format. All visual fidelity lives here.
- **GLB = the physics skeleton**. The collider mesh is a simplified, low-poly GLB — intended for collision detection, not rendering.

---

## 2. SPZ / Gaussian Splat Explained

Gaussian Splats represent a scene as millions of 3D Gaussians (ellipsoids) with colour and opacity, reconstructed from real photos/video. They render via ray splatting rather than rasterisation.

**SPZ** is Google/Niantic's compressed variant of the standard `.ply` splat format — roughly 10× smaller. The Marble API always returns SPZ.

### SPZ conversion
If a tool doesn't support SPZ natively → convert at [spz.world](https://spz.world) or via the `spz` Python package:
```bash
pip install spz
spz convert input.spz output.ply
```

---

## 3. worldlabs-mcp Webapp (Built Feb 2026)

### Architecture
```
Browser (port 10864)          ← React + Vite + TailwindCSS
        │  HTTP proxy
FastAPI bridge (port 10865)   ← web/backend/bridge.py
        │  REST
api.worldlabs.ai              ← Marble API
```

### Pages
| Route | Purpose |
|---|---|
| `/` | Dashboard — API key status, quick stats |
| `/tools` | **World Generation** — text/image/video input, live polling, asset download |
| `/viewer` | **Splat Viewer** — in-browser Gaussian Splat renderer |
| `/tools-explorer` | All 8 MCP tools with parameter reference |
| `/local-llm` | Ollama / LM Studio model discovery |
| `/apps` | Fleet hub (other MCP servers) |
| `/help` | Getting started, API key setup |
| `/settings` | API key, model, port configuration |

### World Generation page — AssetPanel

After a world finishes generating, each `OperationCard` shows:

**Download buttons**:
- `SPZ 100k` — Fast preview splat (~5MB)
- `SPZ 500k` — Balanced splat (~25MB)  
- `SPZ Full` — Full resolution splat (large)
- `GLB Mesh` — Collider geometry (.glb)
- `Panorama` — 360° image (.jpg)
- `View in Marble` — Opens the world in the official marble.worldlabs.ai viewer

**Export to DCC** (requires target app + MCP running):
- 🎨 **Blender** — Downloads SPZ + GLB locally, imports via blender-mcp
- 🎮 **Unity3D** — Downloads GLB + SPZ, copies to `Assets/WorldLabs/` via unity3d-mcp
- 🌐 **Resonite** — Sends OSC message `/worldlabs/import {mesh_url} {world_name}` to running Resonite client

**View in Splat Viewer** — Opens `/viewer?url={spz_500k_url}&name={worldName}`

---

## 4. In-Browser Splat Viewer

**Library**: `@mkkellogg/gaussian-splats-3d` v0.4+  
**Route**: `/viewer`

### Controls
- **Left-drag**: Orbit camera
- **Right-drag**: Pan
- **Scroll**: Zoom
- **Load methods**:
  - File open / drag-and-drop (`.spz`, `.ply`, `.splat`)
  - URL input (direct SPZ URL or bridge proxy URL)
  - Auto-loaded via `?url=` query param from AssetPanel

### SPZ format note
`@mkkellogg/gaussian-splats-3d` supports `.ply` and `.splat` natively. For `.spz` it attempts conversion internally. If a direct SPZ URL fails due to CORS, use the bridge proxy:
```
/api/worlds/{worldId}/download?asset_type=splat_500k&url={signedUrl}
```

---

## 5. DCC Export Detail

### 5.1 Blender

**Requires**: blender-mcp running with `BLENDER_MCP_PORT` set (default 10700)

Pipeline:
1. Bridge downloads SPZ to `%TEMP%\worldlabs\wl_{hash}.spz`
2. Calls `POST http://localhost:{port}/api/import/splat` → `import_gaussian_splat()`
3. Bridge downloads GLB to `%TEMP%\worldlabs\wl_{hash}.glb`
4. Calls `POST http://localhost:{port}/api/import/file` → `import_file(GLB)`

Result: Splat object + collision mesh appear in active Blender scene.

**Addon required**: Blender's 3DGS integration (`io_realtime_gs` or KIRI Engine addon) for the splat. The GLB imports via native Blender glTF importer.

### 5.2 Unity3D

**Requires**: unity3d-mcp running with `UNITY3D_MCP_PORT` (default 10730) and `UNITY_PROJECT_PATH` env var set.

Pipeline:
1. Download GLB → local temp path
2. `POST /api/worldlabs/import` → `WorldLabsManager.import_marble_world()`
3. Files copied to `Assets/WorldLabs/{worldName}/Splats/` and `Colliders/`

**GaussianSplatting package**: unity3d-mcp auto-adds `com.aras-p.gaussian-splatting` to `manifest.json` — Unity must be open to pull the package.

### 5.3 Resonite

**Requires**: Resonite running (desktop or headless) with OSC enabled.

Pipeline:
1. Bridge sends a UDP OSC packet to `{RESONITE_OSC_HOST}:{RESONITE_OSC_PORT}`:
   - Address: `/worldlabs/import`
   - Args: `{mesh_url: string}`, `{world_name: string}`
2. An in-world ProtoFlux script (or headless plugin) listens on this address and calls the URL loader

**In-world ProtoFlux node to wire**:  
`OSCReceiver → URL → ImportManager.ImportGLB(url)` → places the collider mesh in the active world.

---

## 6. Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `WORLDLABS_API_KEY` | — | Your World Labs API key (required) |
| `WORLDLABS_BASE_URL` | `https://api.worldlabs.ai/marble/v1` | API base |
| `BLENDER_MCP_PORT` | `10700` | blender-mcp HTTP bridge port |
| `UNITY3D_MCP_PORT` | `10730` | unity3d-mcp HTTP bridge port |
| `UNITY_PROJECT_PATH` | — | Absolute path to Unity project root |
| `RESONITE_OSC_HOST` | `127.0.0.1` | Resonite client/headless host |
| `RESONITE_OSC_PORT` | `9000` | Resonite OSC receive port |

All variables are loaded from `.env` at project root by both `start.ps1` and `bridge.py` (via `python-dotenv`).

---

## 7. MCP Tools Reference (8 tools)

| Tool | Function |
|---|---|
| `generate_world_from_text` | Text → 3D world |
| `generate_world_from_image` | Image URL → 3D world |
| `generate_world_from_video` | Video URL → 3D world |
| `generate_world_from_media_asset` | Pre-uploaded media asset → world |
| `get_operation` | Poll operation status |
| `wait_for_world` | Block until operation completes |
| `get_world` | Fetch latest world details by ID |
| `prepare_media_upload` | Get signed upload URL for local file |

---

## 8. API Costs & Rate Limits

See [docs.worldlabs.ai/api/pricing](https://docs.worldlabs.ai/api/pricing) and [docs.worldlabs.ai/api/rate-limits](https://docs.worldlabs.ai/api/rate-limits).

- `Marble 0.1-plus`: Full quality, ~5 min. Higher cost per generation.
- `Marble 0.1-mini`: Draft quality, ~40s. Good for iteration.

**Signed URLs expire** — download assets promptly after generation or re-fetch via `get_world`.
