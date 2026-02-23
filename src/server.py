"""
worldlabs-mcp - MCP server wrapping the World Labs Marble API
Generates explorable 3D worlds from text, images, and video.
API docs: https://docs.worldlabs.ai/api
"""

import asyncio
import os
import time
from typing import Optional

import httpx
from fastmcp import FastMCP

# ---------------------------------------------------------------------------
# Server setup
# ---------------------------------------------------------------------------
mcp = FastMCP(
    name="worldlabs-mcp",
    version="0.1.0",
    description="Generate explorable 3D worlds using World Labs Marble API",
)

BASE_URL = "https://api.worldlabs.ai/marble/v1"
DEFAULT_POLL_INTERVAL = 15   # seconds between polls
DEFAULT_TIMEOUT = 600        # 10 minutes max wait


def _get_api_key() -> str:
    key = os.environ.get("WORLDLABS_API_KEY", "")
    if not key:
        raise ValueError(
            "WORLDLABS_API_KEY environment variable is not set. "
            "Get your key at https://platform.worldlabs.ai/api-keys"
        )
    return key


def _headers() -> dict:
    return {
        "WLT-Api-Key": _get_api_key(),
        "Content-Type": "application/json",
    }


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

@mcp.tool()
async def generate_world_from_text(
    text_prompt: str,
    display_name: str = "",
    model: str = "Marble 0.1-plus",
) -> dict:
    """
    Generate a 3D world from a text description.

    Args:
        text_prompt: Description of the world to generate.
        display_name: Optional human-readable name for the world.
        model: 'Marble 0.1-plus' (quality, ~5min) or 'Marble 0.1-mini' (fast, ~30-45s).

    Returns:
        Operation object with operation_id for polling.
    """
    payload = {
        "display_name": display_name,
        "model": model,
        "world_prompt": {
            "type": "text",
            "text_prompt": text_prompt,
        },
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{BASE_URL}/worlds:generate",
            headers=_headers(),
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()


@mcp.tool()
async def generate_world_from_image(
    image_url: str,
    text_prompt: str = "",
    display_name: str = "",
    is_panorama: bool = False,
    model: str = "Marble 0.1-plus",
) -> dict:
    """
    Generate a 3D world from an image URL.

    Args:
        image_url: Public URL of the source image (jpg, jpeg, png, webp).
        text_prompt: Optional text to guide generation.
        display_name: Optional name for the world.
        is_panorama: Set True if image is a 360-degree panorama.
        model: 'Marble 0.1-plus' or 'Marble 0.1-mini'.

    Returns:
        Operation object with operation_id for polling.
    """
    image_prompt: dict = {"source": "uri", "uri": image_url}
    if is_panorama:
        image_prompt["is_pano"] = True

    payload = {
        "display_name": display_name,
        "model": model,
        "world_prompt": {
            "type": "image",
            "image_prompt": image_prompt,
        },
    }
    if text_prompt:
        payload["world_prompt"]["text_prompt"] = text_prompt

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{BASE_URL}/worlds:generate",
            headers=_headers(),
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()


@mcp.tool()
async def generate_world_from_video(
    video_url: str,
    text_prompt: str = "",
    display_name: str = "",
    model: str = "Marble 0.1-plus",
) -> dict:
    """
    Generate a 3D world from a video URL.

    Args:
        video_url: Public URL of the source video (mp4, mov, mkv).
        text_prompt: Optional text to guide generation.
        display_name: Optional name for the world.
        model: 'Marble 0.1-plus' or 'Marble 0.1-mini'.

    Returns:
        Operation object with operation_id for polling.
    """
    payload = {
        "display_name": display_name,
        "model": model,
        "world_prompt": {
            "type": "video",
            "video_prompt": {"source": "uri", "uri": video_url},
        },
    }
    if text_prompt:
        payload["world_prompt"]["text_prompt"] = text_prompt

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{BASE_URL}/worlds:generate",
            headers=_headers(),
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()


@mcp.tool()
async def get_operation(operation_id: str) -> dict:
    """
    Poll a generation operation for status/result.

    Args:
        operation_id: The operation_id returned by a generate call.

    Returns:
        Operation object. Check 'done' field. If done and no 'error',
        'response' contains the world. 'metadata.progress.status' is
        IN_PROGRESS, SUCCEEDED, or FAILED.
    """
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{BASE_URL}/operations/{operation_id}",
            headers=_headers(),
        )
        resp.raise_for_status()
        return resp.json()


@mcp.tool()
async def wait_for_world(
    operation_id: str,
    poll_interval_seconds: int = DEFAULT_POLL_INTERVAL,
    timeout_seconds: int = DEFAULT_TIMEOUT,
) -> dict:
    """
    Block-poll an operation until it completes (or times out).

    Args:
        operation_id: The operation_id to wait on.
        poll_interval_seconds: Seconds between polls (default 15).
        timeout_seconds: Max seconds to wait before giving up (default 600).

    Returns:
        Final Operation object when done=True, or raises TimeoutError.
    """
    deadline = time.monotonic() + timeout_seconds
    async with httpx.AsyncClient(timeout=30) as client:
        while True:
            resp = await client.get(
                f"{BASE_URL}/operations/{operation_id}",
                headers=_headers(),
            )
            resp.raise_for_status()
            data = resp.json()

            if data.get("done"):
                return data

            if time.monotonic() > deadline:
                raise TimeoutError(
                    f"Operation {operation_id} did not complete within "
                    f"{timeout_seconds}s. Last status: "
                    f"{data.get('metadata', {}).get('progress', {}).get('status')}"
                )

            await asyncio.sleep(poll_interval_seconds)


@mcp.tool()
async def get_world(world_id: str) -> dict:
    """
    Fetch the latest details for a generated world.

    Args:
        world_id: The world UUID (from operation response or metadata).

    Returns:
        World object with assets (splat URLs, mesh, panorama, thumbnail, caption).
    """
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{BASE_URL}/worlds/{world_id}",
            headers=_headers(),
        )
        resp.raise_for_status()
        return resp.json()


@mcp.tool()
async def prepare_media_upload(
    file_name: str,
    kind: str,
    extension: str,
) -> dict:
    """
    Prepare a signed upload URL for a local file (image or video).
    After calling this, PUT the file bytes to upload_info.upload_url
    with the required headers, then use media_asset.id in a generate call.

    Args:
        file_name: Original filename (e.g. 'photo.jpg').
        kind: 'image' or 'video'.
        extension: File extension without dot (e.g. 'jpg', 'mp4').

    Returns:
        Dict with 'media_asset' (contains id) and 'upload_info' (upload_url, method, headers).
    """
    if kind not in ("image", "video"):
        raise ValueError("kind must be 'image' or 'video'")

    payload = {"file_name": file_name, "kind": kind, "extension": extension}
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{BASE_URL}/media-assets:prepare_upload",
            headers=_headers(),
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()


@mcp.tool()
async def generate_world_from_media_asset(
    media_asset_id: str,
    kind: str,
    text_prompt: str = "",
    display_name: str = "",
    is_panorama: bool = False,
    model: str = "Marble 0.1-plus",
) -> dict:
    """
    Generate a world from a previously uploaded media asset.

    Args:
        media_asset_id: ID returned by prepare_media_upload.
        kind: 'image' or 'video'.
        text_prompt: Optional guiding text.
        display_name: Optional name for the world.
        is_panorama: True if image is a panorama (only for image kind).
        model: 'Marble 0.1-plus' or 'Marble 0.1-mini'.

    Returns:
        Operation object with operation_id for polling.
    """
    if kind == "image":
        image_prompt: dict = {"source": "media_asset", "media_asset_id": media_asset_id}
        if is_panorama:
            image_prompt["is_pano"] = True
        world_prompt: dict = {"type": "image", "image_prompt": image_prompt}
    elif kind == "video":
        world_prompt = {
            "type": "video",
            "video_prompt": {"source": "media_asset", "media_asset_id": media_asset_id},
        }
    else:
        raise ValueError("kind must be 'image' or 'video'")

    if text_prompt:
        world_prompt["text_prompt"] = text_prompt

    payload = {"display_name": display_name, "model": model, "world_prompt": world_prompt}
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{BASE_URL}/worlds:generate",
            headers=_headers(),
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    mcp.run()
