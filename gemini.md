# World Labs MCP: System Context (v0.4.0)

This document provides grounding for the AI agent (Gemini/Claude). Refer to this before performing architectural changes, debugging, or tool development.

## 🛠️ Tech Stack & Tool Paths

| Component | Technology | Absolute Tool Path (SOTA 2026) |
|-----------|------------|--------------------------------|
| **Runtime** | Python 3.13 | `C:\Users\sandr\AppData\Local\Programs\Python\Python313\python.exe` |
| **Automation**| Just | `C:\Users\sandr\scoop\apps\just\1.49.0\just.exe` |
| **Linting**   | Ruff | `C:\Users\sandr\AppData\Local\Programs\Python\Python313\Scripts\ruff.exe` |
| **Frontend**  | Biome | `npx @biomejs/biome` |
| **MCP**       | FastMCP 3.2 | Linked via `uv run` |

## 🏗️ Architecture Summary (Port 10865)

- **Single Source of Truth**: `src/worldlabs_mcp/api_bridge.py` handles all `/api/*` routes.
- **Spark 2.0 Engine**: WebGL2/Rust renderer for high-fidelity 100M+ splats.
- **Spatial Voice Agent**: SSE-based narration grounded in 3D coordinates.

## 📡 Essential Ports

- **10864**: Vite Dashboard (Frontend)
- **10865**: FastAPI Bridge (Backend & State)
- **10918**: [Speech-MCP](https://github.com/sandraschi/speech-mcp) (Optional TTS Backend)

## 🛑 Guardrails & Safety

- **One Bridge Rule**: Never introduce a second bridge process. All webapp state must flow through the port 10865 bridge.
- **CORS**: Enforce `FRONTEND_ORIGIN` (default `10864`).
- **Encoding**: Always use UTF-8. Avoid mojibake in logs and docs.
- **Spatial Triggers**: Geofencing (Dragon warnings) is implemented in `spark-viewer.tsx` via `ProximityTrigger` logic.

---
*Synchronized with fleet standards in* `d:/Dev/repos/mcp-central-docs`
