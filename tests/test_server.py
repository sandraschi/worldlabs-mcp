"""Tests for worldlabs_mcp.server — all HTTP calls mocked via pytest-httpx."""

import httpx
import pytest
from pytest_httpx import HTTPXMock

from worldlabs_mcp.server import (
    BASE_URL,
    _check_error,
    _get_api_key,
    broadcast_spatial_audio,
    broadcast_spatial_notification,
    generate_world_from_image,
    generate_world_from_media_asset,
    generate_world_from_multi_image,
    generate_world_from_text,
    generate_world_from_video,
    get_operation,
    get_world,
    list_worlds,
    place_world_tv,
    prepare_media_upload,
    spawn_agent_avatar,
    upload_and_generate,
    wait_for_world,
)

# ---------------------------------------------------------------------------
# Unit tests (no HTTP)
# ---------------------------------------------------------------------------


def test_get_api_key_present(monkeypatch):
    monkeypatch.setenv("WORLDLABS_API_KEY", "my-real-key")
    assert _get_api_key() == "my-real-key"


def test_get_api_key_missing(monkeypatch):
    monkeypatch.delenv("WORLDLABS_API_KEY", raising=False)
    with pytest.raises(ValueError, match="WORLDLABS_API_KEY"):
        _get_api_key()


def test_check_error_no_error(fake_operation_done):
    # Should not raise
    _check_error(fake_operation_done, "op-123")


def test_check_error_with_error(fake_operation_failed):
    with pytest.raises(RuntimeError, match="INTERNAL"):
        _check_error(fake_operation_failed, "op-999")


# ---------------------------------------------------------------------------
# generate_world_from_text
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_generate_world_from_text(httpx_mock: HTTPXMock, fake_operation_response):
    httpx_mock.add_response(
        method="POST",
        url=f"{BASE_URL}/worlds:generate",
        json=fake_operation_response,
    )
    result = await generate_world_from_text(text_prompt="A forest at dawn")
    assert result["name"] == "operations/op-123"
    assert result["done"] is False


@pytest.mark.asyncio
async def test_generate_world_from_text_plus_model(httpx_mock: HTTPXMock, fake_operation_response):
    httpx_mock.add_response(
        method="POST",
        url=f"{BASE_URL}/worlds:generate",
        json=fake_operation_response,
    )
    result = await generate_world_from_text(
        text_prompt="A mountain scene",
        model="marble-1.1-plus",
    )
    assert result["name"] == "operations/op-123"


# ---------------------------------------------------------------------------
# generate_world_from_image
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_generate_world_from_image(httpx_mock: HTTPXMock, fake_operation_response):
    httpx_mock.add_response(
        method="POST",
        url=f"{BASE_URL}/worlds:generate",
        json=fake_operation_response,
    )
    result = await generate_world_from_image(
        image_url="https://example.com/photo.jpg",
        text_prompt="Ancient ruins",
    )
    assert result["name"] == "operations/op-123"


@pytest.mark.asyncio
async def test_generate_world_from_image_panorama(httpx_mock: HTTPXMock, fake_operation_response):
    httpx_mock.add_response(
        method="POST",
        url=f"{BASE_URL}/worlds:generate",
        json=fake_operation_response,
    )
    result = await generate_world_from_image(
        image_url="https://example.com/pano.jpg",
        is_panorama=True,
    )
    assert result is not None


# ---------------------------------------------------------------------------
# generate_world_from_multi_image
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_generate_world_from_multi_image(httpx_mock: HTTPXMock, fake_operation_response):
    httpx_mock.add_response(
        method="POST",
        url=f"{BASE_URL}/worlds:generate",
        json=fake_operation_response,
        match_json={
            "display_name": "",
            "model": "marble-1.1",
            "world_prompt": {
                "type": "multi-image",
                "multi_image_prompt": [
                    {"azimuth": 0.0, "content": {"source": "uri", "uri": "https://example.com/a.jpg"}},
                    {"azimuth": 180.0, "content": {"source": "uri", "uri": "https://example.com/b.jpg"}},
                ],
            },
        },
    )
    result = await generate_world_from_multi_image(
        image_urls=["https://example.com/a.jpg", "https://example.com/b.jpg"],
        azimuths_deg=[0.0, 180.0],
    )
    assert result["name"] == "operations/op-123"


def test_generate_world_from_multi_image_length_mismatch():
    with pytest.raises(ValueError, match="same length"):
        import asyncio

        asyncio.run(
            generate_world_from_multi_image(
                image_urls=["https://example.com/a.jpg"],
                azimuths_deg=[0.0, 90.0],
            )
        )


def test_generate_world_from_multi_image_too_few():
    with pytest.raises(ValueError, match="At least 2"):
        import asyncio

        asyncio.run(
            generate_world_from_multi_image(
                image_urls=["https://example.com/a.jpg"],
                azimuths_deg=[0.0],
            )
        )


# ---------------------------------------------------------------------------
# generate_world_from_video
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_generate_world_from_video(httpx_mock: HTTPXMock, fake_operation_response):
    httpx_mock.add_response(
        method="POST",
        url=f"{BASE_URL}/worlds:generate",
        json=fake_operation_response,
    )
    result = await generate_world_from_video(video_url="https://example.com/clip.mp4")
    assert result["name"] == "operations/op-123"


# ---------------------------------------------------------------------------
# get_operation
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_operation(httpx_mock: HTTPXMock, fake_operation_response):
    httpx_mock.add_response(
        method="GET",
        url=f"{BASE_URL}/operations/op-123",
        json=fake_operation_response,
    )
    result = await get_operation("op-123")
    assert result["done"] is False


# ---------------------------------------------------------------------------
# wait_for_world
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_wait_for_world_success(httpx_mock: HTTPXMock, fake_operation_done):
    httpx_mock.add_response(
        method="GET",
        url=f"{BASE_URL}/operations/op-123",
        json=fake_operation_done,
    )
    result = await wait_for_world("op-123", poll_interval_seconds=0, timeout_seconds=5)
    assert result["done"] is True


@pytest.mark.asyncio
async def test_wait_for_world_failure(httpx_mock: HTTPXMock, fake_operation_failed):
    httpx_mock.add_response(
        method="GET",
        url=f"{BASE_URL}/operations/op-999",
        json=fake_operation_failed,
    )
    with pytest.raises(RuntimeError, match="INTERNAL"):
        await wait_for_world("op-999", poll_interval_seconds=0, timeout_seconds=5)


@pytest.mark.asyncio
async def test_wait_for_world_timeout(httpx_mock: HTTPXMock, fake_operation_response):
    # Always returns in-progress so we time out
    httpx_mock.add_response(
        method="GET",
        url=f"{BASE_URL}/operations/op-123",
        json=fake_operation_response,
    )
    with pytest.raises(TimeoutError):
        await wait_for_world("op-123", poll_interval_seconds=0, timeout_seconds=0)


# ---------------------------------------------------------------------------
# get_world
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_world(httpx_mock: HTTPXMock, fake_world):
    httpx_mock.add_response(
        method="GET",
        url=f"{BASE_URL}/worlds/world-uuid-456",
        json=fake_world,
    )
    result = await get_world("world-uuid-456")
    assert result["id"] == "world-uuid-456"
    assert "splat_url" in result["assets"]


# ---------------------------------------------------------------------------
# list_worlds
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_worlds(httpx_mock: HTTPXMock):
    httpx_mock.add_response(
        method="POST",
        url=f"{BASE_URL}/worlds:list",
        json={"worlds": [], "next_page_token": ""},
        match_json={"page_size": 20, "sort_by": "created_at"},
    )
    result = await list_worlds()
    assert "worlds" in result


# ---------------------------------------------------------------------------
# prepare_media_upload
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_prepare_media_upload(httpx_mock: HTTPXMock):
    httpx_mock.add_response(
        method="POST",
        url=f"{BASE_URL}/media-assets:prepare_upload",
        json={
            "media_asset": {"id": "asset-xyz"},
            "upload_info": {
                "upload_url": "https://storage.googleapis.com/upload/...",
                "upload_method": "PUT",
                "required_headers": {},
            },
        },
    )
    result = await prepare_media_upload(file_name="photo.jpg", kind="image", extension="jpg")
    assert result["media_asset"]["id"] == "asset-xyz"


def test_prepare_media_upload_invalid_kind():
    with pytest.raises(ValueError, match="kind must be"):
        import asyncio

        asyncio.run(prepare_media_upload("photo.jpg", "gif", "gif"))


# ---------------------------------------------------------------------------
# generate_world_from_media_asset
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_generate_world_from_media_asset_image(
    httpx_mock: HTTPXMock, fake_operation_response
):
    httpx_mock.add_response(
        method="POST",
        url=f"{BASE_URL}/worlds:generate",
        json=fake_operation_response,
    )
    result = await generate_world_from_media_asset(
        media_asset_id="asset-xyz",
        kind="image",
    )
    assert result["name"] == "operations/op-123"


@pytest.mark.asyncio
async def test_generate_world_from_media_asset_video(
    httpx_mock: HTTPXMock, fake_operation_response
):
    httpx_mock.add_response(
        method="POST",
        url=f"{BASE_URL}/worlds:generate",
        json=fake_operation_response,
    )
    result = await generate_world_from_media_asset(
        media_asset_id="asset-xyz",
        kind="video",
    )
    assert result["name"] == "operations/op-123"


def test_generate_world_from_media_asset_invalid_kind():
    with pytest.raises(ValueError, match="kind must be"):
        import asyncio

        asyncio.run(generate_world_from_media_asset("asset-xyz", "gif"))


# ---------------------------------------------------------------------------
# upload_and_generate (full end-to-end flow)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_upload_and_generate_image(httpx_mock: HTTPXMock, fake_operation_response, tmp_path, monkeypatch):
    monkeypatch.setenv("WORLDLABS_API_KEY", "test-key")
    img = tmp_path / "test.jpg"
    img.write_bytes(b"fake-image-data")

    httpx_mock.add_response(
        method="POST",
        url=f"{BASE_URL}/media-assets:prepare_upload",
        json={
            "media_asset": {"id": "asset-xyz"},
            "upload_info": {
                "upload_url": "https://storage.googleapis.com/upload/test",
                "upload_method": "PUT",
                "required_headers": {},
            },
        },
    )
    httpx_mock.add_response(
        method="PUT",
        url="https://storage.googleapis.com/upload/test",
        status_code=200,
    )
    httpx_mock.add_response(
        method="POST",
        url=f"{BASE_URL}/worlds:generate",
        json=fake_operation_response,
    )
    result = await upload_and_generate(
        local_file_path=str(img),
        kind="image",
        text_prompt="A test scene",
    )
    assert result["name"] == "operations/op-123"


@pytest.mark.asyncio
async def test_upload_and_generate_file_not_found():
    with pytest.raises(FileNotFoundError):
        await upload_and_generate(
            local_file_path="/nonexistent/file.mp4",
            kind="video",
        )


@pytest.mark.asyncio
async def test_upload_and_generate_invalid_kind():
    with pytest.raises(ValueError, match="kind must be"):
        await upload_and_generate(
            local_file_path="test.jpg",
            kind="audio",
        )


@pytest.mark.asyncio
async def test_generate_world_from_text_payload_format(httpx_mock: HTTPXMock, fake_operation_response):
    httpx_mock.add_response(
        method="POST",
        url=f"{BASE_URL}/worlds:generate",
        json=fake_operation_response,
        match_json={
            "display_name": "Test World",
            "model": "marble-1.1",
            "world_prompt": {
                "type": "text",
                "text_prompt": "A gothic cathedral at night",
            },
        },
    )
    result = await generate_world_from_text(
        text_prompt="A gothic cathedral at night",
        display_name="Test World",
    )
    assert result["name"] == "operations/op-123"


# ---------------------------------------------------------------------------
# broadcast_spatial_notification
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_broadcast_spatial_notification(httpx_mock: HTTPXMock):
    httpx_mock.add_response(
        method="POST",
        url="http://localhost:10865/api/narration",
        json={"status": "broadcasted", "recipients": 1, "event_id": "evt-001"},
    )
    result = await broadcast_spatial_notification(
        text="Welcome to the garden",
        x=1.0, y=2.0, z=3.0,
    )
    assert "Success" in result
    assert "Recipients: 1" in result


@pytest.mark.asyncio
async def test_broadcast_spatial_notification_no_bridge(httpx_mock: HTTPXMock):
    httpx_mock.add_response(
        method="POST",
        url="http://localhost:10865/api/narration",
        status_code=404,
    )
    with pytest.raises(httpx.HTTPStatusError):
        await broadcast_spatial_notification(text="Hello")


# ---------------------------------------------------------------------------
# broadcast_spatial_audio
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_broadcast_spatial_audio(httpx_mock: HTTPXMock):
    httpx_mock.add_response(
        method="POST",
        url="http://localhost:10865/api/narration",
        json={"status": "broadcasted", "recipients": 1, "event_id": "evt-002"},
    )
    result = await broadcast_spatial_audio(
        prompt_or_url="https://example.com/ambience.mp3",
        x=0.0, y=1.5, z=0.0, is_loop=True,
    )
    assert "Audio broadcasted" in result


# ---------------------------------------------------------------------------
# place_world_tv
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_place_world_tv(httpx_mock: HTTPXMock):
    httpx_mock.add_response(
        method="POST",
        url="http://localhost:10865/api/narration",
        json={"status": "broadcasted", "recipients": 1, "event_id": "evt-003"},
    )
    result = await place_world_tv(
        video_url="https://example.com/clip.mp4",
        x=0.0, y=1.6, z=-5.0, rotation_y=0.0, scale=1.0,
    )
    assert "TV Materialized" in result


# ---------------------------------------------------------------------------
# spawn_agent_avatar
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_spawn_agent_avatar(httpx_mock: HTTPXMock):
    httpx_mock.add_response(
        method="POST",
        url="http://localhost:10865/api/narration",
        json={"status": "broadcasted", "recipients": 1, "event_id": "evt-004"},
    )
    result = await spawn_agent_avatar(
        avatar_url="default_agent",
        x=0.0, y=0.0, z=0.0, rotation=0.0,
    )
    assert "Avatar materialized" in result
