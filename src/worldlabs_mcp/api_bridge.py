"""
REST API bridge for the web_sota frontend.
Proxies /api/* to World Labs Marble API so the webapp can generate worlds.
"""

import os
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException

router = APIRouter()
BASE_URL = "https://api.worldlabs.ai/marble/v1"


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


async def _wl_get(path: str, params: dict[str, Any] | None = None) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{BASE_URL}{path}",
            headers=_headers(),
            params=params or {},
        )
        resp.raise_for_status()
        return resp.json()


async def _wl_post(path: str, body: dict) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{BASE_URL}{path}",
            headers=_headers(),
            json=body,
        )
        resp.raise_for_status()
        return resp.json()


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@router.get("/system")
async def system_info() -> dict:
    return {"service": "worldlabs-mcp", "marble_api": BASE_URL}


@router.post("/generate/text")
async def generate_text(body: dict) -> dict:
    prompt = body.get("prompt", "")
    name = body.get("name", "")
    model = body.get("model", "Marble 0.1-mini")
    payload = {
        "display_name": name,
        "model": model,
        "world_prompt": {"type": "text", "text_prompt": prompt},
    }
    return await _wl_post("/worlds:generate", payload)


@router.post("/generate/image")
async def generate_image(body: dict) -> dict:
    url = body.get("url", "")
    prompt = body.get("prompt", "")
    name = body.get("name", "")
    model = body.get("model", "Marble 0.1-mini")
    is_panorama = body.get("is_panorama", False)
    image_prompt: dict = {"source": "uri", "uri": url}
    if is_panorama:
        image_prompt["is_pano"] = True
    world_prompt: dict = {"type": "image", "image_prompt": image_prompt}
    if prompt:
        world_prompt["text_prompt"] = prompt
    payload = {
        "display_name": name,
        "model": model,
        "world_prompt": world_prompt,
    }
    return await _wl_post("/worlds:generate", payload)


@router.post("/generate/video")
async def generate_video(body: dict) -> dict:
    url = body.get("url", "")
    prompt = body.get("prompt", "")
    name = body.get("name", "")
    model = body.get("model", "Marble 0.1-mini")
    world_prompt: dict = {
        "type": "video",
        "video_prompt": {"source": "uri", "uri": url},
    }
    if prompt:
        world_prompt["text_prompt"] = prompt
    payload = {
        "display_name": name,
        "model": model,
        "world_prompt": world_prompt,
    }
    return await _wl_post("/worlds:generate", payload)


@router.get("/operations/{operation_id}")
async def get_operation(operation_id: str) -> dict:
    return await _wl_get(f"/operations/{operation_id}")


@router.get("/worlds/{world_id}")
async def get_world(world_id: str) -> dict:
    return await _wl_get(f"/worlds/{world_id}")


@router.get("/operations/{operation_id}/stream")
async def stream_operation(operation_id: str):
    """SSE stream for operation updates. Stub: frontend can poll GET /operations/:id instead."""
    from fastapi.responses import StreamingResponse
    import asyncio
    import json

    async def poll():
        seen = set()
        for _ in range(120):
            try:
                data = await _wl_get(f"/operations/{operation_id}")
                key = json.dumps(data, sort_keys=True)
                if key not in seen:
                    seen.add(key)
                    yield f"data: {json.dumps(data)}\n\n"
                if data.get("done"):
                    return
            except Exception:
                pass
            await asyncio.sleep(2)

    return StreamingResponse(
        poll(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@router.get("/llm/discover")
async def discover_llms() -> dict:
    return {"models": ["Marble 0.1-mini", "Marble 0.1-plus"]}


@router.post("/llm/refine")
async def refine_prompt(body: dict) -> dict:
    return {"refined": body.get("prompt", "")}


@router.post("/export/blender")
@router.post("/export/unity3d")
@router.post("/export/resonite")
async def export_dcc(body: dict) -> dict:
    return {"status": "ok", "message": "Export not implemented"}


@router.post("/handoff")
async def handoff_asset(body: dict) -> dict:
    return {"status": "ok"}


@router.get("/history")
async def get_history() -> dict:
    return await _wl_get("/worlds", params={"page_size": "20"})


@router.get("/prompts")
async def get_prompts() -> list:
    return []


@router.post("/prompts")
async def create_prompt(body: dict) -> dict:
    return body


@router.patch("/prompts/{id}")
async def update_prompt(id: str, body: dict) -> dict:
    return {**body, "id": id}


@router.delete("/prompts/{id}")
async def delete_prompt(id: str) -> dict:
    return {"deleted": id}
