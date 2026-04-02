"""
worldlabs-mcp - MCP server wrapping the World Labs Marble API.
Generates explorable 3D worlds from text, images, and video.
API docs: https://docs.worldlabs.ai/api
"""

import asyncio
import os
import time
from pathlib import Path

import httpx
from fastmcp import FastMCP

# ---------------------------------------------------------------------------
# Server setup
# ---------------------------------------------------------------------------
mcp = FastMCP(
    name="worldlabs-mcp",
    version="0.1.0",
)

BASE_URL = "https://api.worldlabs.ai/marble/v1"
DEFAULT_POLL_INTERVAL = 15  # seconds between polls
# NOTE: 90s is a safe default that fits inside MCP client timeouts (~120s).
# World generation (especially Marble 0.1-plus, ~5 min) will not complete in
# this window.  Use get_operation to poll manually for long jobs, or increase
# timeout_seconds explicitly if your client supports long-running tool calls.
DEFAULT_TIMEOUT = 90

VALID_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
VALID_VIDEO_EXTENSIONS = {"mp4", "mov", "mkv"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


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


def _upload_headers() -> dict:
    """Headers for binary file uploads (no Content-Type - GCS sets it via signed URL)."""
    return {"WLT-Api-Key": _get_api_key()}


def _check_error(data: dict, operation_id: str) -> None:
    """Raise a descriptive RuntimeError if an operation completed with an error."""
    if data.get("error"):
        err = data["error"]
        code = err.get("code", "UNKNOWN")
        message = err.get("message", "No details provided")
        raise RuntimeError(f"Operation {operation_id} failed [{code}]: {message}")


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------


@mcp.tool()
async def generate_world_from_text(
    text_prompt: str,
    display_name: str = "",
    model: str = "Marble 0.1-mini",
) -> dict:
    """
    Generate a 3D world from a text description.

    Returns immediately with an operation_id.  Use get_operation to check
    status, or wait_for_world for blocking poll (≤90s by default).

    Args:
        text_prompt: Description of the world to generate.
        display_name: Optional human-readable name for the world.
        model: 'Marble 0.1-mini' (fast, ~30-45s) or 'Marble 0.1-plus' (quality, ~5min).

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
    model: str = "Marble 0.1-mini",
) -> dict:
    """
    Generate a 3D world from a public image URL.

    Returns immediately with an operation_id.

    Args:
        image_url: Public URL of the source image (jpg, jpeg, png, webp).
        text_prompt: Optional text to guide generation.
        display_name: Optional name for the world.
        is_panorama: Set True if image is a 360-degree panorama.
        model: 'Marble 0.1-mini' or 'Marble 0.1-plus'.

    Returns:
        Operation object with operation_id for polling.
    """
    image_prompt: dict = {"source": "uri", "uri": image_url}
    if is_panorama:
        image_prompt["is_pano"] = True

    world_prompt: dict = {
        "type": "image",
        "image_prompt": image_prompt,
    }
    if text_prompt:
        world_prompt["text_prompt"] = text_prompt

    payload = {
        "display_name": display_name,
        "model": model,
        "world_prompt": world_prompt,
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
async def generate_world_from_multi_image(
    image_urls: list[str],
    azimuths_deg: list[float],
    text_prompt: str = "",
    display_name: str = "",
    model: str = "Marble 0.1-mini",
) -> dict:
    """
    Generate a 3D world from multiple images at specified azimuth angles.

    Args:
        image_urls: List of public image URLs (must match azimuths_deg length).
        azimuths_deg: Azimuth angles in degrees for each image (0-360).
                      Example: [0, 90, 180, 270] for 4 images at cardinal directions.
        text_prompt: Optional guiding text.
        display_name: Optional name for the world.
        model: 'Marble 0.1-mini' or 'Marble 0.1-plus'.

    Returns:
        Operation object with operation_id for polling.
    """
    if len(image_urls) != len(azimuths_deg):
        raise ValueError(
            f"image_urls ({len(image_urls)}) and azimuths_deg ({len(azimuths_deg)}) "
            "must have the same length"
        )
    if len(image_urls) < 2:
        raise ValueError("At least 2 images required for multi-image generation")

    images = [
        {"source": "uri", "uri": url, "azimuth_deg": az}
        for url, az in zip(image_urls, azimuths_deg)
    ]

    world_prompt: dict = {
        "type": "multi_image",
        "multi_image_prompt": {"images": images},
    }
    if text_prompt:
        world_prompt["text_prompt"] = text_prompt

    payload = {
        "display_name": display_name,
        "model": model,
        "world_prompt": world_prompt,
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
async def generate_world_from_video(
    video_url: str,
    text_prompt: str = "",
    display_name: str = "",
    model: str = "Marble 0.1-mini",
) -> dict:
    """
    Generate a 3D world from a public video URL.

    Returns immediately with an operation_id.

    Args:
        video_url: Public URL of the source video (mp4, mov, mkv).
        text_prompt: Optional text to guide generation.
        display_name: Optional name for the world.
        model: 'Marble 0.1-mini' or 'Marble 0.1-plus'.

    Returns:
        Operation object with operation_id for polling.
    """
    world_prompt: dict = {
        "type": "video",
        "video_prompt": {"source": "uri", "uri": video_url},
    }
    if text_prompt:
        world_prompt["text_prompt"] = text_prompt

    payload = {
        "display_name": display_name,
        "model": model,
        "world_prompt": world_prompt,
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
async def upload_and_generate(
    local_file_path: str,
    kind: str,
    text_prompt: str = "",
    display_name: str = "",
    is_panorama: bool = False,
    model: str = "Marble 0.1-mini",
) -> dict:
    """
    Upload a local file and generate a 3D world from it (end-to-end).

    Handles the full flow: prepare upload -> PUT file to GCS -> generate world.
    Returns immediately with an operation_id once upload completes.

    Args:
        local_file_path: Absolute path to the local image or video file.
        kind: 'image' or 'video'.
        text_prompt: Optional guiding text.
        display_name: Optional name for the world.
        is_panorama: True if image is a 360-degree panorama (image only).
        model: 'Marble 0.1-mini' or 'Marble 0.1-plus'.

    Returns:
        Operation object with operation_id for polling.
    """
    if kind not in ("image", "video"):
        raise ValueError("kind must be 'image' or 'video'")

    file_path = Path(local_file_path)
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {local_file_path}")

    extension = file_path.suffix.lstrip(".").lower()
    if kind == "image" and extension not in VALID_IMAGE_EXTENSIONS:
        raise ValueError(
            f"Unsupported image extension '{extension}'. Use: {VALID_IMAGE_EXTENSIONS}"
        )
    if kind == "video" and extension not in VALID_VIDEO_EXTENSIONS:
        raise ValueError(
            f"Unsupported video extension '{extension}'. Use: {VALID_VIDEO_EXTENSIONS}"
        )

    file_bytes = file_path.read_bytes()

    async with httpx.AsyncClient(timeout=60) as client:
        # 1. Prepare upload
        prepare_resp = await client.post(
            f"{BASE_URL}/media-assets:prepare_upload",
            headers=_headers(),
            json={
                "file_name": file_path.name,
                "kind": kind,
                "extension": extension,
            },
        )
        prepare_resp.raise_for_status()
        prepare_data = prepare_resp.json()

        media_asset_id: str = prepare_data["media_asset"]["id"]
        upload_info: dict = prepare_data["upload_info"]
        upload_url: str = upload_info["upload_url"]
        upload_headers: dict = upload_info.get("headers", {})

        # 2. Upload file bytes via PUT to signed GCS URL
        put_resp = await client.put(
            upload_url,
            content=file_bytes,
            headers=upload_headers,
        )
        put_resp.raise_for_status()

    # 3. Generate world from uploaded asset
    return await generate_world_from_media_asset(
        media_asset_id=media_asset_id,
        kind=kind,
        text_prompt=text_prompt,
        display_name=display_name,
        is_panorama=is_panorama,
        model=model,
    )


@mcp.tool()
async def prepare_media_upload(
    file_name: str,
    kind: str,
    extension: str,
) -> dict:
    """
    Prepare a signed GCS upload URL for a local file.

    After calling this, PUT the raw file bytes to upload_info.upload_url
    with the returned upload_info.headers, then pass media_asset.id to
    generate_world_from_media_asset. For a simpler flow, use upload_and_generate.

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
    model: str = "Marble 0.1-mini",
) -> dict:
    """
    Generate a world from a previously uploaded media asset.

    Args:
        media_asset_id: ID returned by prepare_media_upload or upload_and_generate.
        kind: 'image' or 'video'.
        text_prompt: Optional guiding text.
        display_name: Optional name for the world.
        is_panorama: True if image is a panorama (image kind only).
        model: 'Marble 0.1-mini' or 'Marble 0.1-plus'.

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


@mcp.tool()
async def get_operation(operation_id: str) -> dict:
    """
    Poll a generation operation for its current status.

    Recommended for long-running jobs (Marble 0.1-plus ~5 min).
    Call repeatedly until done=True rather than using wait_for_world.

    Args:
        operation_id: The operation_id returned by a generate call.

    Returns:
        Operation object. Check 'done' field. If done and no 'error',
        'response' contains the world. metadata.progress.status is
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
    Block-poll an operation until it completes, fails, or times out.

    WARNING: Default timeout is 90 seconds to stay within MCP client limits.
    For Marble 0.1-plus jobs (~5 min), use get_operation manually instead,
    or increase timeout_seconds (e.g. 360) if your client supports it.

    Args:
        operation_id: The operation_id to wait on.
        poll_interval_seconds: Seconds between polls (default 15).
        timeout_seconds: Max seconds to wait before giving up (default 90).

    Returns:
        Final Operation object when done=True and no error.

    Raises:
        RuntimeError: If the operation completed with an error.
        TimeoutError: If timeout_seconds elapses before completion.
    """
    deadline = time.monotonic() + timeout_seconds
    async with httpx.AsyncClient(timeout=30) as client:
        while True:
            await asyncio.sleep(poll_interval_seconds)

            if time.monotonic() > deadline:
                raise TimeoutError(
                    f"Operation {operation_id} did not complete within {timeout_seconds}s. "
                    "Use get_operation to continue polling manually."
                )

            resp = await client.get(
                f"{BASE_URL}/operations/{operation_id}",
                headers=_headers(),
            )
            resp.raise_for_status()
            data = resp.json()

            if data.get("done"):
                _check_error(data, operation_id)
                return data


@mcp.tool()
async def list_worlds(
    page_size: int = 20,
    page_token: str = "",
) -> dict:
    """
    List previously generated worlds.

    Args:
        page_size: Number of worlds to return (default 20, max 100).
        page_token: Pagination token from a previous response's next_page_token.

    Returns:
        Dict with 'worlds' list and optional 'next_page_token'.
    """
    params: dict = {"page_size": page_size}
    if page_token:
        params["page_token"] = page_token

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{BASE_URL}/worlds",
            headers=_headers(),
            params=params,
        )
        resp.raise_for_status()
        return resp.json()


@mcp.tool()
async def get_world(world_id: str) -> dict:
    """
    Fetch the latest details for a generated world by its ID.

    Args:
        world_id: The world UUID (from operation response or list_worlds).

    Returns:
        World object with assets: splat URLs (SPZ), collision mesh (GLB),
        panorama, thumbnail, AI-generated caption.
    """
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{BASE_URL}/worlds/{world_id}",
            headers=_headers(),
        )
        resp.raise_for_status()
        return resp.json()


# ---------------------------------------------------------------------------
# ASGI app for uvicorn (web_sota/start.ps1): worldlabs_mcp.server:app
# REST /api/* for web_sota; MCP at / for protocol clients if needed.
# ---------------------------------------------------------------------------
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api_bridge import router as api_router

_web_app = FastAPI(title="worldlabs-mcp")
_web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
_web_app.include_router(api_router, prefix="/api")
app = _web_app


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main() -> None:
    """CLI entry point for worldlabs-mcp."""
    mcp.run()


if __name__ == "__main__":
    main()
