"""
FastAPI bridge server for worldlabs-mcp webapp.
Runs on port 10865, serves API for the React frontend on port 10864.
"""

from __future__ import annotations

import os
import time
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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
SERVER_START = time.time()

# ── Tool definitions mirrored from server.py ──────────────────────────────────

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
        return resp.json()  # type: ignore[no-any-return]


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
