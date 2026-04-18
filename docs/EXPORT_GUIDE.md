# World Labs MCP — Asset Export & DCC Integration Guide

**Version**: 0.4.0 · April 2026  
**Repo**: `d:/Dev/repos/worldlabs-mcp`  
**Ports**: Frontend 10864 · Unified Bridge 10865

---

## 1. The World Labs Production Payload

The Marble API (`api.worldlabs.ai/marble/v1`) generates **Generatively Persistent** 3D worlds. Unlike simple pixel-prediction models, Marble outputs coordinate-consistent geometry and radiance.

### Asset Structure (v0.4.0)
| Asset | Format | Purpose |
|-------|--------|---------|
| **Visuals** | `.spz` / `.rad` | 3D Gaussian Splats. High-fidelity radiance fields. |
| **Physics** | `.glb` | **Chisel** generated collision mesh (Simplified triangle mesh). |
| **Environment** | `.jpg` | 360° equirectangular environment map. |

---

## 2. Spark 2.0 & RAD Streaming

For web-based viewing and lightweight distribution, use the **`.RAD`** (Radiance Field) format.
- **LoD Support**: Progressive streaming from coarse to 100M+ point clouds.
- **HRTF Audio**: Spatialized naration via `broadcast_spatial_notification`.

---

## 3. DCC Export Pipelines

### 3.1 Blender (The Mesh & Splat Path)
**Requires**: `blender-mcp` (Port 10700)

1. The Hub bridge downloads the visual asset (`.spz`) and collision proxy (`.glb`).
2. Assets are staged in the platform-specific temp directory.
3. Call `api.exportToBlender()` to trigger the `import_file` operation in Blender.

### 3.2 Unity3D (Production Integration)
**Requires**: `unity3d-mcp` (Port 10730)

1. Assets are synced to `Assets/WorldLabs/{world_id}/`.
2. `Aras-P` Gaussian Splatting package is auto-injected.
3. Spherical Harmonic coefficients are preserved for high-fidelity view-dependent lighting.

### 3.3 Resonite (VR Immersion)
**Requires**: OSC-enabled Resonite Client (Port 9000)

1. The bridge emits OSC `/worldlabs/import` triggers.
2. The Resonite Hub listener fetches the asset via the authenticated bridge proxy.
3. Collision proxies are grounded to the virtual floor automatically.

---

## 4. Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `WORLDLABS_API_KEY` | — | Platform Authentication |
| `WORLDLABS_LOCAL_PATH` | `~/Downloads` | Sovereign Asset Serving Root |
| `WORLDLABS_BRIDGE_URL` | `http://localhost:10865` | Unified API Endpoint |

---

## 5. Toolchain Compliance
All exports are validated against the **Industrial Quality Stack** (Ruff/Biome/Just). Ensure your target MCP server is running at SOTA v1.5.0+ for stable handoff.
