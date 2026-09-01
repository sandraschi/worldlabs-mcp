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
            [
                blender_path,
                "--background",
                "--python-expr",
                "import bpy; bpy.ops.preferences.addon_enable(module='blender_mcp')",
            ],
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


async def ensure_resonite(host: str = "127.0.0.1", port: int = 10715, osc_port: int = 9000) -> str | None:
    """Ensure resonite-mcp is reachable. If not, try to autostart it.

    First checks the resonite-mcp HTTP port (10715), then tries to
    launch the server from the repo. Falls back to OSC port (9000).
    """
    # Check resonite-mcp HTTP port first
    if await _wait_for_port(host, port, timeout=2):
        return None  # already running
    # Fallback: check direct OSC port
    if await _wait_for_port(host, osc_port, timeout=2):
        return None  # OSC receiver already running

    mcp_path = _find_resonite_mcp()
    if not mcp_path:
        return (
            "resonite-mcp not found. Clone it to D:\\Dev\\repos\\resonite-mcp "
            "or set RESONITE_MCP_PATH. Fallback: launch Resonite with OSC on port 9000."
        )

    try:
        if mcp_path == "uvx":
            subprocess.Popen(
                ["uvx", "resonite-mcp"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=subprocess.CREATE_NO_WINDOW,
            )
        else:
            start_script = Path(mcp_path) / "start.bat"
            if start_script.is_file():
                subprocess.Popen(
                    ["cmd", "/c", str(start_script)],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    creationflags=subprocess.CREATE_NO_WINDOW,
                )
            else:
                subprocess.Popen(
                    ["uv", "run", "--directory", mcp_path, "python", "-m", "src.resonite_mcp.server"],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    creationflags=subprocess.CREATE_NO_WINDOW,
                )
        if await _wait_for_port(host, port, timeout=30):
            return f"resonite-mcp launched on :{port}."
        return f"resonite-mcp launch attempted but not detected on :{port}."
    except Exception as e:
        return f"Failed to launch resonite-mcp: {e}"


def _find_resonite_mcp() -> str | None:
    """Return path to resonite-mcp repo, 'uvx' if available via uvx, or None."""
    candidates = [
        os.environ.get("RESONITE_MCP_PATH", ""),
        str(Path.home() / "Dev" / "repos" / "resonite-mcp"),
        r"D:\Dev\repos\resonite-mcp",
        r"D:\Dev\Repos\resonite-mcp",
    ]
    for c in candidates:
        if c and Path(c).is_dir():
            return c

    # Check if uvx can resolve it
    try:
        r = subprocess.run(["uvx", "resonite-mcp", "--help"], capture_output=True, text=True, timeout=10)
        if r.returncode == 0:
            return "uvx"
    except Exception:
        pass
    return None


def _find_overte_mcp() -> str | None:
    """Return path to the overte-mcp repo, or None."""
    candidates = [
        os.environ.get("OVERTE_MCP_PATH", ""),
        str(Path.home() / "Dev" / "repos" / "overte-mcp"),
        r"D:\Dev\repos\overte-mcp",
        r"D:\Dev\Repos\overte-mcp",
    ]
    for c in candidates:
        if c and Path(c).is_dir():
            return c
    return None


async def ensure_overte_mcp(host: str = "127.0.0.1", port: int = 11110) -> str | None:
    """Ensure overte-mcp is reachable. If not, autostart it from the repo.

    Returns a status message, or None if already reachable.
    """
    if await _wait_for_port(host, port, timeout=2):
        return None  # already running

    mcp_path = _find_overte_mcp()
    if not mcp_path:
        return "overte-mcp not found. Clone it to D:\\Dev\\repos\\overte-mcp or set OVERTE_MCP_PATH."

    try:
        start_script = Path(mcp_path) / "start.bat"
        if start_script.is_file():
            subprocess.Popen(
                ["cmd", "/c", str(start_script)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=subprocess.CREATE_NO_WINDOW,
            )
        else:
            subprocess.Popen(
                ["uv", "run", "--directory", mcp_path, "overte-mcp"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=subprocess.CREATE_NO_WINDOW,
            )
        if await _wait_for_port(host, port, timeout=30):
            return f"overte-mcp launched on :{port}."
        return f"overte-mcp launch attempted but not detected on :{port}."
    except Exception as e:
        return f"Failed to launch overte-mcp: {e}"
