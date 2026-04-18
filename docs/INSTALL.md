# Installation Guide

This guide covers the setup for both the **World Labs MCP Server** and the **SOTA v1.5.0 Deployment Dashboard**.

## Prerequisites

- **Python 3.10+** (managed via `uv` recommended)
- **Node.js 18+** (for the dashboard)
- **World Labs API Key**: Obtain one at [platform.worldlabs.ai](https://platform.worldlabs.ai)
- **API Credits**: Ensure your API balance is funded (Web App credits do not apply).

## Backend Setup

1. **Clone and Install**:
   ```bash
   git clone https://github.com/sandraschi/worldlabs-mcp.git
   cd worldlabs-mcp
   uv sync --all-groups
   ```

2. **Configure Environment**:
   Create a `.env` file in the root:
   ```env
   WORLDLABS_API_KEY=your_key_here
   WORLDLABS_LOCAL_PATH=C:/Users/yourname/Downloads
   ```

3. **Verify Installation**:
   ```bash
   uv run worldlabs-mcp --port 10865
   ```
   Open `http://localhost:10865/health` to confirm the bridge is active.

## Dashboard Setup

The dashboard provides a premium UI for generation, local LLM refinement, and DCC handoffs.

1. **Install Dependencies**:
   ```powershell
   cd web_sota
   npm install
   ```

2. **Launch Development Environment**:
   ```powershell
   ./start.ps1
   ```
   The dashboard will be available at **http://localhost:10864**.

## MCP Client Configuration

### Claude Desktop
Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "worldlabs-mcp": {
      "command": "uv",
      "args": [
        "--directory",
        "D:/Dev/repos/worldlabs-mcp",
        "run",
        "worldlabs-mcp"
      ],
      "env": {
        "WORLDLABS_API_KEY": "your_key_here"
      }
    }
  }
}
```

## Security Note

This server is designed for **Sovereign Hosting**. The bridge (Port **10865**) handles both the MCP webapp state and local file serving. Ensure this port is firewalled if you are exposing the dashboard publicly, as it provides read access to your `WORLDLABS_LOCAL_PATH`.
