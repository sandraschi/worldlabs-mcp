# Configuration

All configuration is via environment variables (loaded from `.env` at repo root). See `.env.example` for the full template with defaults.

## Required

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `WORLDLABS_API_KEY` | World Labs Marble API key (required for all generation) | [platform.worldlabs.ai/api-keys](https://platform.worldlabs.ai/api-keys) |

> Credits on marble.worldlabs.ai (web app) are **separate** from API Platform credits. Top up at [platform.worldlabs.ai](https://platform.worldlabs.ai).

## Marble API (optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `WORLDLABS_BASE_URL` | `https://api.worldlabs.ai/marble/v1` | Override Marble base URL |
| `WORLDLABS_BRIDGE_URL` | `http://localhost:10865` | Bridge URL MCP spatial tools post narration to |
| `FRONTEND_ORIGIN` | `http://localhost:10864` | Frontend origin for CORS |
| `WORLDLABS_LOCAL_PATH` | `~/Downloads` | Root served by `GET /api/local-assets/` |
| `WORLDLABS_EXTRA_ORIGINS` | _(empty)_ | Comma-separated extra CORS origins |

## Local LLM (optional, fleet standard)

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama endpoint for `refine_with_local_llm` + `/api/llm/discover` |
| `DEFAULT_OLLAMA_MODEL` | `llama3.2:3b` | Default model for prompt refinement |
| `LMSTUDIO_URL` | `http://localhost:1234` | LM Studio endpoint (auto-detected) |

No LLM required - the server runs fine without one. When a local LLM is detected, the webapp Chat (FloatingChat) and `refine_with_local_llm` tool become active.

## DCC Handoff (optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `BLENDER_MCP_PORT` | `10700` | Blender MCP bridge port |
| `UNITY3D_MCP_PORT` | `10730` | Unity MCP bridge port |
| `UNITY_PROJECT_PATH` | _(empty)_ | Path to Unity project for DCC export |
| `RESONITE_OSC_HOST` | `127.0.0.1` | Resonite OSC host |
| `RESONITE_OSC_PORT` | `9000` | Resonite OSC port |
| `AVATAR_MCP_PORT` | _(empty)_ | Avatar MCP (VRM placement) |

## Plex / Cinema Worlds (optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `PLEX_BASE_URL` | `http://localhost:32400` | Plex server URL |
| `PLEX_TOKEN` | _(empty)_ | Plex X-Plex-Token |

## Federation / Bridge

| Variable | Description |
|----------|-------------|
| `MCP_BRIDGE_URLS` | Comma-separated MCP server URLs to proxy |
| `SPEECH_MCP_URL` | Speech-MCP endpoint for end-to-end voice agent (`http://localhost:10918`) |

## Ports

| Port | Service | Config |
|------|---------|--------|
| `10864` | Frontend (Vite) | `fleet-start.config.ps1` `FrontendPort` |
| `10865` | Backend (FastAPI + MCP HTTP) | `fleet-start.config.ps1` `BackendPort` |
| `32400` | Plex (optional) | `PLEX_BASE_URL` |

All ports are registered in `mcp-central-docs/operations/WEBAPP_PORTS.md`. Never use forbidden ports 3000/5000/5173/8000/8080.

## MCP Client Config

Add to `claude_desktop_config.json`, `opencode.json`, or `mcp_config.json`:

```json
{
  "mcpServers": {
    "worldlabs": {
      "command": "uv",
      "args": ["run", "--directory", "D:\\Dev\\repos\\worldlabs-mcp", "worldlabs-mcp"],
      "env": { "WORLDLABS_API_KEY": "your_key_here" }
    }
  }
}
```

For HTTP transport: set `MCP_TRANSPORT=http` and `MCP_PORT=10865`, then `uv run uvicorn worldlabs_mcp.server:app --host 127.0.0.1 --port 10865`.
