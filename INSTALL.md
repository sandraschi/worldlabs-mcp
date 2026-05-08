# worldlabs-mcp — Installation Guide

## Prerequisites

Everything below installs automatically on first run of `start.bat` on a fresh Windows machine. Manual steps are only needed if winget is not available.

| Tool | Version | Auto-install |
|------|---------|-------------|
| Python | 3.10+ | No — install from python.org |
| uv | latest | Yes (winget `astral-sh.uv`) |
| Node.js LTS | 20+ | Yes (winget `OpenJS.NodeJS.LTS`) |
| just | latest | Yes (winget `Casey.Just`) |
| Git | latest | Recommended — for cloning |

## Quick Start (Windows)

```bat
git clone https://github.com/sandraschi/worldlabs-mcp.git
cd worldlabs-mcp
start.bat
```

That's it. `start.bat` calls `start.ps1` which:
1. Installs `uv`, `Node.js`, and `just` via winget if missing
2. Runs `uv sync` to create the `.venv` and install Python deps
3. Starts the backend (uvicorn on port 10865)
4. Installs npm deps if `web_sota/node_modules` is absent
5. Starts the Vite frontend (port 10864) and opens your browser

## MCP Client Configuration

Add to `claude_desktop_config.json` (usually `%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "worldlabs-mcp": {
      "command": "uv",
      "args": ["--directory", "C:\\path\\to\\worldlabs-mcp", "run", "worldlabs-mcp"],
      "env": {
        "WORLDLABS_API_KEY": "your-key-here"
      }
    }
  }
}
```

Get your API key at: https://platform.worldlabs.ai/api-keys

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `WORLDLABS_API_KEY` | Yes | Marble API key from platform.worldlabs.ai |
| `WORLDLABS_BRIDGE_URL` | No | Bridge URL (default: `http://localhost:10865`) |
| `WORLDLABS_LOCAL_PATH` | No | Local folder for asset serving (default: `~/Downloads`) |
| `OLLAMA_URL` | No | Ollama base URL (default: `http://localhost:11434`) |
| `PLEX_BASE_URL` | No | Plex server URL for Plex integration |
| `PLEX_TOKEN` | No | Plex authentication token |
| `UNITY_PROJECT_PATH` | No | Unity project root for DCC export |
| `BLENDER_MCP_PORT` | No | blender-mcp port (default: `10700`) |
| `RESONITE_OSC_HOST` | No | Resonite OSC host (default: `127.0.0.1`) |
| `RESONITE_OSC_PORT` | No | Resonite OSC port (default: `9000`) |

## Optional: TTS for Spatial Narration

```bat
uv pip install edge-tts
```

Required for `broadcast_spatial_notification` to generate audio. Without it, notifications are sent as text-only events to the Spark viewer.

## Ports

| Service | Port |
|---------|------|
| Frontend (web_sota) | 10864 |
| Backend (REST + MCP bridge) | 10865 |

## Troubleshooting

**`uv` not found after install** — Close the terminal and reopen. winget installs to user PATH which needs a new session to take effect.

**Port already in use** — `start.ps1` kills squatters automatically. If it fails: `Get-NetTCPConnection -LocalPort 10864,10865 | Stop-Process -Force`

**WORLDLABS_API_KEY 402 error** — Credits on `marble.worldlabs.ai` (web app) are **separate** from API platform credits. Check your API balance at https://platform.worldlabs.ai/billing

**`npm install` fails** — Ensure Node.js LTS is installed: `node --version`. Minimum: v20.

## Development

```bat
# Run tests
just test

# Lint + format
just fix
just lint

# Run backend only (no frontend)
start.bat /BackendOnly
```

Full recipe list: `just` (shows dashboard)
