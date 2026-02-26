[![CI](https://github.com/sandraschi/worldlabs-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/sandraschi/worldlabs-mcp/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/downloads/)
[![FastMCP](https://img.shields.io/badge/FastMCP-2.12%2B-green.svg)](https://github.com/jlowin/fastmcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![World Labs](https://img.shields.io/badge/World%20Labs-Marble%20API-purple.svg)](https://docs.worldlabs.ai/api)
[![Glama](https://img.shields.io/badge/Glama-MCP%20Server-orange.svg)](https://glama.ai/mcp/servers?query=sandraschi)

# worldlabs-mcp

MCP server wrapping the [World Labs Marble API](https://docs.worldlabs.ai/api) — generate navigable 3D worlds from text, images, and video.

## What it does

Exposes the World Labs Marble world-generation pipeline as MCP tools so Claude (or any MCP client) can:

- Generate 3D worlds from a text prompt
- Lift images or panoramas into explorable 3D spaces
- Generate from multiple images with azimuth angles
- Convert video into navigable environments
- Upload local media files and generate end-to-end
- Poll operations and retrieve world assets (Gaussian splats, mesh, panorama, thumbnail)

## Requirements

- Python 3.10+
- A World Labs account with API credits: https://platform.worldlabs.ai

## Setup

```bash
cd worldlabs-mcp
uv pip install -e ".[dev]"
```

Set your API key (environment variable):
```
WORLDLABS_API_KEY=your_key_here
```

Get a key at https://platform.worldlabs.ai/api-keys

## Claude Desktop config

Add to `claude_desktop_config.json` (or copy from `mcp_config.json`):

```json
{
  "mcpServers": {
    "worldlabs-mcp": {
      "command": "uvx",
      "args": ["worldlabs-mcp"],
      "env": {
        "WORLDLABS_API_KEY": "your_key_here"
      }
    }
  }
}
```

For local development (without installing):
```json
{
  "mcpServers": {
    "worldlabs-mcp": {
      "command": "python",
      "args": ["D:/Dev/repos/worldlabs-mcp/scripts/run_server.py"],
      "env": {
        "WORLDLABS_API_KEY": "your_key_here"
      }
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `generate_world_from_text` | Text prompt → Operation |
| `generate_world_from_image` | Public image URL → Operation (panorama support) |
| `generate_world_from_multi_image` | Multiple images at azimuth angles → Operation |
| `generate_world_from_video` | Public video URL → Operation |
| `upload_and_generate` | Local file path → upload → Operation (end-to-end) |
| `prepare_media_upload` | Get signed GCS upload URL for manual upload |
| `generate_world_from_media_asset` | Uploaded asset ID → Operation |
| `get_operation` | Single poll of an operation status |
| `wait_for_world` | Blocking poll until done (raises on error, TimeoutError) |
| `list_worlds` | Paginated list of all generated worlds |
| `get_world` | Fetch latest world details and asset URLs by ID |

## SOTA 2026 Dashboard

The project includes a state-of-the-art web dashboard for managing 3D world generation, history, and DCC exports.

### Features
- **Prompt Refinement**: Integrate with local LLMs (Ollama/LM Studio) to transform short prompts into highly detailed 20-line WorldLabs-optimized technical descriptions.
- **Generation History**: Persisted session history with real-time operation polling.
- **DCC Export**: One-click asset handoff to Resonite (OSC), Unity3D (Assets folder), and Blender (v10740 bridge).
- **Premium Aesthetics**: Glassmorphism, dark mode, and micro-animations.

### Running the Dashboard
```powershell
# In the web_sota directory
npm install
./start.ps1
```
The dashboard runs on port **10864**, with the bridge server on **10865**.

## Models

- `Marble 0.1-mini` — **default**, ~30-45 seconds, cheaper, good for iteration
- `Marble 0.1-plus` — best quality, ~5 minutes per generation

## World assets returned

- `assets.splats.spz_urls` — Gaussian splat files (100k, 500k, full resolution)
- `assets.mesh.collider_mesh_url` — collision mesh in GLB format
- `assets.imagery.pano_url` — 360 panorama image
- `assets.thumbnail_url` — thumbnail JPEG
- `assets.caption` — AI-generated scene description
- `world_marble_url` — direct link to view in Marble viewer

## Development

```bash
# Run tests
pytest tests/ -v

# Lint
ruff check src/ tests/

# Run server (stdio)
python scripts/run_server.py

# Run server (HTTP for testing)
python scripts/run_server.py --http --port 8000
```

## Notes

- World generation is async. All `generate_*` tools return an Operation immediately.
  Use `wait_for_world` if you want to block until done.
- Credits are consumed per generation. Check https://platform.worldlabs.ai/billing.
- Default model is `Marble 0.1-mini` for fast iteration. Pass `model="Marble 0.1-plus"` for quality.

## License

MIT
