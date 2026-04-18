"""
REST API bridge for the worldlabs-mcp webapp and Spatial Voice Agent.

Merged in 0.4.0 from the former web_sota/backend/bridge.py so that BOTH
the webapp and the MCP spatial tools talk to a single bridge on port 10865
(served by uvicorn worldlabs_mcp.server:app per web_sota/start.ps1).

Mounted at `/api` via `server.py:_web_app.include_router(router, prefix="/api")`.

Responsibilities:
  - Marble API proxy (generate/text, /image, /video; operations; worlds)
  - Narration SSE stream for the Spark viewer (spatial voice + scene events)
  - Local asset hosting (.spz/.rad/.ply/.ksplat/.splat)
  - History persistence (per-user ~/.worldlabs-mcp or %APPDATA%/worldlabs-mcp)
  - Prompt memory (CRUD)
  - Local LLM discovery (Ollama + LM Studio probing) and prompt refinement
  - DCC handoff (Blender / Unity3D / Resonite) with real asset download
  - System stats (CPU/memory/disk)
"""

from __future__ import annotations

import asyncio
import json
import os
import platform
import socket
import tempfile
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, AsyncGenerator

import httpx
import psutil
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

load_dotenv()

router = APIRouter()
BASE_URL = os.getenv("WORLDLABS_BASE_URL", "https://api.worldlabs.ai/marble/v1")
DEFAULT_MODEL = "marble-1.1"


# ---------------------------------------------------------------------------
# Data directory — writable, survives git operations, per-OS
# ---------------------------------------------------------------------------

if platform.system() == "Windows":
    _appdata = os.getenv("APPDATA") or str(Path.home() / "AppData" / "Roaming")
    DATA_DIR = Path(_appdata) / "worldlabs-mcp"
else:
    DATA_DIR = Path.home() / ".worldlabs-mcp"

DATA_DIR.mkdir(parents=True, exist_ok=True)
HISTORY_FILE = DATA_DIR / "history.json"
PROMPTS_FILE = DATA_DIR / "prompts.json"
SCENES_FILE = DATA_DIR / "scenes.json"


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------


class TextGenRequest(BaseModel):
    prompt: str
    name: str = ""
    model: str = DEFAULT_MODEL


class ImageGenRequest(BaseModel):
    url: str
    prompt: str = ""
    name: str = ""
    model: str = DEFAULT_MODEL
    is_panorama: bool = False


class VideoGenRequest(BaseModel):
    url: str
    prompt: str = ""
    name: str = ""
    model: str = DEFAULT_MODEL


class RefineRequest(BaseModel):
    prompt: str
    style: str = "Cinematic"
    provider: str  # "ollama" or "lmstudio"
    model: str


class HandoffRequest(BaseModel):
    world_id: str
    target: str  # "resonite" | "unity3d" | "blender"
    asset_type: str  # "splat" | "mesh"
    asset_url: str


class ExportRequest(BaseModel):
    world_id: str
    world_name: str = "WorldLabs_World"
    spz_url: str = ""
    mesh_url: str = ""
    splat_lod: str = "500k"


class PromptUpdate(BaseModel):
    fave: bool | None = None
    star: bool | None = None
    comment: str | None = None


class SceneEntity(BaseModel):
    id: str
    type: str  # "video" | "avatar" | "audio"
    url: str
    x: float
    y: float
    z: float
    rotation: float
    scale: float
    is_loop: bool = False


class SceneManifest(BaseModel):
    id: str
    name: str
    world_id: str
    world_name: str
    timestamp: str
    entities: list[SceneEntity]


# ---------------------------------------------------------------------------
# API key + Marble helpers
# ---------------------------------------------------------------------------


def _get_api_key() -> str:
    key = os.environ.get("WORLDLABS_API_KEY", "")
    if not key:
        raise HTTPException(
            status_code=503,
            detail="WORLDLABS_API_KEY not set. Set it in the environment.",
        )
    return key


def _headers() -> dict[str, str]:
    return {
        "WLT-Api-Key": _get_api_key(),
        "Content-Type": "application/json",
    }


def _handle_http_error(e: httpx.HTTPStatusError) -> None:
    """Provides human-readable error messages for common Marble API failures."""
    response = e.response
    status_code = response.status_code

    try:
        error_data = response.json()
        api_message = error_data.get("error", {}).get("message") or error_data.get("detail")
    except Exception:
        api_message = None

    if status_code == 401:
        raise HTTPException(
            status_code=401,
            detail=(
                f"World Labs API: 401 Unauthorized. Your WORLDLABS_API_KEY may be invalid. "
                f"({api_message or 'No additional details'})"
            ),
        )
    if status_code == 402:
        raise HTTPException(
            status_code=402,
            detail=(
                f"World Labs API: 402 Payment Required. {api_message or 'Insufficient credits.'} "
                "IMPORTANT: Credits on marble.worldlabs.ai (web app) are SEPARATE from API Platform credits. "
                "Check your API balance at https://platform.worldlabs.ai/"
            ),
        )
    if status_code == 429:
        raise HTTPException(
            status_code=429,
            detail=(
                f"World Labs API: 429 Too Many Requests. You have hit a rate limit. "
                f"({api_message or 'No details'})"
            ),
        )

    raise HTTPException(
        status_code=status_code,
        detail=f"World Labs API Error {status_code}: {api_message or response.text}",
    )


async def _wl_get(path: str, params: dict[str, Any] | None = None) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.get(
                f"{BASE_URL}{path}",
                headers=_headers(),
                params=params or {},
            )
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            _handle_http_error(e)


async def _wl_post(path: str, body: dict) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.post(
                f"{BASE_URL}{path}",
                headers=_headers(),
                json=body,
            )
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            _handle_http_error(e)


async def _poll_operation_with_retry(
    client: httpx.AsyncClient,
    operation_id: str,
    max_retries: int = 3,
) -> dict[str, Any]:
    """Poll an operation with exponential backoff — prevents transient errors from killing long jobs."""
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
                await asyncio.sleep(2**attempt)
    raise last_exc or RuntimeError("Poll failed after retries")


def _extract_assets(world: dict[str, Any]) -> dict[str, str | None]:
    """Flatten the Marble API world object into direct asset URLs for the frontend."""
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
# History persistence
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
    op_id = op.get("operation_id") or op.get("name", "").split("/")[-1]
    for i, existing in enumerate(history):
        existing_id = existing.get("operation_id") or existing.get("name", "").split("/")[-1]
        if existing_id == op_id:
            history[i] = op
            break
    else:
        history.insert(0, op)
    history = history[:50]
    try:
        HISTORY_FILE.write_text(json.dumps(history, indent=2), encoding="utf-8")
    except Exception:
        pass


def _load_prompts() -> list[dict[str, Any]]:
    if not PROMPTS_FILE.exists():
        return []
    try:
        return json.loads(PROMPTS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []


def _save_prompts(prompts: list[dict[str, Any]]) -> None:
    PROMPTS_FILE.write_text(json.dumps(prompts, indent=2), encoding="utf-8")


def _load_scenes() -> list[dict[str, Any]]:
    if not SCENES_FILE.exists():
        return []
    try:
        data = json.loads(SCENES_FILE.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _save_scenes(scenes: list[dict[str, Any]]) -> None:
    SCENES_FILE.write_text(json.dumps(scenes, indent=2), encoding="utf-8")


# ---------------------------------------------------------------------------
# System stats
# ---------------------------------------------------------------------------


def _get_disk_usage_percent() -> float:
    try:
        if platform.system() == "Windows":
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
# Narration stream — Spatial Voice Agent
# ---------------------------------------------------------------------------

_narration_clients: list[asyncio.Queue] = []


@router.post("/narration")
async def push_narration(body: dict) -> dict:
    """Event types: 'speech', 'audio', 'video', 'avatar'"""
    event = {
        "id": os.urandom(4).hex(),
        "type": body.get("type", "speech"),
        "text": body.get("text"),
        "url": body.get("url"),
        "x": float(body.get("x", 0)),
        "y": float(body.get("y", 0)),
        "z": float(body.get("z", 0)),
        "rotation": float(body.get("rotation", 0)),
        "scale": float(body.get("scale", 1.0)),
        "is_loop": bool(body.get("is_loop", False)),
        "timestamp": str(time.time()),
    }
    for q in _narration_clients:
        await q.put(event)
    return {
        "status": "broadcasted",
        "recipients": len(_narration_clients),
        "event_id": event["id"],
    }


@router.get("/narration/stream")
async def narration_stream(request: Request) -> StreamingResponse:
    """SSE stream for the Spark Viewer to receive spatial narration events."""
    queue: asyncio.Queue = asyncio.Queue()
    _narration_clients.append(queue)

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            while True:
                if await request.is_disconnected():
                    break
                data = await queue.get()
                yield f"data: {json.dumps(data)}\n\n"
        finally:
            if queue in _narration_clients:
                _narration_clients.remove(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ---------------------------------------------------------------------------
# Health / System / Capabilities (per AGENT_PROTOCOLS §1.4)
# ---------------------------------------------------------------------------


@router.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "timestamp": str(time.time()),
        "system": _get_system_stats(),
    }


@router.get("/system")
async def system_info() -> dict:
    return {
        "service": "worldlabs-mcp",
        "version": "0.4.0",
        "marble_api": BASE_URL,
        "api_key_set": bool(os.environ.get("WORLDLABS_API_KEY")),
        "default_model": DEFAULT_MODEL,
    }


@router.get("/capabilities")
async def capabilities() -> dict:
    """Runtime feature-gating for the webapp (AGENT_PROTOCOLS §1.4)."""
    return {
        "marble_generate": bool(os.environ.get("WORLDLABS_API_KEY")),
        "narration_stream": True,
        "spark_viewer": True,
        "local_assets": True,
        "llm_refine": True,  # probed lazily on first call
        "dcc_export": {
            "blender": True,
            "unity3d": bool(os.environ.get("UNITY_PROJECT_PATH")),
            "resonite": True,
        },
        "history": True,
        "prompts": True,
    }


# ---------------------------------------------------------------------------
# Local asset serving (Spark viewer reads .rad / .spz from local disk)
# ---------------------------------------------------------------------------


@router.get("/local-assets/{filename:path}")
async def get_local_asset(filename: str) -> FileResponse:
    """
    Serve local world assets from the filesystem.

    Root lookup order:
      1. WORLDLABS_LOCAL_PATH env var (explicit user override)
      2. ~/Downloads  (portable default)
    """
    default_root = os.path.expanduser("~/Downloads")
    local_root = os.environ.get("WORLDLABS_LOCAL_PATH", default_root)
    file_path = os.path.join(local_root, filename)

    abs_path = os.path.abspath(file_path)
    if not abs_path.startswith(os.path.abspath(local_root)):
        raise HTTPException(status_code=403, detail="Access denied (path traversal)")

    if not os.path.exists(abs_path):
        raise HTTPException(status_code=404, detail=f"Asset not found: {filename}")

    allowed_exts = {".spz", ".rad", ".ply", ".ksplat", ".splat"}
    if os.path.splitext(abs_path)[1].lower() not in allowed_exts:
        raise HTTPException(status_code=400, detail="Unsupported asset type")

    return FileResponse(abs_path)


# ---------------------------------------------------------------------------
# Marble generation — fire-and-forget (returns operation immediately)
# ---------------------------------------------------------------------------


@router.post("/generate/text")
async def generate_from_text(req: TextGenRequest) -> dict[str, Any]:
    payload = {
        "display_name": req.name,
        "model": req.model,
        "world_prompt": {"type": "text", "text_prompt": req.prompt},
    }
    data = await _wl_post("/worlds:generate", payload)
    _save_operation(data)
    return data


@router.post("/generate/image")
async def generate_from_image(req: ImageGenRequest) -> dict[str, Any]:
    image_prompt: dict[str, Any] = {"source": "uri", "uri": req.url}
    if req.is_panorama:
        image_prompt["is_pano"] = True
    world_prompt: dict[str, Any] = {"type": "image", "image_prompt": image_prompt}
    if req.prompt:
        world_prompt["text_prompt"] = req.prompt
    payload = {"display_name": req.name, "model": req.model, "world_prompt": world_prompt}
    data = await _wl_post("/worlds:generate", payload)
    _save_operation(data)
    return data


@router.post("/generate/video")
async def generate_from_video(req: VideoGenRequest) -> dict[str, Any]:
    world_prompt: dict[str, Any] = {
        "type": "video",
        "video_prompt": {"source": "uri", "uri": req.url},
    }
    if req.prompt:
        world_prompt["text_prompt"] = req.prompt
    payload = {"display_name": req.name, "model": req.model, "world_prompt": world_prompt}
    data = await _wl_post("/worlds:generate", payload)
    _save_operation(data)
    return data


# ---------------------------------------------------------------------------
# Operations + worlds
# ---------------------------------------------------------------------------


@router.get("/operations/{operation_id}")
async def get_operation(operation_id: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30) as client:
        data = await _poll_operation_with_retry(client, operation_id)
        if data.get("done") and data.get("response"):
            data["response"]["_assets"] = _extract_assets(data["response"])
        _save_operation(data)
        return data


@router.get("/operations/{operation_id}/stream")
async def stream_operation(operation_id: str) -> StreamingResponse:
    """SSE endpoint: streams operation status updates until done (or 10-minute cap)."""
    poll_interval = 5
    max_duration = 600

    async def _gen() -> AsyncGenerator[str, None]:
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

                progress = (data.get("metadata") or {}).get("progress") or {}
                status = progress.get("status", "IN_PROGRESS")
                description = progress.get("description", "")

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
        _gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/worlds/{world_id}")
async def get_world(world_id: str) -> dict[str, Any]:
    data = await _wl_get(f"/worlds/{world_id}")
    world = data.get("world", data)
    world["_assets"] = _extract_assets(world)
    return data


# ---------------------------------------------------------------------------
# Download proxy — streams Marble's signed URLs with a sensible filename
# ---------------------------------------------------------------------------

_ASSET_FILENAMES: dict[str, tuple[str, str]] = {
    "splat_100k": ("world_{id}_100k.spz", "application/octet-stream"),
    "splat_500k": ("world_{id}_500k.spz", "application/octet-stream"),
    "splat_full": ("world_{id}_full.spz", "application/octet-stream"),
    "mesh": ("world_{id}_collider.glb", "model/gltf-binary"),
    "panorama": ("world_{id}_panorama.jpg", "image/jpeg"),
}


@router.get("/worlds/{world_id}/download")
async def download_world_asset(
    world_id: str,
    asset_type: str = Query(..., description="splat_100k|splat_500k|splat_full|mesh|panorama"),
    url: str = Query(..., description="Signed asset URL from a completed operation"),
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
# History + prompt memory
# ---------------------------------------------------------------------------


@router.get("/history")
async def get_history() -> list[dict[str, Any]]:
    """Local history (last 50 operations this user has kicked off)."""
    return _load_history()


@router.get("/history/remote")
async def get_remote_history() -> dict:
    """Pass-through to the Marble /worlds listing (account-wide)."""
    return await _wl_get("/worlds", params={"page_size": "20"})


@router.get("/prompts")
async def list_prompts() -> list[dict[str, Any]]:
    return _load_prompts()


@router.post("/prompts")
async def create_prompt(entry: dict[str, Any]) -> dict[str, Any]:
    entry["id"] = entry.get("id") or str(uuid.uuid4())
    entry["timestamp"] = entry.get("timestamp") or datetime.now().isoformat()
    entry.setdefault("fave", False)
    entry.setdefault("star", False)
    entry.setdefault("comment", "")
    prompts = _load_prompts()
    prompts.append(entry)
    _save_prompts(prompts)
    return entry


@router.patch("/prompts/{prompt_id}")
async def update_prompt(prompt_id: str, update: PromptUpdate) -> dict[str, Any]:
    prompts = _load_prompts()
    for p in prompts:
        if p["id"] == prompt_id:
            if update.fave is not None:
                p["fave"] = update.fave
            if update.star is not None:
                p["star"] = update.star
            if update.comment is not None:
                p["comment"] = update.comment
            _save_prompts(prompts)
            return p
    raise HTTPException(status_code=404, detail="Prompt not found")


@router.delete("/prompts/{prompt_id}")
async def delete_prompt(prompt_id: str) -> dict[str, Any]:
    prompts = _load_prompts()
    new_prompts = [p for p in prompts if p["id"] != prompt_id]
    if len(new_prompts) == len(prompts):
        raise HTTPException(status_code=404, detail="Prompt not found")
    _save_prompts(new_prompts)
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Local LLM discovery (Ollama + LM Studio) + prompt refinement
# ---------------------------------------------------------------------------


def _fmt_size(size_bytes: int) -> str:
    if not size_bytes:
        return ""
    gb = size_bytes / 1e9
    return f"{gb:.1f} GB"


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


@router.get("/llm/discover")
async def discover_llms() -> dict[str, Any]:
    ollama, lmstudio = await asyncio.gather(_probe_ollama(), _probe_lmstudio())
    return {"ollama": ollama, "lmstudio": lmstudio}


@router.post("/llm/refine")
async def refine_prompt(req: RefineRequest) -> dict[str, Any]:
    """Refine a short prompt into a detailed Marble-optimised prompt via a local LLM."""
    system_prompt = f"""You are an expert World Labs Marble prompt engineer.
Transform a short, simple prompt into a 20-line, high-fidelity, highly detailed technical
prompt optimized for 3D world generation in Marble. Style requested: {req.style}.

Focus on:
1. Spatial layout, specific geometry, and scale.
2. Lighting (ray tracing, global illumination), mood, atmospheric scattering.
3. Texture detail, PBR material properties, surface imperfections.
4. Density of objects and relative placement in the 3D volume.
5. Technical keywords like '8k-res', 'cinematic lighting', 'octane render', 'hyper-real'.

Output ONLY the detailed prompt text, aiming for exactly 20 lines. No conversational filler,
no markdown, no introduction."""

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
        raise HTTPException(status_code=500, detail=f"Refinement failed: {e}") from e


# ---------------------------------------------------------------------------
# DCC handoff — Blender / Unity3D / Resonite
# ---------------------------------------------------------------------------


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


@router.post("/export/blender")
async def export_to_blender(req: ExportRequest) -> dict[str, Any]:
    """Download SPZ splat + GLB mesh locally then call the blender-mcp bridge."""
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


@router.post("/export/unity3d")
async def export_to_unity3d(req: ExportRequest) -> dict[str, Any]:
    """Copy GLB + SPZ into the Unity project via the unity3d-mcp bridge."""
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


def _encode_osc_string(s: str) -> bytes:
    b = s.encode("utf-8") + b"\x00"
    pad = (4 - len(b) % 4) % 4
    return b + b"\x00" * pad


@router.post("/export/resonite")
async def export_to_resonite(req: ExportRequest) -> dict[str, Any]:
    """Send world asset URL to a running Resonite client via OSC."""
    osc_host = os.getenv("RESONITE_OSC_HOST", "127.0.0.1")
    osc_port = int(os.getenv("RESONITE_OSC_PORT", "9000"))

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
            "note": "OSC sent. Resonite must be running with a /worldlabs/import receiver.",
        }
    except Exception as e:
        return {"status": "error", "world_id": req.world_id, "detail": str(e)}


@router.post("/handoff")
async def handoff_asset(req: HandoffRequest) -> dict[str, Any]:
    """Unified handoff router — lighter than /export/* (no temp downloads for simple cases)."""
    results: dict[str, Any] = {
        "world_id": req.world_id,
        "target": req.target,
        "asset_type": req.asset_type,
    }

    if req.target == "resonite":
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
        blender_port = int(os.getenv("BLENDER_MCP_PORT", "10700"))
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
# Scene Persistence (Baking)
# ---------------------------------------------------------------------------


@router.get("/scenes")
async def list_scenes(world_id: str | None = None) -> list[dict[str, Any]]:
    scenes = _load_scenes()
    if world_id:
        return [s for s in scenes if s["world_id"] == world_id]
    return scenes


@router.post("/scenes/bake")
async def bake_scene(scene: SceneManifest) -> dict[str, Any]:
    scenes = _load_scenes()
    # Replace if exists, else append
    for i, s in enumerate(scenes):
        if s["id"] == scene.id:
            scenes[i] = scene.model_dump()
            break
    else:
        scenes.insert(0, scene.model_dump())

    _save_scenes(scenes)
    return {"status": "ok", "scene_id": scene.id}


@router.delete("/scenes/{scene_id}")
async def delete_scene(scene_id: str) -> dict[str, Any]:
    scenes = _load_scenes()
    new_scenes = [s for s in scenes if s["id"] != scene_id]
    _save_scenes(new_scenes)
    return {"status": "ok"}
