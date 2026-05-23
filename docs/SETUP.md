# Setup & Quick Start

## Requirements

- Python 3.10+
- [World Labs account](https://platform.worldlabs.ai) with API credits
- API key from [platform.worldlabs.ai/api-keys](https://platform.worldlabs.ai/api-keys)

## Install

```powershell
git clone https://github.com/sandraschi/worldlabs-mcp
cd worldlabs-mcp

# With Just (recommended)
just bootstrap

# Or manually
uv pip install -e ".[dev]"
```

## Configure

Set your API key in `.env`:

```
WORLDLABS_API_KEY=your_key_here
```

> **Note**: Credits on marble.worldlabs.ai (web app) are SEPARATE from API Platform credits. Check your balance at [platform.worldlabs.ai](https://platform.worldlabs.ai).

## Launch

```powershell
# Full stack (backend + webapp browser)
just serve

# Or manually
.\start.ps1
```

The web dashboard opens at `http://localhost:10864`.

### Advanced Flags

| Flag | Effect |
|------|--------|
| `-Headless` | Background processes only (hidden windows) |
| `-BackendOnly` | API server only (no Vite frontend) |
| `-NoBrowser` | Skip automatic browser launch |

## Ports

| Port | Service |
|------|---------|
| 10864 | Web dashboard frontend (Vite) |
| 10865 | Backend API + MCP HTTP |

## MCP Client Config

Add to your MCP client (`claude_desktop_config.json`, `opencode.json`, etc.):

```json
{
  "mcpServers": {
    "worldlabs": {
      "command": "uv",
      "args": ["run", "--directory", "path/to/worldlabs-mcp", "worldlabs-mcp"],
      "env": {
        "WORLDLABS_API_KEY": "your_key_here"
      }
    }
  }
}
```

## Troubleshooting

- **402 Payment Required**: You're out of API credits. Top up at [platform.worldlabs.ai](https://platform.worldlabs.ai).
- **401 Unauthorized**: Check `WORLDLABS_API_KEY` is set and valid.
- **Port conflicts**: Kill zombies with `Get-NetTCPConnection -LocalPort 10864 | Stop-Process`.
