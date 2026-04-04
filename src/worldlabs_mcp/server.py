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
    version="0.3.0",
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
# Help tool
# ---------------------------------------------------------------------------

_TOOL_CATALOG = [
    {
        "name": "generate_world_from_text",
        "description": "Generate a 3D world from a text description",
        "group": "generate",
        "args": {
            "text_prompt": "str — scene description",
            "display_name": "str (optional) — human-readable label",
            "model": "str — 'Marble 0.1-mini' (default) or 'Marble 0.1-plus'",
        },
        "returns": "Operation dict with operation_id for polling",
        "example": 'generate_world_from_text(text_prompt="A gothic cathedral interior at night")',
        "docstring": (
            "Submits a text-to-world request to the Marble API. Returns immediately with "
            "an in-progress operation. Poll with get_operation or block with wait_for_world. "
            "Marble 0.1-mini completes in ~30-45s. Marble 0.1-plus in ~5 min."
        ),
        "notes": "Credits are consumed per generation. Check billing at platform.worldlabs.ai.",
    },
    {
        "name": "generate_world_from_image",
        "description": "Generate a 3D world from a public image URL",
        "group": "generate",
        "args": {
            "image_url": "str — public URL (jpg, jpeg, png, webp)",
            "text_prompt": "str (optional) — guiding text",
            "display_name": "str (optional)",
            "is_panorama": "bool — set True for 360-degree equirectangular images",
            "model": "str",
        },
        "returns": "Operation dict",
        "example": 'generate_world_from_image(image_url="https://example.com/photo.jpg", text_prompt="Ruins")',
        "docstring": (
            "Lifts a single photograph into a navigable 3D space. Panoramas produce "
            "fuller 360-degree worlds. Non-panorama images are extrapolated."
        ),
        "notes": "Image must be publicly accessible. GCS signed URLs are not supported here.",
    },
    {
        "name": "generate_world_from_multi_image",
        "description": "Generate from multiple images at specified azimuth angles",
        "group": "generate",
        "args": {
            "image_urls": "list[str] — public image URLs",
            "azimuths_deg": "list[float] — azimuth angle for each image, 0-360",
            "text_prompt": "str (optional)",
            "display_name": "str (optional)",
            "model": "str",
        },
        "returns": "Operation dict",
        "example": (
            'generate_world_from_multi_image(\n'
            '  image_urls=["https://example.com/north.jpg", "https://example.com/south.jpg"],\n'
            '  azimuths_deg=[0, 180]\n'
            ')'
        ),
        "docstring": (
            "Reconstructs a 3D scene from multiple views. Use 2-8 images at known azimuth "
            "angles for best results. Cardinal directions (0/90/180/270) work well."
        ),
        "notes": "Minimum 2 images. image_urls and azimuths_deg must have equal length.",
    },
    {
        "name": "generate_world_from_video",
        "description": "Generate a 3D world from a public video URL",
        "group": "generate",
        "args": {
            "video_url": "str — public URL (mp4, mov, mkv)",
            "text_prompt": "str (optional)",
            "display_name": "str (optional)",
            "model": "str",
        },
        "returns": "Operation dict",
        "example": 'generate_world_from_video(video_url="https://example.com/walkthrough.mp4")',
        "docstring": (
            "Extracts 3D structure from video footage. Works well with slow pans and "
            "walkthrough recordings. Fast movement degrades quality."
        ),
        "notes": "Video must be publicly accessible.",
    },
    {
        "name": "upload_and_generate",
        "description": "Upload a local file and generate end-to-end",
        "group": "upload",
        "args": {
            "local_file_path": "str — absolute path on disk",
            "kind": "'image' or 'video'",
            "text_prompt": "str (optional)",
            "display_name": "str (optional)",
            "is_panorama": "bool (image only)",
            "model": "str",
        },
        "returns": "Operation dict",
        "example": 'upload_and_generate(local_file_path="D:/photos/garden.jpg", kind="image")',
        "docstring": (
            "Handles the full upload flow: gets a signed GCS URL, PUTs the file, "
            "then calls generate_world_from_media_asset. Use this instead of the two-step "
            "prepare_media_upload + generate_world_from_media_asset for local files."
        ),
        "notes": "Supported: jpg, jpeg, png, webp (image); mp4, mov, mkv (video).",
    },
    {
        "name": "prepare_media_upload",
        "description": "Get a signed GCS upload URL for manual file upload",
        "group": "upload",
        "args": {
            "file_name": "str — original filename",
            "kind": "'image' or 'video'",
            "extension": "str — file extension without dot",
        },
        "returns": "Dict with media_asset.id and upload_info.upload_url",
        "example": 'prepare_media_upload(file_name="photo.jpg", kind="image", extension="jpg")',
        "docstring": (
            "Step 1 of the manual upload flow. PUT the raw file bytes to upload_info.upload_url "
            "with the returned headers, then pass media_asset.id to generate_world_from_media_asset. "
            "Prefer upload_and_generate for simpler single-call usage."
        ),
        "notes": "Signed URLs expire after ~15 minutes.",
    },
    {
        "name": "generate_world_from_media_asset",
        "description": "Generate from a previously uploaded media asset ID",
        "group": "generate",
        "args": {
            "media_asset_id": "str — ID from prepare_media_upload",
            "kind": "'image' or 'video'",
            "text_prompt": "str (optional)",
            "display_name": "str (optional)",
            "is_panorama": "bool (image only)",
            "model": "str",
        },
        "returns": "Operation dict",
        "example": 'generate_world_from_media_asset(media_asset_id="asset-xyz", kind="image")',
        "docstring": "Step 2 of the manual upload flow. Initiates generation from a pre-uploaded asset.",
        "notes": "Use upload_and_generate instead unless you need the two-step flow.",
    },
    {
        "name": "get_operation",
        "description": "Single poll of an operation status",
        "group": "poll",
        "args": {"operation_id": "str — from any generate call"},
        "returns": (
            "Operation dict. Check done field. "
            "metadata.progress.status: IN_PROGRESS | SUCCEEDED | FAILED"
        ),
        "example": 'get_operation("op-abc123")',
        "docstring": (
            "One-shot poll. Returns immediately with current state. "
            "Call in a loop for long-running Marble 0.1-plus jobs (~5 min)."
        ),
        "notes": "Preferred over wait_for_world for Marble 0.1-plus to avoid MCP timeouts.",
    },
    {
        "name": "wait_for_world",
        "description": "Blocking poll until operation completes or times out",
        "group": "poll",
        "args": {
            "operation_id": "str",
            "poll_interval_seconds": "int (default 15)",
            "timeout_seconds": "int (default 90)",
        },
        "returns": "Final Operation dict when done=True",
        "example": 'wait_for_world("op-abc123", poll_interval_seconds=10, timeout_seconds=90)',
        "docstring": (
            "Blocks until done or timeout. Raises RuntimeError on API failure, "
            "TimeoutError if timeout_seconds elapses. Default 90s is safe for "
            "Marble 0.1-mini. For Marble 0.1-plus use get_operation in a loop."
        ),
        "notes": "MCP client timeouts (~120s) limit how long this can block.",
    },
    {
        "name": "list_worlds",
        "description": "Paginated list of all generated worlds",
        "group": "world",
        "args": {
            "page_size": "int (default 20, max 100)",
            "page_token": "str (optional) — from previous next_page_token",
        },
        "returns": "Dict with worlds list and optional next_page_token",
        "example": "list_worlds(page_size=50)",
        "docstring": "Returns all worlds in the account. Paginate using next_page_token.",
        "notes": "Worlds are returned newest-first.",
    },
    {
        "name": "get_world",
        "description": "Fetch full details and asset URLs for a world",
        "group": "world",
        "args": {"world_id": "str — UUID from list_worlds or operation response"},
        "returns": "World object with assets: splat URLs (SPZ), mesh (GLB), panorama, thumbnail, caption",
        "example": 'get_world("world-uuid-456")',
        "docstring": (
            "Returns the latest world state including all download URLs. "
            "Asset fields: splat_url, mesh_url, thumbnail_url, panorama_url, caption, "
            "world_marble_url (viewer link)."
        ),
        "notes": "Asset URLs are time-limited CDN links. Download promptly.",
    },
    {
        "name": "worldlabs_help",
        "description": "This help tool — API reference at quick / standard / verbose detail levels",
        "group": "meta",
        "args": {
            "detail": "'quick' | 'standard' (default) | 'verbose'",
            "topic": "str (optional) — filter by group: generate, upload, poll, world, meta",
        },
        "returns": "Structured help dict",
        "example": 'worldlabs_help(detail="verbose", topic="generate")',
        "docstring": "Returns structured documentation at three detail levels. Use topic to filter by tool group.",
        "notes": "",
    },
]

_MODELS = [
    {
        "name": "Marble 0.1-mini",
        "time": "~30-45 seconds",
        "quality": "Fast iteration, lower geometric fidelity. Good for prompt development.",
        "cost": "Lower credit cost",
        "use_when": "Exploring prompts, high-volume generation (30/month plan)",
    },
    {
        "name": "Marble 0.1-plus",
        "time": "~5 minutes",
        "quality": "High fidelity, detailed geometry, better material separation.",
        "cost": "Higher credit cost",
        "use_when": "Final assets, architectural visualization, export to Blender/Unity",
    },
]

_WORKFLOW = [
    "generate_world_from_text(text_prompt=...) → returns operation_id immediately",
    "Poll: get_operation(operation_id) until done=True (or use wait_for_world for mini)",
    "On success: get_world(world_id) → download splat/mesh/panorama URLs",
    "For local files: upload_and_generate(local_file_path=..., kind='image') — handles upload flow",
    "List everything: list_worlds(page_size=50)",
]

_WORLDLABS_CONTEXT = {
    "founded": "2023, San Francisco. Led by Fei-Fei Li (former Stanford AI Lab director).",
    "mission": (
        "Build spatial intelligence — AI that understands the 3D structure of the world, "
        "not just text and images."
    ),
    "marble_api": (
        "Marble is the World Labs world-generation API. It takes text, image, or video as input "
        "and outputs navigable 3D Gaussian splat scenes. The splat format (SPZ) is a compressed "
        "representation of millions of coloured 3D Gaussians, renderable in real time in WebGL "
        "viewers, Unity, Blender (with plugin), and VR headsets."
    ),
    "output_formats": {
        "spz": (
            "Compressed Gaussian splat. Multiple resolutions (100k, 500k, full). "
            "View in the Marble web viewer or import into Blender/Unity."
        ),
        "glb": "Collision mesh in GLTF Binary format. Simplified polygon mesh for physics.",
        "panorama": "360-degree equirectangular JPEG of the generated scene.",
        "thumbnail": "Preview JPEG for listing pages.",
        "caption": "AI-generated text description of what the model produced.",
        "marble_url": "Direct link to the interactive Marble web viewer for this world.",
    },
    "platform_url": "https://platform.worldlabs.ai",
    "api_docs_url": "https://docs.worldlabs.ai/api",
    "pricing_note": (
        "Credits are consumed per generation. Marble 0.1-mini costs fewer credits than plus. "
        "Check current rates and billing at https://platform.worldlabs.ai/billing. "
        "The $30/month plan allows approximately 30 plus-model or ~100+ mini-model generations."
    ),
    "gallery": (
        "The Marble gallery at https://worldlabs.ai/gallery shows publicly shared worlds. "
        "Individual worlds can be downloaded from their detail page as SPZ files. "
        "This is an interactive browser task — no API endpoint exists for gallery browse/download."
    ),
    "spatial_intelligence_scene_2026": (
        "World Labs operates in the emerging Large World Model (LWM) space. "
        "Competing approaches in 2026: "
        "Generative/persistent (World Labs Marble) — full 3D scene files, good for DCC pipelines. "
        "Latent/predictive (Meta JEPA/AMI Labs) — physics reasoning in embedding space. "
        "Interactive real-time (Google DeepMind Genie 3) — playable simulation at speed. "
        "Industrial (Alibaba/Baidu) — autonomous vehicle and smart-city simulation. "
        "World Labs positions itself at the quality/persistence end: scenes you can download, "
        "import, and use in production rather than scenes that only exist inside a model's latent space."
    ),
}


@mcp.tool()
async def worldlabs_help(
    detail: str = "standard",
    topic: str = "",
) -> dict:
    """
    World Labs MCP API reference — three detail levels.

    Returns structured documentation about every tool in this server,
    the Marble API models, typical workflow, and World Labs context.

    Args:
        detail: Level of detail to return.
                'quick'    — tool names + one-line descriptions only.
                'standard' — names, descriptions, args, returns, workflow, models.
                'verbose'  — everything above + full docstrings, examples, notes,
                             World Labs company/API context, and output format docs.
        topic:  Optional filter. One of: generate, upload, poll, world, meta.
                Returns all tools if topic doesn't match any group.

    Returns:
        Dict with keys: level, tools, (models, workflow for standard+),
        (worldlabs_context for verbose).
    """
    # Normalise detail level
    valid_levels = {"quick", "standard", "verbose"}
    level = detail.lower() if detail.lower() in valid_levels else "standard"

    # Filter by topic/group
    catalog = _TOOL_CATALOG
    if topic:
        filtered = [t for t in catalog if t["group"] == topic.lower()]
        if filtered:
            catalog = filtered
        # else: silently return all (don't crash on bad filter)

    # Build tool entries based on detail level
    def _build_entry(t: dict) -> dict:
        if level == "quick":
            return {"name": t["name"], "description": t["description"]}
        if level == "standard":
            return {
                "name": t["name"],
                "description": t["description"],
                "group": t["group"],
                "args": t["args"],
                "returns": t["returns"],
            }
        # verbose
        return {
            "name": t["name"],
            "description": t["description"],
            "group": t["group"],
            "args": t["args"],
            "returns": t["returns"],
            "docstring": t["docstring"],
            "example": t["example"],
            "notes": t["notes"],
        }

    result: dict = {
        "level": level,
        "tools": [_build_entry(t) for t in catalog],
    }

    if level in ("standard", "verbose"):
        result["models"] = _MODELS
        result["workflow"] = _WORKFLOW

    if level == "verbose":
        result["worldlabs_context"] = _WORLDLABS_CONTEXT

    return result


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
