# Onboarding

**World Labs MCP** wraps the [World Labs Marble API](https://platform.worldlabs.ai) - you need a World Labs account + API key to generate 3D worlds. The server also has a web dashboard (10864), a REST bridge (10865), and optional local LLM / DCC / Plex integrations. This guide gets a first-timer from zero to first world in under 5 minutes.

## What You Need

| Requirement | Why | Cost |
|-------------|-----|------|
| **World Labs account** | Marble API access | Free to create; API credits are pay-per-generation |
| **API key** | `WORLDLABS_API_KEY` env var | Get at [platform.worldlabs.ai/api-keys](https://platform.worldlabs.ai/api-keys) |
| **Python 3.10+** + `uv` | MCP server runtime | Free |
| **Node.js LTS** + `just` | Webapp + task runner | Free |

No World Labs account? Worlds still viewable via the **Marble Community Gallery** (`/gallery` in webapp, `gallery_explore` MCP tool) and **Marble Adventure** game (public Marble URLs) - but generation requires a key.

> **Credits note:** Credits on marble.worldlabs.ai (web app) are **separate** from API Platform credits at [platform.worldlabs.ai](https://platform.worldlabs.ai). Check API balance on the Platform, not the web app.

## Money / Credits Pitfalls

- **402 Payment Required** means out of API Platform credits - top up at [platform.worldlabs.ai](https://platform.worldlabs.ai), not marble.worldlabs.ai.
- Generations cost credits per Marble model (`marble-1.1` vs `marble-1.1-plus`) - see [TECH_SPEC_MARBLE_API.md](./TECH_SPEC_MARBLE_API.md).
- Video-to-world costs more than image/text. Test with text first.
- `seed` gives deterministic output - reuse prompts cheaply while iterating.

## Quick Start (3 steps)

```powershell
git clone https://github.com/sandraschi/worldlabs-mcp
cd worldlabs-mcp

# 1. Bootstrap (installs Python deps, pre-commit, webapp npm deps)
just bootstrap

# 2. Set API key
# Edit .env (created from .env.example):
#   WORLDLABS_API_KEY=wl_your_key_here

# 3. Launch
just serve
# or: .\start.ps1
```

Opens `http://localhost:10864` (dashboard). Verify: `just health` should return `{"status":"ok"}`.

## MCP Client Setup (Claude Desktop / Cursor / OpenCode)

Add to your MCP config (`claude_desktop_config.json`, `.opencode/config.json`, etc.):

```json
{
  "mcpServers": {
    "worldlabs": {
      "command": "uv",
      "args": ["run", "--directory", "D:\\Dev\\repos\\worldlabs-mcp", "worldlabs-mcp"],
      "env": { "WORLDLABS_API_KEY": "wl_your_key_here" }
    }
  }
}
```

Or use HTTP transport: `MCP_TRANSPORT=http` + `MCP_PORT=10865` → `uv run uvicorn worldlabs_mcp.server:app --host 127.0.0.1 --port 10865`.

## Sanity Check (first world)

**Via webapp:** Open `http://localhost:10864` → **World Architect** (`/architect`) → enter "a misty Japanese garden at dawn" → Generate → poll status → view in Spark Viewer.

**Via MCP (Claude):**
```
Generate a world from text: "a misty Japanese garden at dawn"
→ get_operation(operation_id="<returned id>")
→ get_world(world_id="<id>") when status=completed
```

**Via CLI:**
```powershell
just demo-text
# or: uv run python -c "import asyncio; from worldlabs_mcp.server import generate_world_from_text; print(asyncio.run(generate_world_from_text('A misty Japanese garden at dawn')))"
```

If generation succeeds, the webapp **World Library** (`/library`) will list it and the Spark Viewer can stream its Gaussian splats.

## Optional: AI providers (local LLM + cloud, for Chat + prompt tools)

No LLM is required - the server works without one. Two paths (local is free,
cloud is pay-per-use; keys never leave the backend):

1. **Local (free)** - install [Ollama](https://ollama.ai) → `ollama serve` →
   `ollama pull qwen3.8:27b` (or start [LM Studio](https://lmstudio.ai) on
   `:1234`). Verify: `just probe-llm`. The Dashboard shows a red **Set up AI**
   cue until a provider is usable; one-click Ollama install is in Settings.
2. **Cloud (paid)** - open the webapp Settings → AI Providers cards, paste a
   key (OpenAI, Anthropic, DeepSeek, OpenRouter, Meta, Google, Groq, Mistral,
   Together, Fireworks, Cohere, xAI, Perplexity), Save, then Test. Keys land
   in a 0600 keystore (`%APPDATA%/worldlabs-mcp/llm_keys.json`) or env vars.
3. Pick provider + model in Settings (resident-first: a loaded preferred
   model is never evicted). Chat streams over SSE via the backend proxy.

See `web_sota/src/pages/local-llm.tsx` (legacy local chat) and the fleet
contracts in `mcp-central-docs/standards/WEBAPP_SOTA_STANDARDS.md` section VI.

## What If Something Goes Wrong?

See `docs/TROUBLESHOOTING.md` - common fixes for 402/401, port conflicts, stuck generations, LLM not detected, DCC failures, Plex, etc.

## Next Steps

- **Prompt engineering:** `docs/PROMPT_GUIDE.md` (artist styles, landmarks, materials)
- **Features:** `docs/FEATURES.md` (all 21 tools, spatial voice, DCC export)
- **Architecture:** `docs/ARCHITECTURE.md` (ports, data flow, Spark 2.0)
- **VR:** `docs/WEBXR.md` (Quest/Pico 4 wireless)
- **Marble Adventure:** `docs/COMPETITION.md` + `just marble-adventure-play`
