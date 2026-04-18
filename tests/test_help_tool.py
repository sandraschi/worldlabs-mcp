"""Tests for worldlabs_mcp help tool — detail levels, content validation."""

import pytest

from worldlabs_mcp.server import mcp

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _get_tool(name: str):
    """Find a registered tool by name."""
    tools = await mcp.list_tools()
    for tool in tools:
        if tool.name == name:
            return tool
    return None


async def _tool_names() -> set[str]:
    tools = await mcp.list_tools()
    return {t.name for t in tools}


# ---------------------------------------------------------------------------
# Tool registry
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_help_tool_registered():
    assert "worldlabs_help" in await _tool_names(), "worldlabs_help tool must be registered"


@pytest.mark.asyncio
async def test_all_expected_tools_registered():
    expected = {
        # generate
        "generate_world_from_text",
        "generate_world_from_image",
        "generate_world_from_multi_image",
        "generate_world_from_video",
        "generate_world_from_media_asset",
        # upload
        "upload_and_generate",
        "prepare_media_upload",
        # poll
        "get_operation",
        "wait_for_world",
        # world
        "list_worlds",
        "get_world",
        # spatial (speculative, wired into narration bridge)
        "broadcast_spatial_notification",
        "broadcast_spatial_audio",
        "place_world_tv",
        "spawn_agent_avatar",
        # meta
        "worldlabs_help",
    }
    registered = await _tool_names()
    missing = expected - registered
    assert not missing, f"Missing tools: {missing}"


@pytest.mark.asyncio
async def test_tool_count_matches_catalog():
    """Catalog and registry must agree — the help tool shouldn't lie about the surface."""
    from worldlabs_mcp.server import _TOOL_CATALOG

    catalog_names = {t["name"] for t in _TOOL_CATALOG}
    registered = await _tool_names()
    # Every catalog entry must be a real registered tool
    fictional = catalog_names - registered
    assert not fictional, f"Catalog lists tools that aren't registered: {fictional}"
    # Every registered tool must be in the catalog
    undocumented = registered - catalog_names
    assert not undocumented, f"Registered tools missing from catalog: {undocumented}"


# ---------------------------------------------------------------------------
# Help tool — quick level
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_help_quick():
    from worldlabs_mcp.server import worldlabs_help

    result = await worldlabs_help(detail="quick")
    assert isinstance(result, dict)
    assert result.get("level") == "quick"
    assert "tools" in result
    assert isinstance(result["tools"], list)
    assert len(result["tools"]) >= 16
    # Quick mode: each entry has name and one-line description
    for entry in result["tools"]:
        assert "name" in entry
        assert "description" in entry
        assert "\n" not in entry["description"], "Quick mode descriptions must be one-liners"


# ---------------------------------------------------------------------------
# Help tool — standard level
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_help_standard():
    from worldlabs_mcp.server import worldlabs_help

    result = await worldlabs_help(detail="standard")
    assert result.get("level") == "standard"
    tools = result["tools"]
    assert len(tools) >= 16

    # Standard mode: includes args and return description
    gen_text = next((t for t in tools if t["name"] == "generate_world_from_text"), None)
    assert gen_text is not None
    assert "args" in gen_text
    assert "returns" in gen_text

    # Models block present
    assert "models" in result
    assert len(result["models"]) == 2


@pytest.mark.asyncio
async def test_help_standard_workflow():
    from worldlabs_mcp.server import worldlabs_help

    result = await worldlabs_help(detail="standard")
    assert "workflow" in result
    steps = result["workflow"]
    assert isinstance(steps, list)
    assert len(steps) >= 3


# ---------------------------------------------------------------------------
# Help tool — verbose level
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_help_verbose():
    from worldlabs_mcp.server import worldlabs_help

    result = await worldlabs_help(detail="verbose")
    assert result.get("level") == "verbose"
    tools = result["tools"]

    # Verbose: every tool has full docstring, example, and notes
    for tool in tools:
        assert "docstring" in tool, f"Tool {tool.get('name')} missing docstring"
        assert "example" in tool, f"Tool {tool.get('name')} missing example"

    # World Labs company context present in verbose
    assert "worldlabs_context" in result
    ctx = result["worldlabs_context"]
    assert "founded" in ctx
    assert "marble_api" in ctx
    assert "output_formats" in ctx


@pytest.mark.asyncio
async def test_help_verbose_output_formats():
    from worldlabs_mcp.server import worldlabs_help

    result = await worldlabs_help(detail="verbose")
    ctx = result["worldlabs_context"]
    formats = ctx["output_formats"]
    assert "spz" in formats
    assert "glb" in formats
    assert "panorama" in formats
    assert "thumbnail" in formats


@pytest.mark.asyncio
async def test_help_verbose_pricing():
    from worldlabs_mcp.server import worldlabs_help

    result = await worldlabs_help(detail="verbose")
    ctx = result["worldlabs_context"]
    assert "pricing_note" in ctx
    assert "platform_url" in ctx


# ---------------------------------------------------------------------------
# Help tool — topic filter
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_help_topic_generate():
    from worldlabs_mcp.server import worldlabs_help

    result = await worldlabs_help(detail="standard", topic="generate")
    tools = result["tools"]
    for tool in tools:
        assert "generate" in tool["name"], f"Unexpected tool in generate filter: {tool['name']}"


@pytest.mark.asyncio
async def test_help_topic_upload():
    from worldlabs_mcp.server import worldlabs_help

    result = await worldlabs_help(detail="standard", topic="upload")
    tool_names = [t["name"] for t in result["tools"]]
    assert any("upload" in n or "media" in n for n in tool_names)


@pytest.mark.asyncio
async def test_help_topic_poll():
    from worldlabs_mcp.server import worldlabs_help

    result = await worldlabs_help(detail="standard", topic="poll")
    tool_names = [t["name"] for t in result["tools"]]
    assert any("operation" in n or "wait" in n for n in tool_names)


@pytest.mark.asyncio
async def test_help_topic_invalid_returns_all():
    from worldlabs_mcp.server import worldlabs_help

    result = await worldlabs_help(detail="quick", topic="xyzzy_nonexistent")
    # Falls back to all tools rather than crashing
    assert len(result["tools"]) >= 16


# ---------------------------------------------------------------------------
# Help tool — default behaviour
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_help_defaults_to_standard():
    from worldlabs_mcp.server import worldlabs_help

    result = await worldlabs_help()
    assert result.get("level") == "standard"


# ---------------------------------------------------------------------------
# Help tool — error handling
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_help_invalid_detail_level():
    from worldlabs_mcp.server import worldlabs_help

    result = await worldlabs_help(detail="ultradetailed_bogus")
    # Should not raise — falls back gracefully
    assert "level" in result
    assert "tools" in result
