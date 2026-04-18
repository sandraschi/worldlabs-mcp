"""
DEPRECATED in v0.4.0 — retained as a standalone runner for backward compatibility.

The real bridge now lives in `src/worldlabs_mcp/api_bridge.py` and is mounted into
the MCP server's FastAPI ASGI app at `/api`. When `web_sota/start.ps1` runs
`uvicorn worldlabs_mcp.server:app --port 10865`, the merged bridge serves both
the webapp and the Spatial Voice Agent from a single port.

This module remains for two cases:
  1. Running the bridge standalone without the MCP stdio server attached
     (e.g. for webapp-only development).
  2. Scripts that still import `web_sota.backend.bridge:app`.

Run standalone:
    uv run uvicorn web_sota.backend.bridge:app --host 127.0.0.1 --port 10865
"""

from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from worldlabs_mcp.api_bridge import router

app = FastAPI(
    title="worldlabs-mcp bridge (standalone)",
    description="Backend API for the World Labs MCP webapp — standalone runner",
    version="0.4.0",
)

# CORS: explicit localhost dev origins (wildcard + credentials is invalid per spec)
_FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:10864")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[_FRONTEND_ORIGIN, "http://127.0.0.1:10864"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("WEB_PORT", 10865))
    uvicorn.run(app, host="127.0.0.1", port=port)
