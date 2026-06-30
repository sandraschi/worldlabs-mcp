"""
Pytest configuration and fixtures for worldlabs-mcp tests.

DUAL-USE DESIGN
---------------
Tests are dual-use: they run with mocked HTTP (default, always passes) and
with a live Marble API when the env var WORLDLABS_API_KEY is set to a real key
and WORLDLABS_LIVE_TESTS=1 is set.

  # mock-only (CI default):
  pytest

  # live API (requires valid key + credits):
  WORLDLABS_API_KEY=your-key WORLDLABS_LIVE_TESTS=1 pytest -m live

Markers:
  live    — requires WORLDLABS_LIVE_TESTS=1 and a real API key
  slow    — generation tests (live only, may take 1-5 min per world)
  bridge  — requires the bridge/backend to be running on WORLDLABS_BRIDGE_URL
  prefab  — prefab card rendering tests (mock only, no HTTP)

The conftest injects fake API keys for mock tests automatically.
Live tests skip if the env vars are absent.
"""

from __future__ import annotations

import os

import pytest

# ---------------------------------------------------------------------------
# Markers
# ---------------------------------------------------------------------------


def pytest_configure(config: pytest.Config) -> None:
    config.addinivalue_line("markers", "live: requires WORLDLABS_LIVE_TESTS=1 and real API key")
    config.addinivalue_line("markers", "slow: long-running generation test (live only)")
    config.addinivalue_line("markers", "bridge: requires bridge backend running")
    config.addinivalue_line("markers", "prefab: prefab card rendering test (no HTTP)")


def pytest_collection_modifyitems(config: pytest.Config, items: list[pytest.Item]) -> None:
    """Skip live/bridge tests unless the corresponding env vars are set."""
    live_enabled = os.environ.get("WORLDLABS_LIVE_TESTS", "").strip() == "1"
    bridge_url = os.environ.get("WORLDLABS_BRIDGE_URL", "http://localhost:10865")

    skip_live = pytest.mark.skip(reason="Set WORLDLABS_LIVE_TESTS=1 to run live API tests")
    skip_bridge = pytest.mark.skip(
        reason=f"Bridge not enabled (set WORLDLABS_BRIDGE_URL or start backend at {bridge_url})"
    )

    for item in items:
        if "live" in item.keywords and not live_enabled:
            item.add_marker(skip_live)
        if "bridge" in item.keywords and not live_enabled:
            item.add_marker(skip_bridge)


# ---------------------------------------------------------------------------
# API key fixture
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def set_fake_api_key(monkeypatch):
    """
    Inject a fake API key for all mock tests.
    Live tests override this via their own real key from the environment.
    """
    if not os.environ.get("WORLDLABS_LIVE_TESTS"):
        monkeypatch.setenv("WORLDLABS_API_KEY", "test-key-abc123")


# ---------------------------------------------------------------------------
# Operation fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def fake_operation_response():
    """In-progress operation."""
    return {
        "name": "operations/op-123",
        "done": False,
        "metadata": {
            "progress": {"status": "IN_PROGRESS", "percent_complete": 10},
            "create_time": "2025-01-01T00:00:00Z",
            "update_time": "2025-01-01T00:00:05Z",
        },
    }


@pytest.fixture
def fake_operation_done():
    """Completed operation with full world payload."""
    return {
        "name": "operations/op-123",
        "done": True,
        "metadata": {
            "progress": {"status": "SUCCEEDED", "percent_complete": 100},
            "create_time": "2025-01-01T00:00:00Z",
            "update_time": "2025-01-01T00:02:00Z",
        },
        "response": {
            "world": {
                "id": "world-uuid-456",
                "display_name": "Test World",
                "model": "marble-1.1",
                "created_at": "2025-01-01T00:00:00Z",
                "assets": {
                    "splat_url": "https://cdn.worldlabs.ai/worlds/world-uuid-456/splat.spz",
                    "thumbnail_url": "https://cdn.worldlabs.ai/worlds/world-uuid-456/thumb.jpg",
                    "splats": {
                        "spz_urls": {
                            "100k": "https://cdn.worldlabs.ai/worlds/world-uuid-456/splat_100k.spz",
                            "500k": "https://cdn.worldlabs.ai/worlds/world-uuid-456/splat_500k.spz",
                            "full_res": "https://cdn.worldlabs.ai/worlds/world-uuid-456/splat_full.spz",
                        }
                    },
                    "mesh": {"collider_mesh_url": "https://cdn.worldlabs.ai/worlds/world-uuid-456/mesh.glb"},
                    "imagery": {
                        "pano_url": "https://cdn.worldlabs.ai/worlds/world-uuid-456/pano.jpg",
                        "thumbnail_url": "https://cdn.worldlabs.ai/worlds/world-uuid-456/thumb.jpg",
                    },
                    "caption": "A beautiful test world",
                    "marble_url": "https://marble.worldlabs.ai/worlds/world-uuid-456",
                },
            }
        },
    }


@pytest.fixture
def fake_operation_failed():
    """Failed operation."""
    return {
        "name": "operations/op-999",
        "done": True,
        "error": {
            "code": "INTERNAL",
            "message": "Generation pipeline encountered an error",
        },
        "metadata": {"progress": {"status": "FAILED", "percent_complete": 0}},
    }


@pytest.fixture
def fake_operation_pending():
    """Pending (queued but not started) operation."""
    return {
        "name": "operations/op-queued",
        "done": False,
        "metadata": {"progress": {"status": "PENDING", "percent_complete": 0}},
    }


# ---------------------------------------------------------------------------
# World fixtures — multiple shapes to test tolerant parsing
# ---------------------------------------------------------------------------


@pytest.fixture
def fake_world():
    """Full world with nested asset structure (current Marble API shape)."""
    return {
        "id": "world-uuid-456",
        "display_name": "Test World",
        "model": "marble-1.1",
        "created_at": "2025-01-01T00:00:00Z",
        "status": "SUCCEEDED",
        "assets": {
            "splat_url": "https://cdn.worldlabs.ai/worlds/world-uuid-456/splat.spz",
            "splats": {
                "spz_urls": {
                    "100k": "https://cdn.worldlabs.ai/worlds/world-uuid-456/splat_100k.spz",
                    "500k": "https://cdn.worldlabs.ai/worlds/world-uuid-456/splat_500k.spz",
                    "full_res": "https://cdn.worldlabs.ai/worlds/world-uuid-456/splat_full.spz",
                }
            },
            "mesh": {"collider_mesh_url": "https://cdn.worldlabs.ai/worlds/world-uuid-456/mesh.glb"},
            "imagery": {
                "pano_url": "https://cdn.worldlabs.ai/worlds/world-uuid-456/pano.jpg",
                "thumbnail_url": "https://cdn.worldlabs.ai/worlds/world-uuid-456/thumb.jpg",
            },
            "caption": "A beautiful test world",
            "marble_url": "https://marble.worldlabs.ai/worlds/world-uuid-456",
        },
    }


@pytest.fixture
def fake_world_flat():
    """Flat asset shape (older Marble API responses / some webhook payloads)."""
    return {
        "id": "world-flat-789",
        "display_name": "Flat World",
        "model": "marble-1.1-plus",
        "created_at": "2025-06-01T00:00:00Z",
        "status": "SUCCEEDED",
        "thumbnail_url": "https://cdn.worldlabs.ai/worlds/world-flat-789/thumb.jpg",
        "panorama_url": "https://cdn.worldlabs.ai/worlds/world-flat-789/pano.jpg",
        "mesh_url": "https://cdn.worldlabs.ai/worlds/world-flat-789/mesh.glb",
        "world_marble_url": "https://marble.worldlabs.ai/worlds/world-flat-789",
        "caption": "A flat-structure test world",
        "assets": {
            "splat_url": "https://cdn.worldlabs.ai/worlds/world-flat-789/splat.spz",
        },
    }


@pytest.fixture
def fake_world_minimal():
    """Minimal world — no display_name, no assets, just an id."""
    return {
        "id": "world-min-000",
    }


@pytest.fixture
def fake_world_in_progress():
    """World that is still generating (no assets yet)."""
    return {
        "id": "world-wip-001",
        "display_name": "WIP World",
        "model": "marble-1.1",
        "status": "IN_PROGRESS",
        "created_at": "2025-01-02T00:00:00Z",
    }


@pytest.fixture
def fake_world_list(fake_world, fake_world_flat, fake_world_in_progress):
    """A worlds list response with multiple entries."""
    return {
        "worlds": [fake_world, fake_world_flat, fake_world_in_progress],
        "next_page_token": "",
    }


@pytest.fixture
def fake_world_list_with_pagination(fake_world):
    """A worlds list response with a next_page_token."""
    return {
        "worlds": [fake_world],
        "next_page_token": "token-page-2",
    }


@pytest.fixture
def fake_world_list_empty():
    """Empty world list."""
    return {"worlds": [], "next_page_token": ""}


# ---------------------------------------------------------------------------
# Upload / media asset fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def fake_prepare_upload_response():
    return {
        "media_asset": {"id": "asset-xyz"},
        "upload_info": {
            "upload_url": "https://storage.googleapis.com/upload/test",
            "upload_method": "PUT",
            "required_headers": {"Content-Type": "image/jpeg"},
        },
    }


@pytest.fixture
def fake_prepare_upload_video_response():
    return {
        "media_asset": {"id": "asset-vid-abc"},
        "upload_info": {
            "upload_url": "https://storage.googleapis.com/upload/video-test",
            "upload_method": "PUT",
            "required_headers": {"Content-Type": "video/mp4"},
        },
    }


# ---------------------------------------------------------------------------
# Spatial / bridge fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def fake_narration_response():
    return {"status": "broadcasted", "recipients": 1, "event_id": "evt-001"}


@pytest.fixture
def fake_narration_no_recipients():
    return {"status": "broadcasted", "recipients": 0, "event_id": "evt-002"}
