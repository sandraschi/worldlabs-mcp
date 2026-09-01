"""PyInstaller entry point — dual transport for worldlabs-mcp.

stdio mode (Claude Desktop / Cursor): no env vars set
HTTP mode (Tauri operator spawn): WORLDLABS_MCP_PORT is set
"""

# Eager-import stdlib C extensions that PyInstaller often misses
import _datetime  # noqa: F401
import _strptime  # noqa: F401
import os
import sys
from pathlib import Path

# Eager-import mcp.types to prevent fastmcp bootstrap crash in frozen exe
import mcp.types  # noqa: F401

# Resolve paths for frozen vs dev mode
if getattr(sys, "frozen", False):
    base = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
    sys.path.insert(0, str(base))
else:
    sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from worldlabs_mcp.server import app as fastapi_app
from worldlabs_mcp.server import main as _stdio_main

if __name__ == "__main__":
    port = os.environ.get("WORLDLABS_MCP_PORT") or os.environ.get("PORT")
    if port:
        import uvicorn

        host = os.environ.get("WORLDLABS_MCP_HOST", "127.0.0.1")
        uvicorn.run(fastapi_app, host=host, port=int(port), log_level="info")
    else:
        _stdio_main()
