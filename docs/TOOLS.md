# Tools

World Labs MCP exposes **19 MCP tools** + a **FastAPI REST bridge** (`/api/*`) on port 10865. All MCP tools return `{success, message, data}` dialogic shape per fleet standard.

## MCP Tools (19)

### World Generation (6) - Marble 1.1 / 1.1-plus

| Tool | Input | Notes |
|------|-------|-------|
| `generate_world_from_text` | `prompt: str`, `model?`, `seed?`, `tags?`, `disable_recaption?` | Text-to-world, deterministic with seed |
| `generate_world_from_image` | `image_url: str`, `prompt?`, `seed?` | Single image + optional text |
| `generate_world_from_multi_image` | `image_urls: list[str]` (2-8), `azimuths: list[float]`, `prompt?` | Multi-view with azimuth angles |
| `generate_world_from_video` | `video_url: str`, `prompt?` | Video-to-world |
| `generate_world_from_media_asset` | `asset_id: str`, `kind: str` | Pre-uploaded asset ID |
| `upload_and_generate` | `file_path: str`, `kind: "image"\|"video"`, `prompt?` | Local file end-to-end (upload + generate) |

All accept `seed` (int, deterministic), `tags` (list[str]), `disable_recaption` (bool).

### Upload (1)

| Tool | Description |
|------|-------------|
| `prepare_media_upload` | Get signed GCS upload URL for manual two-step flow (`kind`: image/video) |

### Polling (2)

| Tool | Description |
|------|-------------|
| `get_operation` | Single-shot status for `operation_id` |
| `wait_for_world` | Blocking poll until done/failed (default 90s `timeout_seconds`, `poll_interval`) |

### World Management (3)

| Tool | Description |
|------|-------------|
| `list_worlds` | Paginated library, newest first (`limit`, `cursor`) |
| `get_world` | Full details: SPZ/K-splat/mesh/panorama/thumbnail/caption + asset URLs |
| `delete_world` | Permanent removal by `world_id` |

### Spatial Scene (4) - Spark 2.0 + TTS

| Tool | Description |
|------|-------------|
| `broadcast_spatial_notification` | Speak `text` at `(x,y,z)` via edge-tts, posted to bridge `/api/narration` |
| `broadcast_spatial_audio` | Play ambient audio/music at `(x,y,z)` |
| `place_world_tv` | Spawn 16:9 virtual screen at `(x,y,z)` playing `video_url` |
| `spawn_agent_avatar` | Place humanoid GLB avatar at `(x,y,z)` (raycast-grounded) |

### Meta & UI (3)

| Tool | Description |
|------|-------------|
| `worldlabs_help` | Structured API reference (`detail`: summary/tools/examples) |
| `show_worlds_card` | Prefab UI: rich world library card (in-chat) |
| `show_world_card` | Prefab UI: single world card (in-chat) |

### Refinement + Gallery (2)

| Tool | Description |
|------|-------------|
| `refine_with_local_llm` | Expand short `prompt` via local Ollama/LM Studio (`provider`, `model`) |
| `gallery_explore` | Portmanteau (`operation`: `browse`/`world`/`prompts`/`search`) over public marble.worldlabs.ai worlds - each carries creator prompt/seed/owner/SPZ |

## REST Bridge (`http://localhost:10865`)

Served by `src/worldlabs_mcp/server.py` (`_web_app` FastAPI) + `src/worldlabs_mcp/api_bridge.py` (`APIRouter` at `/api`).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness probe (`{status: ok}`) - used by `start.ps1` + frontend health dot |
| `GET` | `/api/health` | Bridge health (via router) |
| `GET` | `/api/capabilities` | Tool list, version, port info |
| `GET` | `/api/status` | Server status, uptime |
| `GET` | `/api/v1/status` | Extended status (CUA smoke feature path) |
| `GET` | `/api/v1/diagnostics` | Full diagnostics (tool list, system info, errors) - CUA-NSIS required |
| `GET` | `/api/llm/discover` | Probe Ollama (`:11434`) + LM Studio (`:1234`), return models + availability |
| `POST` | `/api/llm/chat` | Chat completion via local LLM (when available) |
| `GET` | `/api/worlds` | List worlds (proxies Marble API) |
| `GET` | `/api/worlds/{id}` | Get world detail |
| `GET` | `/api/gallery` | Public gallery browse |
| `GET` | `/api/gallery/search` | Gallery keyword search (AND across title/prompt/owner/tags) |
| `POST` | `/api/narration` | SSE narration events (spatial voice) |
| `GET` | `/api/logs` | Ring-buffer log query |
| `POST` | `/api/marble-adventure/launch` | Launch Godot hub (Apps page Play button) |
| `GET` | `/docs` | FastAPI Swagger UI + ReDoc (auto-docs) |

Frontend health poll uses exponential backoff (1s, 2s, 4s, 8s, 16s) via `web_sota/src/pages/dashboard.tsx` + `lib/store.ts`.

## Tool Design Notes

- **No portmanteau needed**: 19 tools is under the >15 portmanteau threshold per `TOOL_DESIGN_STANDARDS.md` §1 (would warrant grouping if >15 *related* tools, but world generation domains are distinct).
- **Annotations**: Tools should carry `annotations=READ_ONLY/MUTATING/DESTRUCTIVE` (fleet standard §9) - currently missing, tracked as MEDIUM gap.
- **Prefab UI**: `prefab-ui>=0.18.0` in deps, `@mcp.tool(app=True)` on `show_worlds_card`/`show_world_card` - other list/status tools should also expose Prefab cards (MEDIUM).
- **Docstrings**: Each tool should have `## Return Format` + `## Examples` + `Annotated[Field]` params (not `Args:` blocks) per `docstrings_sota.md`.
- **Skills/Resources/Prompts**: `@mcp.resource()` for world assets, `@mcp.prompt()` templates, `SkillsDirectoryProvider` for skill-first Chat - currently scaffolded in plan, not yet wired (MEDIUM).

## Claude Desktop Config

See `docs/CONFIGURATION.md` for full `mcpServers` snippet. Key env: `WORLDLABS_API_KEY`.
