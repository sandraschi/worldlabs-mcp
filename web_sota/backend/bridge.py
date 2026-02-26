"""
FastAPI bridge server for worldlabs-mcp webapp.
Runs on port 10865, serves API for the React frontend on port 10864.

Fixes applied:
- psutil.disk_usage uses Windows-safe path detection
- CORS: wildcard origin is incompatible with allow_credentials=True; use explicit origin list
- WEB_PORT default consistent with start.ps1 (10865)
- Data files (history.json, prompts.json) stored in user-writable data dir, not next to source
- /api/generate/stream SSE endpoint: fire-and-forget generation with real-time status events
- Retry logic on transient poll failures (3 retries, exponential backoff)
"""

from __future__ import annotations

import asyncio
import json
import os
import platform
import tempfile
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, AsyncGenerator

import httpx
import psutil
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Data directory: writable user location, survives git operations
# ---------------------------------------------------------------------------

if platform.system() == "Windows":
    _appdata = os.getenv("APPDATA") or str(Path.home() / "AppData" / "Roaming")
    DATA_DIR = Path(_appdata) / "worldlabs-mcp"
else:
    DATA_DIR = Path.home() / ".worldlabs-mcp"

DATA_DIR.mkdir(parents=True, exist_ok=True)
HISTORY_FILE = DATA_DIR / "history.json"
PROMPTS_FILE = DATA_DIR / "prompts.json"


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class RefineRequest(BaseModel):
    prompt: str
    style: str = "Cinematic"
    provider: str  # "ollama" or "lmstudio"
    model: str


class HandoffRequest(BaseModel):
    world_id: str
    target: str  # "resonite", "unity3d", "blender"
    asset_type: str  # "splat" or "mesh"
    asset_url: str


class PromptEntry(BaseModel):
    id: str
    text: str
    style: str
    timestamp: str
    fave: bool = False
    star: bool = False
    comment: str = ""


class PromptUpdate(BaseModel):
    fave: bool | None = None
    star: bool | None = None
    comment: str | None = None


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="worldlabs-mcp bridge",
    description="Backend API for the World Labs MCP webapp",
    version="0.1.0",
)

# CORS: wildcard origin + allow_credentials=True is invalid per the CORS spec.
# Use explicit origins for localhost dev.
_FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:10864")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[_FRONTEND_ORIGIN, "http://127.0.0.1:10864"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_URL = os.getenv("WORLDLABS_BASE_URL", "https://api.worldlabs.ai/marble/v1")


# ---------------------------------------------------------------------------
# History helpers
# ---------------------------------------------------------------------------


def _load_history() -> list[dict[str, Any]]:
    if not HISTORY_FILE.exists():
        return []
    try:
        data = json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _save_operation(op: dict[str, Any]) -> None:
    history = _load_history()
    op_id = op.get("operation_id")
    for i, existing in enumerate(history):
        if existing.get("operation_id") == op_id:
            history[i] = op
            break
    else:
        history.insert(0, op)
    history = history[:50]
    try:
        HISTORY_FILE.write_text(json.dumps(history, indent=2), encoding="utf-8")
    except Exception:
        pass


# ---------------------------------------------------------------------------
# System stats — Windows-safe disk path
# ---------------------------------------------------------------------------


def _get_disk_usage_percent() -> float:
    try:
        if platform.system() == "Windows":
            # Use the drive where DATA_DIR lives
            drive = str(DATA_DIR.anchor)  # e.g. "C:\\"
        else:
            drive = "/"
        return psutil.disk_usage(drive).percent
    except Exception:
        return 0.0


def _get_system_stats() -> dict[str, Any]:
    return {
        "cpu_percent": psutil.cpu_percent(),
        "memory": {"percent": psutil.virtual_memory().percent},
        "disk": {"percent": _get_disk_usage_percent()},
    }


# ---------------------------------------------------------------------------
# API key / headers
# ---------------------------------------------------------------------------


def _get_api_key() -> str:
    return os.getenv("WORLDLABS_API_KEY", "")


def _headers() -> dict[str, str]:
    return {
        "WLT-Api-Key": _get_api_key(),
        "Content-Type": "application/json",
    }


# ---------------------------------------------------------------------------
# Asset normalisation
# ---------------------------------------------------------------------------


def _extract_assets(world: dict[str, Any]) -> dict[str, str | None]:
    """Normalise the Marble API world object into flat asset URLs."""
    assets = world.get("assets", {})
    spz = assets.get("splats", {}).get("spz_urls", {})
    return {
        "splat_100k": spz.get("100k"),
        "splat_500k": spz.get("500k"),
        "splat_full": spz.get("full_res"),
        "mesh": assets.get("mesh", {}).get("collider_mesh_url"),
        "panorama": assets.get("imagery", {}).get("pano_url"),
        "thumbnail": assets.get("thumbnail_url"),
        "caption": assets.get("caption"),
    }


# ---------------------------------------------------------------------------
# Poll with retries — prevents transient errors from killing a 5-min job
# ---------------------------------------------------------------------------


async def _poll_operation_with_retry(
    client: httpx.AsyncClient,
    operation_id: str,
    max_retries: int = 3,
) -> dict[str, Any]:
    last_exc: Exception | None = None
    for attempt in range(max_retries):
        try:
            resp = await client.get(
                f"{BASE_URL}/operations/{operation_id}",
                headers=_headers(),
            )
            resp.raise_for_status()
            return resp.json()
        except (httpx.TransportError, httpx.HTTPStatusError) as exc:
            last_exc = exc
            if attempt < max_retries - 1:
                await asyncio.sleep(2**attempt)  # 1s, 2s backoff
    raise last_exc or RuntimeError("Poll failed after retries")


# ---------------------------------------------------------------------------
# Tool definitions (for /api/system)
# ---------------------------------------------------------------------------

TOOLS = [
    {
        "name": "generate_world_from_text",
        "description": "Generate a 3D world from a text description.",
        "parameters": {
            "text_prompt": {
                "type": "string",
                "description": "Description of the world to generate.",
            },
            "display_name": {"type": "string", "description": "Optional human-readable name."},
            "model": {"type": "string", "description": "'Marble 0.1-plus' or 'Marble 0.1-mini'."},
        },
    },
    {
        "name": "generate_world_from_image",
        "description": "Generate a 3D world from an image URL.",
        "parameters": {
            "image_url": {"type": "string", "description": "Public URL of the source image."},
            "text_prompt": {"type": "string", "description": "Optional text to guide generation."},
            "display_name": {"type": "string"},
            "is_panorama": {"type": "boolean", "description": "True if image is a 360° panorama."},
            "model": {"type": "string"},
        },
    },
    {
        "name": "generate_world_from_video",
        "description": "Generate a 3D world from a video URL.",
        "parameters": {
            "video_url": {"type": "string", "description": "Public URL of the source video."},
            "text_prompt": {"type": "string"},
            "display_name": {"type": "string"},
            "model": {"type": "string"},
        },
    },
    {
        "name": "get_operation",
        "description": "Poll a generation operation for status/result.",
        "parameters": {
            "operation_id": {
                "type": "string",
                "description": "The operation_id from a generate call.",
            },
        },
    },
    {
        "name": "wait_for_world",
        "description": "Block-poll an operation until it completes (or times out, default 90s).",
        "parameters": {
            "operation_id": {"type": "string"},
            "poll_interval_seconds": {"type": "integer"},
            "timeout_seconds": {"type": "integer"},
        },
    },
    {
        "name": "get_world",
        "description": "Fetch the latest details for a generated world.",
        "parameters": {"world_id": {"type": "string", "description": "The world UUID."}},
    },
    {
        "name": "prepare_media_upload",
        "description": "Prepare a signed upload URL for a local file (image or video).",
        "parameters": {
            "file_name": {"type": "string"},
            "kind": {"type": "string", "description": "'image' or 'video'."},
            "extension": {
                "type": "string",
                "description": "File extension without dot, e.g. 'jpg'.",
            },
        },
    },
    {
        "name": "generate_world_from_media_asset",
        "description": "Generate a world from a previously uploaded media asset.",
        "parameters": {
            "media_asset_id": {"type": "string"},
            "kind": {"type": "string"},
            "text_prompt": {"type": "string"},
            "display_name": {"type": "string"},
            "is_panorama": {"type": "boolean"},
            "model": {"type": "string"},
        },
    },
]


# ---------------------------------------------------------------------------
# Health / System
# ---------------------------------------------------------------------------


@app.get("/api/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "timestamp": str(time.time()),
        "system": _get_system_stats(),
    }


@app.get("/api/history")
async def get_history() -> list[dict[str, Any]]:
    return _load_history()


@app.get("/api/system")
async def system_info() -> dict[str, Any]:
    return {
        "name": "worldlabs-mcp",
        "version": "0.1.0",
        "description": "Generate explorable 3D worlds using World Labs Marble API",
        "tools": TOOLS,
        "api_key_set": bool(_get_api_key()),
        "base_url": BASE_URL,
    }


# ---------------------------------------------------------------------------
# Operations
# ---------------------------------------------------------------------------


@app.get("/api/operations/{operation_id}")
async def get_operation(operation_id: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30) as client:
        data = await _poll_operation_with_retry(client, operation_id)
        if data.get("done") and data.get("response"):
            world = data["response"]
            data["response"]["_assets"] = _extract_assets(world)
        _save_operation(data)
        return data


@app.get("/api/worlds/{world_id}")
async def get_world(world_id: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{BASE_URL}/worlds/{world_id}",
            headers=_headers(),
        )
        if resp.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid API key")
        resp.raise_for_status()
        data: dict[str, Any] = resp.json()
        world = data.get("world", data)
        world["_assets"] = _extract_assets(world)
        return data


# ---------------------------------------------------------------------------
# Download proxy
# ---------------------------------------------------------------------------

_ASSET_FILENAMES: dict[str, tuple[str, str]] = {
    "splat_100k": ("world_{id}_100k.spz", "application/octet-stream"),
    "splat_500k": ("world_{id}_500k.spz", "application/octet-stream"),
    "splat_full": ("world_{id}_full.spz", "application/octet-stream"),
    "mesh": ("world_{id}_collider.glb", "model/gltf-binary"),
    "panorama": ("world_{id}_panorama.jpg", "image/jpeg"),
}


@app.get("/api/worlds/{world_id}/download")
async def download_world_asset(
    world_id: str,
    asset_type: str = Query(..., description="splat_100k|splat_500k|splat_full|mesh|panorama"),
    url: str = Query(..., description="Signed asset URL from completed operation"),
) -> StreamingResponse:
    if asset_type not in _ASSET_FILENAMES:
        raise HTTPException(status_code=400, detail=f"Unknown asset_type: {asset_type}")

    filename_template, media_type = _ASSET_FILENAMES[asset_type]
    filename = filename_template.replace("{id}", world_id[:8])

    async def _stream() -> AsyncGenerator[bytes, None]:
        async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
            async with client.stream("GET", url) as resp:
                resp.raise_for_status()
                async for chunk in resp.aiter_bytes(65536):
                    yield chunk

    return StreamingResponse(
        _stream(),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------------------------------------------------------------------------
# Generation (fire-and-forget — returns operation immediately)
# ---------------------------------------------------------------------------


class TextGenRequest(BaseModel):
    prompt: str
    name: str = ""
    model: str = "Marble 0.1-plus"


class ImageGenRequest(BaseModel):
    url: str
    prompt: str = ""
    name: str = ""
    model: str = "Marble 0.1-plus"
    is_panorama: bool = False


class VideoGenRequest(BaseModel):
    url: str
    prompt: str = ""
    name: str = ""
    model: str = "Marble 0.1-plus"


async def _post_generate(payload: dict[str, Any]) -> dict[str, Any]:
    """POST to Marble generate endpoint, return operation dict."""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{BASE_URL}/worlds:generate",
            headers=_headers(),
            json=payload,
        )
        if resp.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid or missing WORLDLABS_API_KEY")
        if not resp.is_success:
            raise HTTPException(
                status_code=resp.status_code, detail=f"Marble API Error: {resp.text}"
            )
        resp.raise_for_status()
        data: dict[str, Any] = resp.json()
        _save_operation(data)
        return data


@app.post("/api/generate/text")
async def generate_from_text(req: TextGenRequest) -> dict[str, Any]:
    return await _post_generate(
        {
            "display_name": req.name,
            "model": req.model,
            "world_prompt": {"type": "text", "text_prompt": req.prompt},
        }
    )


@app.post("/api/generate/image")
async def generate_from_image(req: ImageGenRequest) -> dict[str, Any]:
    image_prompt: dict[str, Any] = {"source": "uri", "uri": req.url}
    if req.is_panorama:
        image_prompt["is_pano"] = True
    payload: dict[str, Any] = {
        "display_name": req.name,
        "model": req.model,
        "world_prompt": {"type": "image", "image_prompt": image_prompt},
    }
    if req.prompt:
        payload["world_prompt"]["text_prompt"] = req.prompt
    return await _post_generate(payload)


@app.post("/api/generate/video")
async def generate_from_video(req: VideoGenRequest) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "display_name": req.name,
        "model": req.model,
        "world_prompt": {
            "type": "video",
            "video_prompt": {"source": "uri", "uri": req.url},
        },
    }
    if req.prompt:
        payload["world_prompt"]["text_prompt"] = req.prompt
    return await _post_generate(payload)


# ---------------------------------------------------------------------------
# SSE streaming status endpoint
# Front-end calls GET /api/operations/{id}/stream and receives server-sent
# events until the operation completes.  This lets the modal stay live without
# the frontend polling on a timer.
# ---------------------------------------------------------------------------


@app.get("/api/operations/{operation_id}/stream")
async def stream_operation(operation_id: str) -> StreamingResponse:
    """
    SSE endpoint: streams operation status updates until done.
    Each event is JSON: { operation_id, done, status, description, response? }
    """

    async def _event_generator() -> AsyncGenerator[str, None]:
        poll_interval = 5  # seconds between polls via SSE
        max_duration = 600  # 10 minutes absolute cap
        start = time.monotonic()

        async with httpx.AsyncClient(timeout=30) as client:
            while True:
                elapsed = time.monotonic() - start
                if elapsed > max_duration:
                    event = {
                        "operation_id": operation_id,
                        "done": False,
                        "status": "TIMEOUT",
                        "description": "Stream exceeded 10-minute limit",
                    }
                    yield f"data: {json.dumps(event)}\n\n"
                    return

                try:
                    data = await _poll_operation_with_retry(client, operation_id)
                except Exception as exc:
                    event = {
                        "operation_id": operation_id,
                        "done": False,
                        "status": "POLL_ERROR",
                        "description": str(exc),
                    }
                    yield f"data: {json.dumps(event)}\n\n"
                    await asyncio.sleep(poll_interval)
                    continue

                progress = data.get("metadata", {}) or {}
                prog = progress.get("progress", {}) or {}
                status = prog.get("status", "IN_PROGRESS")
                description = prog.get("description", "")

                if data.get("done"):
                    if data.get("response"):
                        data["response"]["_assets"] = _extract_assets(data["response"])
                    _save_operation(data)
                    error = data.get("error")
                    event = {
                        "operation_id": operation_id,
                        "done": True,
                        "status": "FAILED" if error else "SUCCEEDED",
                        "description": str(error) if error else description,
                        "response": data.get("response"),
                    }
                    yield f"data: {json.dumps(event)}\n\n"
                    return

                event = {
                    "operation_id": operation_id,
                    "done": False,
                    "status": status,
                    "description": description,
                    "elapsed_seconds": int(elapsed),
                }
                yield f"data: {json.dumps(event)}\n\n"
                await asyncio.sleep(poll_interval)

    return StreamingResponse(
        _event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


# ---------------------------------------------------------------------------
# LLM Refinement
# ---------------------------------------------------------------------------


@app.post("/api/llm/refine")
async def refine_prompt(req: RefineRequest) -> dict[str, Any]:
    """Refine a short prompt into a detailed WorldLabs-optimized prompt using a local LLM."""
    system_prompt = f"""You are an expert WorldLabs Marble prompt engineer.
    Your task is to transform a short, simple prompt into a 20-line, high-fidelity,
    highly detailed technical prompt optimized for 3D world generation in WorldLabs Marble.
    The style requested is: {req.style}.

Focus on:
1. Spatial layout, specific geometry, and scale.
2. Lighting models (e.g., ray tracing, global illumination), mood, and atmospheric scattering.
3. Texture details, material properties (PBR), and surface imperfections.
4. Density of specific objects and their relative placement in the 3D volume.
5. High-end technical keywords like '8k-res', 'cinematic lighting', 'octane render', 'hyper-real'.

Output ONLY the detailed prompt text, aiming for exactly 20 lines of dense technical
description. Do not include any conversational filler, markdown, or introductory remarks."""

    user_content = f"Input prompt to be refined: {req.prompt}"

    try:
        if req.provider == "ollama":
            url = "http://localhost:11434/api/chat"
            payload = {
                "model": req.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                "stream": False,
            }
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(url, json=payload)
                resp.raise_for_status()
                result = resp.json()
                refined = result.get("message", {}).get("content", "").strip()

        elif req.provider == "lmstudio":
            url = "http://localhost:1234/v1/chat/completions"
            payload = {
                "model": req.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
            }
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(url, json=payload)
                resp.raise_for_status()
                result = resp.json()
                refined = (
                    result.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                )
        else:
            raise HTTPException(status_code=400, detail=f"Unknown provider: {req.provider}")

        return {"status": "ok", "refined": refined}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Refinement failed: {str(e)}")


# ---------------------------------------------------------------------------
# DCC Export
# ---------------------------------------------------------------------------


class ExportRequest(BaseModel):
    world_id: str
    world_name: str = "WorldLabs_World"
    spz_url: str = ""
    mesh_url: str = ""
    splat_lod: str = "500k"


async def _download_to_temp(url: str, suffix: str) -> str:
    """Download a URL to a temp file and return the local path."""
    tmp_dir = Path(tempfile.gettempdir()) / "worldlabs"
    tmp_dir.mkdir(exist_ok=True)
    dest = tmp_dir / f"wl_{abs(hash(url)) % 10**8}{suffix}"
    if dest.exists():
        return str(dest)
    async with httpx.AsyncClient(timeout=300, follow_redirects=True) as client:
        async with client.stream("GET", url) as resp:
            resp.raise_for_status()
            with open(dest, "wb") as f:
                async for chunk in resp.aiter_bytes(65536):
                    f.write(chunk)
    return str(dest)


@app.post("/api/export/blender")
async def export_to_blender(req: ExportRequest) -> dict[str, Any]:
    """Download SPZ splat + GLB mesh locally then call blender-mcp bridge."""
    blender_port = int(os.getenv("BLENDER_MCP_PORT", "10700"))
    results: dict[str, Any] = {"world_id": req.world_id, "target": "blender"}

    if req.spz_url:
        try:
            spz_path = await _download_to_temp(req.spz_url, ".spz")
            results["spz_local"] = spz_path
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    f"http://localhost:{blender_port}/api/import/splat",
                    json={"file_path": spz_path, "sh_degree": 3, "setup_proxy": True},
                )
                results["splat_import"] = (
                    resp.json()
                    if resp.status_code == 200
                    else {"status": "error", "detail": resp.text}
                )
        except Exception as e:
            results["splat_import"] = {"status": "error", "detail": str(e)}

    if req.mesh_url:
        try:
            glb_path = await _download_to_temp(req.mesh_url, ".glb")
            results["mesh_local"] = glb_path
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    f"http://localhost:{blender_port}/api/import/file",
                    json={"filepath": glb_path, "file_format": "GLB"},
                )
                results["mesh_import"] = (
                    resp.json()
                    if resp.status_code == 200
                    else {"status": "error", "detail": resp.text}
                )
        except Exception as e:
            results["mesh_import"] = {"status": "error", "detail": str(e)}

    results["status"] = "ok"
    results["note"] = "Blender must be running with blender-mcp connected."
    return results


@app.post("/api/export/unity3d")
async def export_to_unity3d(req: ExportRequest) -> dict[str, Any]:
    """Copy GLB + SPZ into the Unity project via unity3d-mcp bridge."""
    unity_port = int(os.getenv("UNITY3D_MCP_PORT", "10730"))
    unity_project = os.getenv("UNITY_PROJECT_PATH", "")
    results: dict[str, Any] = {"world_id": req.world_id, "target": "unity3d"}

    if not unity_project:
        results["status"] = "error"
        results["note"] = "Set UNITY_PROJECT_PATH env var to your Unity project root."
        return results

    assets_to_fetch = []
    if req.mesh_url:
        assets_to_fetch.append((req.mesh_url, ".glb", "mesh"))
    if req.spz_url:
        assets_to_fetch.append((req.spz_url, ".spz", "splat"))

    for url, suffix, kind in assets_to_fetch:
        try:
            local_path = await _download_to_temp(url, suffix)
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    f"http://localhost:{unity_port}/api/worldlabs/import",
                    json={
                        "source_path": local_path,
                        "project_path": unity_project,
                        "asset_name": req.world_name,
                    },
                )
                results[f"{kind}_import"] = (
                    resp.json()
                    if resp.status_code == 200
                    else {"status": "error", "detail": resp.text}
                )
        except Exception as e:
            results[f"{kind}_import"] = {"status": "error", "detail": str(e)}

    results["status"] = "ok"
    results["note"] = "Unity3D must be open with unity3d-mcp running."
    return results


@app.post("/api/export/resonite")
async def export_to_resonite(req: ExportRequest) -> dict[str, Any]:
    """Send world asset URL to a running Resonite client via OSC."""
    import socket

    osc_host = os.getenv("RESONITE_OSC_HOST", "127.0.0.1")
    osc_port = int(os.getenv("RESONITE_OSC_PORT", "9000"))

    def _encode_osc_string(s: str) -> bytes:
        b = s.encode("utf-8") + b"\x00"
        pad = (4 - len(b) % 4) % 4
        return b + b"\x00" * pad

    address = "/worldlabs/import"
    type_tag = ",ss"
    msg = (
        _encode_osc_string(address)
        + _encode_osc_string(type_tag)
        + _encode_osc_string(req.mesh_url or "")
        + _encode_osc_string(req.world_name)
    )

    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.sendto(msg, (osc_host, osc_port))
        sock.close()
        return {
            "status": "ok",
            "world_id": req.world_id,
            "target": "resonite",
            "osc_address": address,
            "osc_host": osc_host,
            "osc_port": osc_port,
            "mesh_url": req.mesh_url,
            "note": "OSC message sent. Resonite must be running with /worldlabs/import receiver.",
        }
    except Exception as e:
        return {"status": "error", "world_id": req.world_id, "detail": str(e)}


# ---------------------------------------------------------------------------
# Prompt Memory System
# ---------------------------------------------------------------------------


def load_prompts() -> list[dict[str, Any]]:
    if not PROMPTS_FILE.exists():
        return []
    try:
        return json.loads(PROMPTS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []


def save_prompts(prompts: list[dict[str, Any]]) -> None:
    PROMPTS_FILE.write_text(json.dumps(prompts, indent=2), encoding="utf-8")


@app.get("/api/prompts")
async def get_prompts() -> list[dict[str, Any]]:
    return load_prompts()


@app.post("/api/prompts")
async def create_prompt(entry: dict[str, Any]) -> dict[str, Any]:
    entry["id"] = entry.get("id") or str(uuid.uuid4())
    entry["timestamp"] = entry.get("timestamp") or datetime.now().isoformat()
    entry["fave"] = entry.get("fave", False)
    entry["star"] = entry.get("star", False)
    entry["comment"] = entry.get("comment", "")
    prompts = load_prompts()
    prompts.append(entry)
    save_prompts(prompts)
    return entry


@app.patch("/api/prompts/{prompt_id}")
async def update_prompt(prompt_id: str, update: PromptUpdate) -> dict[str, Any]:
    prompts = load_prompts()
    for p in prompts:
        if p["id"] == prompt_id:
            if update.fave is not None:
                p["fave"] = update.fave
            if update.star is not None:
                p["star"] = update.star
            if update.comment is not None:
                p["comment"] = update.comment
            save_prompts(prompts)
            return p
    raise HTTPException(status_code=404, detail="Prompt not found")


@app.delete("/api/prompts/{prompt_id}")
async def delete_prompt(prompt_id: str) -> dict[str, Any]:
    prompts = load_prompts()
    new_prompts = [p for p in prompts if p["id"] != prompt_id]
    if len(new_prompts) == len(prompts):
        raise HTTPException(status_code=404, detail="Prompt not found")
    save_prompts(new_prompts)
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Local LLM Discovery
# ---------------------------------------------------------------------------


async def _probe_ollama() -> dict[str, Any]:
    url = "http://localhost:11434"
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            resp = await client.get(f"{url}/api/tags")
            resp.raise_for_status()
            data = resp.json()
            models = [
                {
                    "id": m.get("name", ""),
                    "name": m.get("name", ""),
                    "provider": "ollama",
                    "size": _fmt_size(m.get("size", 0)),
                    "parameters": m.get("details", {}).get("parameter_size"),
                }
                for m in data.get("models", [])
            ]
            return {"available": True, "models": models, "url": url}
    except Exception:
        return {"available": False, "models": [], "url": url}


async def _probe_lmstudio() -> dict[str, Any]:
    url = "http://localhost:1234"
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            resp = await client.get(f"{url}/v1/models")
            resp.raise_for_status()
            data = resp.json()
            models = [
                {"id": m.get("id", ""), "name": m.get("id", ""), "provider": "lmstudio"}
                for m in data.get("data", [])
            ]
            return {"available": True, "models": models, "url": url}
    except Exception:
        return {"available": False, "models": [], "url": url}


def _fmt_size(size_bytes: int) -> str:
    if size_bytes == 0:
        return ""
    gb = size_bytes / 1e9
    return f"{gb:.1f} GB"


@app.get("/api/llm/discover")
async def discover_llms() -> dict[str, Any]:
    ollama, lmstudio = await asyncio.gather(_probe_ollama(), _probe_lmstudio())
    return {"ollama": ollama, "lmstudio": lmstudio}


# ---------------------------------------------------------------------------
# Unified Handoff
# ---------------------------------------------------------------------------


@app.post("/api/handoff")
async def handoff_asset(req: HandoffRequest) -> dict[str, Any]:
    """Unified handoff router for cross-MCP asset transfers."""
    results: dict[str, Any] = {
        "world_id": req.world_id,
        "target": req.target,
        "asset_type": req.asset_type,
    }

    if req.target == "resonite":
        import socket

        osc_host = os.getenv("RESONITE_OSC_HOST", "127.0.0.1")
        osc_port = int(os.getenv("RESONITE_OSC_PORT", "9000"))
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            msg = f"/import/worldlabs,{req.world_id},{req.asset_url}".encode("utf-8")
            sock.sendto(msg, (osc_host, osc_port))
            results["status"] = "ok"
            results["detail"] = f"Sent OSC packet to {osc_host}:{osc_port}"
        except Exception as e:
            results["status"] = "error"
            results["detail"] = str(e)

    elif req.target == "unity3d":
        unity_project = os.getenv("UNITY_PROJECT_PATH", "")
        if not unity_project:
            results["status"] = "error"
            results["detail"] = "UNITY_PROJECT_PATH not set."
        else:
            try:
                ext = ".spz" if req.asset_type == "splat" else ".glb"
                target_dir = Path(unity_project) / "Assets" / "WorldLabs"
                target_dir.mkdir(parents=True, exist_ok=True)
                target_path = target_dir / f"{req.world_id}{ext}"
                async with httpx.AsyncClient(timeout=120) as client:
                    resp = await client.get(req.asset_url)
                    resp.raise_for_status()
                    target_path.write_bytes(resp.content)
                results["status"] = "ok"
                results["detail"] = f"Saved to {target_path}"
            except Exception as e:
                results["status"] = "error"
                results["detail"] = str(e)

    elif req.target == "blender":
        blender_port = int(os.getenv("BLENDER_MCP_PORT", "10740"))
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    f"http://localhost:{blender_port}/api/import/url",
                    json={"url": req.asset_url, "world_id": req.world_id},
                )
                results["status"] = "ok" if resp.status_code == 200 else "error"
                results["detail"] = resp.json() if resp.status_code == 200 else resp.text
        except Exception as e:
            results["status"] = "error"
            results["detail"] = f"Blender MCP bridge failed: {e}"
    else:
        results["status"] = "error"
        results["detail"] = f"Unknown target: {req.target}"

    return results


# ---------------------------------------------------------------------------
# Dev runner
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("WEB_PORT", 10865))  # matches start.ps1 BackendPort
    uvicorn.run(app, host="127.0.0.1", port=port)
