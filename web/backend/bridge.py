"""
FastAPI bridge server for worldlabs-mcp webapp.
Runs on port 10865, serves API for the React frontend on port 10864.
"""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

# Load .env from repo root (two levels up from web/backend/)
try:
    from dotenv import load_dotenv

    _env_path = Path(__file__).parent.parent.parent / ".env"
    load_dotenv(_env_path, override=False)
except ImportError:
    pass  # python-dotenv optional; use real env vars or start.ps1 injection

import time
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

app = FastAPI(
    title="worldlabs-mcp bridge",
    description="Backend API for the World Labs MCP webapp",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:10864", "http://127.0.0.1:10864"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_URL = os.getenv("WORLDLABS_BASE_URL", "https://api.worldlabs.ai/marble/v1")

# ── Tool definitions ──────────────────────────────────────────────────────────

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
        "description": "Block-poll an operation until it completes (or times out).",
        "parameters": {
            "operation_id": {"type": "string"},
            "poll_interval_seconds": {
                "type": "integer",
                "description": "Seconds between polls (default 15).",
            },
            "timeout_seconds": {
                "type": "integer",
                "description": "Max seconds to wait (default 600).",
            },
        },
    },
    {
        "name": "get_world",
        "description": "Fetch the latest details for a generated world.",
        "parameters": {
            "world_id": {"type": "string", "description": "The world UUID."},
        },
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


def _get_api_key() -> str:
    return os.getenv("WORLDLABS_API_KEY", "")


def _headers() -> dict[str, str]:
    return {
        "WLT-Api-Key": _get_api_key(),
        "Content-Type": "application/json",
    }


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


# ── Health / System ───────────────────────────────────────────────────────────


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "timestamp": str(time.time())}


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


# ── Operations ────────────────────────────────────────────────────────────────


@app.get("/api/operations/{operation_id}")
async def get_operation(operation_id: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{BASE_URL}/operations/{operation_id}",
            headers=_headers(),
        )
        if resp.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid API key")
        resp.raise_for_status()
        data: dict[str, Any] = resp.json()
        # Normalise nested world assets so frontend always gets flat urls
        if data.get("done") and data.get("response"):
            world = data["response"]
            data["response"]["_assets"] = _extract_assets(world)
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


# ── Download proxy ────────────────────────────────────────────────────────────

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

    async def _stream() -> Any:
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


# ── Generation ────────────────────────────────────────────────────────────────


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


@app.post("/api/generate/text")
async def generate_from_text(req: TextGenRequest) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "display_name": req.name,
        "model": req.model,
        "world_prompt": {"type": "text", "text_prompt": req.prompt},
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(f"{BASE_URL}/worlds:generate", headers=_headers(), json=payload)
        if resp.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid or missing WORLDLABS_API_KEY")
        resp.raise_for_status()
        return resp.json()  # type: ignore[no-any-return]


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
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(f"{BASE_URL}/worlds:generate", headers=_headers(), json=payload)
        resp.raise_for_status()
        return resp.json()  # type: ignore[no-any-return]


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
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(f"{BASE_URL}/worlds:generate", headers=_headers(), json=payload)
        resp.raise_for_status()
        return resp.json()  # type: ignore[no-any-return]


# ── DCC Export ────────────────────────────────────────────────────────────────


class ExportRequest(BaseModel):
    world_id: str
    world_name: str = "WorldLabs_World"
    spz_url: str = ""
    mesh_url: str = ""
    splat_lod: str = "500k"  # 100k | 500k | full_res


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

    # Download SPZ if provided
    if req.spz_url:
        try:
            spz_path = await _download_to_temp(req.spz_url, ".spz")
            results["spz_local"] = spz_path
            # Call blender-mcp HTTP bridge
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    f"http://localhost:{blender_port}/api/import/splat",
                    json={"file_path": spz_path, "sh_degree": 3, "setup_proxy": True},
                )
                if resp.status_code == 200:
                    results["splat_import"] = resp.json()
                else:
                    results["splat_import"] = {"status": "error", "detail": resp.text}
        except Exception as e:
            results["splat_import"] = {"status": "error", "detail": str(e)}

    # Download + import GLB
    if req.mesh_url:
        try:
            glb_path = await _download_to_temp(req.mesh_url, ".glb")
            results["mesh_local"] = glb_path
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    f"http://localhost:{blender_port}/api/import/file",
                    json={"filepath": glb_path, "file_format": "GLB"},
                )
                if resp.status_code == 200:
                    results["mesh_import"] = resp.json()
                else:
                    results["mesh_import"] = {"status": "error", "detail": resp.text}
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
                if resp.status_code == 200:
                    results[f"{kind}_import"] = resp.json()
                else:
                    results[f"{kind}_import"] = {"status": "error", "detail": resp.text}
        except Exception as e:
            results[f"{kind}_import"] = {"status": "error", "detail": str(e)}

    results["status"] = "ok"
    results["note"] = "Unity3D must be open with unity3d-mcp running."
    return results


@app.post("/api/export/resonite")
async def export_to_resonite(req: ExportRequest) -> dict[str, Any]:
    """Send world asset URL to a running Resonite client via OSC."""
    import socket
    import struct

    osc_host = os.getenv("RESONITE_OSC_HOST", "127.0.0.1")
    osc_port = int(os.getenv("RESONITE_OSC_PORT", "9000"))

    # Build minimal OSC message for /worldlabs/import with mesh_url as string arg
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
            "note": "OSC message sent. Resonite must be running with a /worldlabs/import OSC receiver.",
        }
    except Exception as e:
        return {"status": "error", "world_id": req.world_id, "detail": str(e)}


# ── Local LLM Discovery ───────────────────────────────────────────────────────


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
    except Exception:  # noqa: BLE001
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
    except Exception:  # noqa: BLE001
        return {"available": False, "models": [], "url": url}


def _fmt_size(size_bytes: int) -> str:
    if size_bytes == 0:
        return ""
    gb = size_bytes / 1e9
    return f"{gb:.1f} GB"


@app.get("/api/llm/discover")
async def discover_llms() -> dict[str, Any]:
    import asyncio

    ollama, lmstudio = await asyncio.gather(_probe_ollama(), _probe_lmstudio())
    return {"ollama": ollama, "lmstudio": lmstudio}


# ── Dev runner ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("WEB_PORT", "10865"))
    uvicorn.run("bridge:app", host="0.0.0.0", port=port, reload=True)
