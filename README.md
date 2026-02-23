# worldlabs-mcp

MCP server wrapping the [World Labs Marble API](https://docs.worldlabs.ai/api) — generate navigable 3D worlds from text, images, and video.

## What it does

Exposes the World Labs Marble world-generation pipeline as MCP tools so Claude (or any MCP client) can:
- Generate 3D worlds from a text prompt
- Lift images or panoramas into explorable 3D spaces
- Convert video into navigable environments
- Upload local media for generation
- Poll operations and retrieve world assets (Gaussian splats, mesh, panorama, thumbnail)

## Requirements

- Python 3.10+
- A World Labs account with API credits: https://platform.worldlabs.ai

## Setup

```bash
cd worldlabs-mcp
pip install -e .
```

Set your API key:
```
WORLDLABS_API_KEY=your_key_here
```

Get a key at https://platform.worldlabs.ai/api-keys

## Claude Desktop config

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "worldlabs": {
      "command": "python",
      "args": ["D:/Dev/repos/worldlabs-mcp/src/server.py"],
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
| `generate_world_from_image` | Image URL → Operation |
| `generate_world_from_video` | Video URL → Operation |
| `generate_world_from_media_asset` | Uploaded asset ID → Operation |
| `prepare_media_upload` | Get signed upload URL for local file |
| `get_operation` | Single poll of an operation |
| `wait_for_world` | Blocking poll until done (up to 10min) |
| `get_world` | Fetch latest world details by ID |

## Models

- `Marble 0.1-plus` — best quality, ~5 minutes
- `Marble 0.1-mini` — faster, ~30-45 seconds, cheaper (good for iteration)

## World assets returned

- `assets.splats.spz_urls` — Gaussian splat files at 100k, 500k, full resolution
- `assets.mesh.collider_mesh_url` — collision mesh in GLB format
- `assets.imagery.pano_url` — 360 panorama image
- `assets.thumbnail_url` — thumbnail
- `assets.caption` — AI-generated scene description
- `world_marble_url` — direct link to view in Marble

## Notes

- World generation is async. `generate_*` tools return an Operation immediately.
  Use `wait_for_world` if you want Claude to block until done (can take ~5min for plus).
- Credits are consumed per generation. Check https://platform.worldlabs.ai/billing.

## License

MIT
