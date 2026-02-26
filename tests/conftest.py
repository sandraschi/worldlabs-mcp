"""Pytest configuration and fixtures for worldlabs-mcp tests."""

import pytest


@pytest.fixture(autouse=True)
def set_fake_api_key(monkeypatch):
    """Inject a fake API key so tests don't need a real one."""
    monkeypatch.setenv("WORLDLABS_API_KEY", "test-key-abc123")


@pytest.fixture
def fake_operation_response():
    """A typical in-progress operation response."""
    return {
        "name": "operations/op-123",
        "done": False,
        "metadata": {"progress": {"status": "IN_PROGRESS", "percent_complete": 10}},
    }


@pytest.fixture
def fake_operation_done():
    """A completed operation response."""
    return {
        "name": "operations/op-123",
        "done": True,
        "metadata": {"progress": {"status": "SUCCEEDED", "percent_complete": 100}},
        "response": {
            "world": {
                "id": "world-uuid-456",
                "display_name": "Test World",
                "assets": {
                    "splat_url": "https://cdn.worldlabs.ai/worlds/world-uuid-456/splat.spz",
                    "thumbnail_url": "https://cdn.worldlabs.ai/worlds/world-uuid-456/thumb.jpg",
                },
            }
        },
    }


@pytest.fixture
def fake_operation_failed():
    """A failed operation response."""
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
def fake_world():
    """A world detail response."""
    return {
        "id": "world-uuid-456",
        "display_name": "Test World",
        "created_at": "2025-01-01T00:00:00Z",
        "assets": {
            "splat_url": "https://cdn.worldlabs.ai/worlds/world-uuid-456/splat.spz",
            "mesh_url": "https://cdn.worldlabs.ai/worlds/world-uuid-456/mesh.glb",
            "thumbnail_url": "https://cdn.worldlabs.ai/worlds/world-uuid-456/thumb.jpg",
            "panorama_url": "https://cdn.worldlabs.ai/worlds/world-uuid-456/pano.jpg",
            "caption": "A beautiful test world",
        },
    }
