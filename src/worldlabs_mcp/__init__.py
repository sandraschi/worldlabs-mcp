"""worldlabs-mcp - MCP server wrapping the World Labs Marble API."""

import importlib
import importlib.metadata

try:
    __version__ = importlib.metadata.version("worldlabs-mcp")
except importlib.metadata.PackageNotFoundError:
    # Running from source without an installed dist (e.g. PYTHONPATH=src)
    __version__ = "0.5.0"


def __getattr__(name: str):
    if name in ("main", "mcp"):
        server = importlib.import_module("worldlabs_mcp.server")
        return getattr(server, name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


__all__ = ["main", "mcp"]
