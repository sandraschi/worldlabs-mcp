---
name: worldlabs
description: Generate navigable 3D Gaussian-splat worlds via the World Labs Marble API (text/image/video-to-world), browse the community gallery, and narrate scenes spatially through Spark 2.0
---

# World Labs MCP — domain skill

MCP gateway to World Labs Marble 1.1 (world generation) + Spark 2.0 (streaming
splat viewer with HRTF spatial audio). Backend bridge on `:10865`, webapp on
`:10864`. 23 MCP tools, 2 Prefab cards, 2 resources, 2 prompts.

## Agent vs human routing

- **Agent (you):** call the MCP tools directly. Poll async work with
  `get_operation`; never claim a world exists before `done=true` with a
  `world_id`. Credit owners when reusing gallery prompts.
- **Human (Sandra):** point at the webapp — Architect (`/architect`) for
  generation, Inbox (`/inbox`) for the action queue, Library (`/library`)
  for finished worlds, Spark viewer (`/spark-viewer`) for walkthroughs.

## Tool catalog (real operation names)

**Generate:** `generate_world_from_text`, `generate_world_from_image`
(`is_panorama` for 360 equirectangular), `generate_world_from_multi_image`
(min 2 images + matching `azimuths_deg`), `generate_world_from_video`,
`upload_and_generate` (local file end-to-end, 100 MB cap), plus the manual
two-step `prepare_media_upload` → `generate_world_from_media_asset`.
`seed` pins deterministic output; `tags` organises; `disable_recaption`
stops the API rewriting prompts. Default model `marble-1.1` (1500 credits,
~1-3 min); `marble-1.1-plus` auto-expands (1500 + 300/cube, slower).

**Poll:** `get_operation` (single poll, raises on failed ops),
`wait_for_world` (blocking ≤90 s — suits marble-1.1 only; loop
`get_operation` for plus).

**Manage:** `list_worlds` (paginated), `get_world` (SPZ/GLB/panorama/
thumbnail/CDN links are **time-limited — download promptly**),
`delete_world` (irreversible, destructive).

**Spatial (needs bridge `:10865` + open Spark viewer):**
`broadcast_spatial_notification` (TTS at x/y/z via edge-tts),
`broadcast_spatial_audio` (looping mp3/wav URL), `place_world_tv`
(16:9 video plane), `spawn_agent_avatar` (`default_agent` = built-in GLB).

**Meta:** `refine_with_local_llm` (needs Ollama at `OLLAMA_URL`),
`generate_world_prompt` (sampling-first expansion), `worldlabs_help`
(`detail` quick/standard/verbose, `topic` generate/upload/poll/world/
spatial/meta), `gallery_explore` (see workflow 2), `worldlabs_shutdown`.

**Resources:** `world://{world_id}`, `gallery://{tag}`.
**Prompts:** `world-gen`, `spark-viewer`.

## Workflows

### 1. Text-to-world end-to-end

```python
op = await generate_world_from_text(
    text_prompt="A misty Japanese garden at dawn, stone lanterns, koi pond",
    display_name="garden-dawn", model="marble-1.1", seed=42,
    tags=["garden", "morning"])
# op -> {operation_id, done: false}
final = await wait_for_world(op["operation_id"])
world = await get_world(final["world_id"])
# world -> splat_url (SPZ), mesh_url (GLB), panorama_url, thumbnail_url,
#           caption, world_marble_url (open in browser)
```

Rules: poll, don't assume; marble-1.1-plus needs a `get_operation` loop, not
`wait_for_world`; download CDN assets immediately; record failures with their
operation IDs (`get_operation` raises `RuntimeError` with the API reason).

### 2. Gallery prompt mining

```python
hits = await gallery_explore(operation="search", query="cyberpunk", tag="sci-fi")
# -> compact {title, owner, seed, prompt, url} rows; tag "all" scans every tab
detail = await gallery_explore(operation="world", world_id="<uuid>")
# -> full SPZ/minimap asset URLs + marble.worldlabs.ai/world/{id} link
```

Reuse the creator's `seed` + prompt to reproduce a look, then vary. Credit the
owner when sharing results. Ten showpiece-mined presets live in the webapp
Style Gallery.

### 3. Spatial narration of a finished world

```python
await broadcast_spatial_notification("Welcome to the garden", x=0, y=1.5, z=0)
await broadcast_spatial_audio("https://example.com/pond-loop.mp3", x=2, y=0, z=-3)
await place_world_tv("https://example.com/intro.mp4", x=-2, y=1.6, z=1)
await spawn_agent_avatar(x=1, y=0, z=1)  # default_agent GLB, surface-grounded
```

Preconditions: backend running (`GET :10865/health` → 200) AND the Spark
viewer open (it consumes the narration SSE stream). Without the viewer the
calls succeed but nothing is heard/seen — check that before debugging audio.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `get_operation` raises `RuntimeError` | API-side failure; message carries the reason (credits, moderation, bad URL). Check balance at platform.worldlabs.ai/billing — **web-app credits and API credits are separate pools**. |
| `wait_for_world` times out | Normal for marble-1.1-plus; switch to a `get_operation` loop. |
| Spatial tools "work" but silent | Spark viewer not open, or bridge down. Verify `:10865/health`, then open `/spark-viewer`. |
| `upload_and_generate` rejects file | 100 MB cap; kind must be exactly `image` or `video`. |
| Asset URL 403s | CDN links expire — re-fetch via `get_world`, download promptly. |
| `refine_with_local_llm` connection error | Ollama not running; start it (default `http://localhost:11434`) or set `OLLAMA_URL`. |

## Configuration

| Variable | Meaning |
|---|---|
| `WORLDLABS_API_KEY` | **Required.** platform.worldlabs.ai/api-keys |
| `WORLDLABS_BRIDGE_URL` | Spatial bridge (default `http://localhost:10865`) |
| `WORLDLABS_LOCAL_PATH` | Local asset folder (default `~/Downloads`) |
| `OLLAMA_URL` | Local LLM (default `http://localhost:11434`) |
| `PLEX_BASE_URL` / `PLEX_TOKEN` | Cinema Worlds integration |
| `MCP_TRANSPORT=http` | Serve HTTP on `:10865` instead of stdio |

Docs: `docs/` (SETUP, FEATURES, ARCHITECTURE, PROMPT_GUIDE, TTS, SPARK_V2,
EXPORT_GUIDE, WEBXR, ONBOARDING), `llms-full.txt` (endpoint + env reference).
