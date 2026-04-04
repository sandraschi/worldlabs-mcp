"""
REST API bridge for the web_sota frontend.
Proxies /api/* to World Labs Marble API so the webapp can generate worlds.
"""

import os
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException

# Load environment variables from .env if present
load_dotenv()

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


def _handle_http_error(e: httpx.HTTPStatusError) -> None:
    """Provides explicit, human-readable error messages for common Marble API failures."""
    response = e.response
    status_code = response.status_code
    
    # Try to extract the error message from the World Labs JSON response
    # Typical structure: {"error": {"message": "...", "code": "..."}} or {"detail": "..."}
    try:
        error_data = response.json()
        api_message = error_data.get("error", {}).get("message") or error_data.get("detail")
    except Exception:
        api_message = None

    if status_code == 401:
        detail = f"World Labs API: 401 Unauthorized. Your WORLDLABS_API_KEY may be invalid. ({api_message or 'No additional details'})"
        raise HTTPException(status_code=401, detail=detail)
    
    if status_code == 402:
        detail = (
            f"World Labs API: 402 Payment Required. {api_message or 'Insufficient credits.'} "
            "IMPORTANT: Credits on marble.worldlabs.ai (web app) are SEPARATE from API Platform credits. "
            "Please check your API balance at https://platform.worldlabs.ai/"
        )
        raise HTTPException(status_code=402, detail=detail)

    if status_code == 429:
        detail = f"World Labs API: 429 Too Many Requests. You have hit a rate limit. ({api_message or 'No details'})"
        raise HTTPException(status_code=429, detail=detail)

    # Generic handling for other errors
    detail = f"World Labs API Error {status_code}: {api_message or response.text}"
    raise HTTPException(status_code=status_code, detail=detail)


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
