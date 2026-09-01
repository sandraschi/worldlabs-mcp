# Models, Pricing & Atlas — Marble World Models

> **Source of truth for model selection in `worldlabs-mcp`.**
> Synthesized from `docs.worldlabs.ai` (`marble/models` + `api/models` + `api/pricing` + `marble/support/account-billing` + blog `2026-09-01 Atlas` + `2026-07-28 R2S2R`) and `marble.worldlabs.ai/pricing`. Fee note: browser (Marble) and API (Platform) are separate credit pools — see `BILLING.md`.

## 1. Current Model Map

| Marble (web) | API `model` param | `worldlabs-mcp` param | Speed | Price (Platform) | Use |
|--------------|-------------------|-----------------------|-------|------------------|-----|
| **Marble 1.1 Plus** | `marble-1.1-plus` | `model="marble-1.1-plus"` | ~5 min (variable) | **1500 + 0–1500** variable (auto-expanded larger worlds) | Outdoor, architecture, large interiors — biggest worlds |
| **Marble 1.1** | `marble-1.1` | `model="marble-1.1"` **(recommended default)** | ~5 min | **1500** fixed | Default for new worlds; drop-in better fidelity vs 1.0 |
| **Marble 1.0** | `marble-1.0` | `model="marble-1.0"` | ~5 min | **1500** | Legacy — retained |
| **Marble 1.0 Draft** | `marble-1.0-draft` | `model="marble-1.0-draft"` | **~20s** | **150** | Iteration / prompt testing |

Legacy alias warning (will be removed): `Marble 0.1-plus → marble-1.0`, `Marble 0.1-mini → marble-1.0-draft` (`docs.worldlabs.ai/api/models` yellow box). Default today is `marble-1.0` for compat, **will become `marble-1.1`** — pin `model` explicitly in your calls to avoid drift (`server.py` already defaults `marble-1.1`).

```python
# worldlabs-mcp — always pin model
await generate_world_from_text(text_prompt="misting courtyard", model="marble-1.1", seed=42)
await generate_world_from_video(video_url="https://...", model="marble-1.1-plus")
```

### Pricing math (Platform, not Marble)

* Standard `marble-1.1/1.0` = 1500 + input credits (single image ~80) — e.g. `1,580` for `single image` in billing example; multi-image + 2×edit + expand = `3,900` in `account-billing` walkthrough.
* `marble-1.1-plus` = 1500 + up to 5×300 for dynamic cubes (blog: 0–1500). Observed worst ≈ 3000.
* Draft = 150 flat — cheapest for the `"does this prompt work?"` loop.
* Overage: requests are admitted at low-balance threshold, not per-request cost estimate — balance can go negative and be invoiced at month end at your credit rate (~1250 cr / $1 on standard pay-as-you-go; `api/faq: Why was I charged...`).

### When to use which

* **Iterating:** `draft` → `1.1` once happy.
* **Small indoor / object:** `1.1` (fixed, predictable).
* **Large exterior / city block / "bigger and better worlds" (blog Sep 16 2025) scenario:** `1.1-plus` — auto-scales, same 1500 base but pays for size you actually get.

## 2. Input-Specific Generation Times (Marble web; API ~same)

| Input | Time |
|-------|------|
| Draft (any) | ~20s |
| Pano from text/image/3D structure | ~30s |
| Multi-image / video → draft | ~2 min |
| World (any) / Expand | ~5 min |
| Edit pano | ~20s |
| High-quality mesh | ~1h |

Videos/mesh are the long poles — `wait_for_world` default 90s will often need `120–300s` for video; poll `get_operation` if you want streaming ticks.

## 3. Outputs & Semantics — Getting Splats Right

Every `get_world(world_id)` (or `operation.response`) contains:

```
world.assets.splats.spz_urls: { "100k": "...", "500k": "...", "full_res": "..." }
world.assets.splats.semantics_metadata: { metric_scale_factor: float, ground_plane_offset: float }
world.assets.mesh.collider_mesh_url: GLB (watertight collider, not render mesh)
world.assets.imagery.pano_url: equirect JPEG + thumbnail
caption, view_url (Marble viewer)
```

* SPLAT URLs are **signed GCS, ~1h expiry**; mesh persists longer. `proxy_splat_asset` / `downloadAssetUrl` in `api.ts` proxies with CORS.
* **Metric conversion is not optional** for downstream physics/game engines (added Jan 1 2026: assets now "roughly scaled and grounded"). Raw SPZ is `marble_raw_opencv`; after metric + ground you still need your engine's `marble_raw_opencv → OpenGL/three.js` flip (Atlas docs confirm Marble viewer does X-180°):

```python
import math, numpy as np
def to_metric(center, linear_scale, log_scale, meta):
    s = meta["metric_scale_factor"]
    center_metric = center * s
    center_metric[...,1] -= meta["ground_plane_offset"]   # only centers
    linear_metric = linear_scale * s
    # if decoder gave log scales:
    log_metric = log_scale + math.log(s)  # not log_scale * s
    return center_metric, linear_metric, log_metric
# then: apply engine axis flip (not in semantics_metadata)
```

* **Export gates:** Browser `Standard` covers SPZ/PLY@pano+GLB collider; `Pro` adds HQ textured GLB + commercial rights (`marble/export/gaussian-splat`). **API `worlds:export` is separate:** `POST /worlds/{id}:export {"asset_type":"splats","format":"ply","resolution":"full_res"}` → operation → PLY URL (often immediate); `{"asset_type":"mesh","format":"glb"}` is async — poll. New in `api/faq`. If you self-host splats (e.g. `splatmaker-mcp` → `blender-mcp` collider), you still need the mesh pipeline the README warns about — none of Marble/splatmaker give you floor collision for free.

* **File specs:** SPZ v2 (default) / v3 opt-in; PLY via `spz-to-ply.netlify.app` converter; mesh `poisson/tsdf` paths documented in `marble/export/specs`.

## 4. Atlas — Next-Gen Omni World Model (Teaser, not yet API)

> Announced **2026-09-01** at `worldlabs.ai/blog/atlas` — replaces thinking of Marble as "one model per modality." Will power future Marble + Platform; no API yet.

Unified **autoregressive diffusion transformer**, pretrained from scratch, natively multimodal (text, image, video, 3D) with **spatial context** — every reference image is grounded at a 3D pose, not just concatenated.

* **Camera-controlled generation:** 1–6 reference images + pixel-perfect 6-DoF camera → coherent novel views/extrapolation (imagines hidden backsides), up to 1 min @ 1440p long video via controllable spatial context interpolation.
* **Spatial reconstruction:** 1 → 100+ sparse views → both images + explicit 3D (depth → point cloud → Gaussian splats). Claims to beat specialist 3D baselines with 2–3 images; demos: single garden photo → successive cottage/house images progressively de-imagined → full metric scene; Stanford Main Quad 2–25 images → aerials.
* **Space-time simulation / Robotics:** `2026-07-28` SceniX acquisition + R2S2R engine (`worldlabs.ai/blog/real-to-sim-to-real`) is the applied side — **real→sim→real**: reconstruct a real robot task (YAM/ALOHA/RB-Y1 cable/box packing) as interactive sim, then **2–24 cell-phone frames** → Atlas builds implicit splat sim that reproduces RGB+depth sensors *and* contact dynamics (rigid/articulated/deformable). Sim policies trained **zero real data** transfer to hardware and are **evaluated in sim for real-world failure prediction**, closing the data bottleneck for VLA/WAM robots. Marketing claims 1h autonomous runs; taxonomy paper is `2026-06-03 A Functional Taxonomy of World Models` (Renderers/Simulators/Planners loop).

**Implication for `worldlabs-mcp` / `splatmaker-mcp`:** today's `worlds:generate` remains Marble 1.x. Atlas will likely surface as new models (`atlas-*`) or a `worlds:simulate` family — watch `docs.worldlabs.ai/api/models` and `release-notes` for the `default → marble-1.1` flip first, then Atlas. Local splatmaker keeps winning on **zero marginal cost** (4090 + Nerfstudio) while Platform is 1500–3000 cr/gen; Atlas just raises the fidelity bar you compare against. The `from_prompt` design in `splatmaker-mcp/docs/FROM_PROMPT_DESIGN.md` (Wan 2.7 9-grid, `ml-sharp-pinokio`) is conceptually Atlas's camera-controlled sibling — keep that distinction visible when you pitch splatmaker vs Atlas.

## 5. Quick Links

* **Generate:** `docs.worldlabs.ai/marble/create/*` (multi-image azimuths, pano, video) + Chisel (`.../chisel-basics`); edit: `marble/edit/*` (pano-edit, expand, variation); Studio: `.../studio-tools/compose|record`
* **Export:** `marble/export/gaussian-splat/*` (Spark, Unreal/Unity/Blender/Houdini) + `rendering-spz` scale recipe
* **API:** `api/models` (table above), `api/world-generation-examples`, `api/rendering-spz` (the `+ log(scale)` recipe), `api/pricing#world-generation-pricing`, `api/reference/openapi.yaml`
* **Billing split:** `BILLING.md` + `docs.worldlabs.ai/marble/support/account-billing` + `api/faq` overage explainer
* Memops: `projects/world-labs-browser-vs-api-billing-and-gallery-access-2026-09-01`
