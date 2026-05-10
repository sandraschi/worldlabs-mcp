"""
DCC (Digital Content Creation) autostart utilities.

When an export is triggered, these helpers attempt to launch the
target DCC application if it isn't already running, so the user
doesn't have to manually start blender-mcp, unity3d-mcp, etc.
"""

from __future__ import annotations

import asyncio
import os
import platform
import subprocess
from pathlib import Path


async def _wait_for_port(host: str, port: int, timeout: float = 15.0) -> bool:
    """Poll a TCP port until it responds or timeout expires."""
    import socket
    deadline = asyncio.get_event_loop().time() + timeout
    while asyncio.get_event_loop().time() < deadline:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(1)
            s.connect((host, port))
            s.close()
            return True
        except (OSError, ConnectionRefusedError):
            await asyncio.sleep(0.5)
    return False


def _find_blender() -> str | None:
    """Return path to blender.exe if installed."""
    if platform.system() != "Windows":
        # On macOS/Linux, try `which blender`
        try:
            result = subprocess.run(["which", "blender"], capture_output=True, text=True, timeout=5)
            if result.returncode == 0 and result.stdout.strip():
                return result.stdout.strip()
        except Exception:
            pass
        return None

    # Windows search paths
    candidates = [
        os.path.expandvars(r"%PROGRAMFILES%\Blender Foundation"),
        os.path.expandvars(r"%PROGRAMFILES(X86)%\Blender Foundation"),
        os.path.expandvars(r"%LOCALAPPDATA%\Blender Foundation"),
    ]
    for base in candidates:
        if not os.path.isdir(base):
            continue
        for entry in sorted(os.listdir(base), reverse=True):
            full = os.path.join(base, entry, "blender.exe")
            if os.path.isfile(full):
                return full
    # Also check PATH
    for path_dir in os.environ.get("PATH", "").split(os.pathsep):
        candidate = os.path.join(path_dir, "blender.exe")
        if os.path.isfile(candidate):
            return candidate
    return None


async def ensure_blender(host: str = "127.0.0.1", port: int = 10700) -> str | None:
    """Ensure blender-mcp is reachable. If not, try to launch Blender with the addon.

    Returns a status message, or None if already reachable.
    """
    if await _wait_for_port(host, port, timeout=2):
        return None  # already running

    blender_path = _find_blender()
    if not blender_path:
        return "Blender not found. Install Blender from https://blender.org"

    try:
        subprocess.Popen(
            [blender_path, "--background", "--python-expr",
             "import bpy; bpy.ops.preferences.addon_enable(module='blender_mcp')"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if await _wait_for_port(host, port, timeout=30):
            return "Blender launched and blender-mcp addon activated."
        return "Blender launched but blender-mcp not detected. Is the addon installed?"
    except Exception as e:
        return f"Failed to launch Blender: {e}"


async def ensure_unity(host: str = "127.0.0.1", port: int = 10730) -> str | None:
    """Check if unity3d-mcp is reachable. Autostart is not supported for Unity
    (requires the Unity Editor with a specific project open)."""
    if await _wait_for_port(host, port, timeout=2):
        return None  # already running
    return (
        "Unity3D MCP bridge not detected. Open your Unity project with "
        "unity3d-mcp running, or set UNITY_PROJECT_PATH and start the editor."
    )


async def ensure_resonite(host: str = "127.0.0.1", port: int = 9000) -> str | None:
    """Check if Resonite OSC receiver is reachable. Autostart is not supported."""
    if await _wait_for_port(host, port, timeout=2):
        return None  # already running
    return (
        "Resonite OSC receiver not detected on port 9000. "
        "Launch Resonite with a /worldlabs/import OSC receiver."
    )
