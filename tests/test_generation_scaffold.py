"""
worldlabs-mcp test scaffold — full generation + poll flow.

These tests hit the real World Labs API and consume credits.
Run only when you want to verify end-to-end behaviour.

Usage:
    pytest tests/test_generation_scaffold.py -v -m live --timeout=120

Requires WORLDLABS_API_KEY in environment.
Mark: @pytest.mark.live
"""

import asyncio
import os
import time

import pytest

from worldlabs_mcp.server import (
    generate_world_from_text,
    get_operation,
    get_world,
    list_worlds,
    wait_for_world,
)

# ---------------------------------------------------------------------------
# Skip guard
# ---------------------------------------------------------------------------

live = pytest.mark.skipif(
    not os.environ.get("WORLDLABS_API_KEY"),
    reason="WORLDLABS_API_KEY not set — skipping live API tests",
)

# ---------------------------------------------------------------------------
# Interesting prompts — marble-1.1
# ---------------------------------------------------------------------------

PROMPTS = [
    (
        "fantasy-magic-shop-cathedral",
        "A medieval fantasy magic shop tucked inside a gothic cathedral nave. "
        "Towering stained glass windows cast coloured light across shelves crowded with "
        "glowing potions, arcane tomes, crystalline orbs, and hanging bundles of dried herbs. "
        "Rough stone pillars, flickering candles, a wooden counter with a brass cash register. "
        "Dust motes in the light. Worn flagstone floor.",
    ),
    (
        "fallingwater-exterior",
        "Fallingwater, Frank Lloyd Wright's 1935 masterwork, Bear Run, Pennsylvania. "
        "Cantilevered concrete terraces over a waterfall in autumn forest. "
        "Warm sandstone walls, flat roofs with deep overhangs, floor-to-ceiling glass. "
        "Stream below, fallen leaves on terraces. Dappled afternoon light through trees.",
    ),
    (
        "fallingwater-interior",
        "Interior of Fallingwater by Frank Lloyd Wright. "
        "Great room with low horizontal ceilings, Cherokee red steel detailing, "
        "polished flagstone floor continuing outside, built-in furniture in honey-toned wood. "
        "Hatch in floor opening to stream below. Clerestory windows. Warm lamp light.",
    ),
    (
        "victorian-botanical-conservatory",
        "A Victorian cast-iron botanical conservatory at night. "
        "Ornate ribbed dome dripping with condensation, palm fronds and ferns pressing the glass. "
        "Wrought-iron walkways, hanging lanterns, terracotta pots in geometric arrangements. "
        "Moonlight through the glass, tropical mist.",
    ),
    (
        "abandoned-soviet-research-station",
        "An abandoned Soviet Arctic research station, 1970s Brutalist concrete. "
        "Snow drifts against broken windows, rusted equipment racks, faded propaganda posters. "
        "Generator room with seized machinery, cracked linoleum floor, overturned metal chairs. "
        "Blue-white blizzard light through porthole windows.",
    ),
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _generate_and_poll(
    prompt: str,
    display_name: str,
    *,
    model: str = "marble-1.1",
    max_wait: int = 90,
    poll_interval: int = 10,
) -> dict:
    """Generate a world and poll until done. Returns the completed operation."""
    op = await generate_world_from_text(
        text_prompt=prompt,
        display_name=display_name,
        model=model,
    )
    assert "name" in op or "operation_id" in op or "metadata" in op, f"Unexpected operation response shape: {op}"

    # Extract operation_id — API may return name="operations/<id>" or operation_id directly
    op_id: str = ""
    if "operation_id" in op:
        op_id = op["operation_id"]
    elif "name" in op:
        op_id = op["name"].split("/")[-1]
    else:
        pytest.fail(f"Cannot find operation_id in response: {op}")

    # Poll
    deadline = time.monotonic() + max_wait
    while True:
        status = await get_operation(op_id)
        if status.get("done"):
            error = status.get("error")
            assert not error, f"Generation failed: {error}"
            return status
        if time.monotonic() > deadline:
            pytest.fail(
                f"Operation {op_id} did not complete in {max_wait}s. Increase max_wait or use 'plus' model expectation."
            )
        await asyncio.sleep(poll_interval)


# ---------------------------------------------------------------------------
# Live tests
# ---------------------------------------------------------------------------


@live
@pytest.mark.live
@pytest.mark.asyncio
async def test_generate_magic_shop():
    """Fantasy magic shop in gothic cathedral — smoke test for mini model."""
    name, prompt = PROMPTS[0]
    result = await _generate_and_poll(prompt, display_name=name)
    _assert_world_assets(result)


@live
@pytest.mark.live
@pytest.mark.asyncio
async def test_generate_fallingwater_exterior():
    """Fallingwater exterior."""
    name, prompt = PROMPTS[1]
    result = await _generate_and_poll(prompt, display_name=name)
    _assert_world_assets(result)


@live
@pytest.mark.live
@pytest.mark.asyncio
async def test_generate_fallingwater_interior():
    """Fallingwater interior — tests indoor scene handling."""
    name, prompt = PROMPTS[2]
    result = await _generate_and_poll(prompt, display_name=name)
    _assert_world_assets(result)


@live
@pytest.mark.live
@pytest.mark.asyncio
async def test_generate_victorian_conservatory():
    """Victorian botanical conservatory — curved glass + organic forms."""
    name, prompt = PROMPTS[3]
    result = await _generate_and_poll(prompt, display_name=name)
    _assert_world_assets(result)


@live
@pytest.mark.live
@pytest.mark.asyncio
async def test_generate_soviet_research_station():
    """Abandoned Soviet station — Brutalist + detailed interior."""
    name, prompt = PROMPTS[4]
    result = await _generate_and_poll(prompt, display_name=name)
    _assert_world_assets(result)


@live
@pytest.mark.live
@pytest.mark.asyncio
async def test_list_worlds_after_generation():
    """list_worlds returns at least the worlds just generated."""
    result = await list_worlds(page_size=10)
    assert "worlds" in result
    assert isinstance(result["worlds"], list)
    # At least one world should exist after generation tests
    assert len(result["worlds"]) >= 1


@live
@pytest.mark.live
@pytest.mark.asyncio
async def test_get_world_by_id():
    """get_world round-trips a world we just generated."""
    _, prompt = PROMPTS[0]
    op = await generate_world_from_text(text_prompt=prompt, display_name="get-world-test")
    op_id = _extract_op_id(op)
    done = await wait_for_world(op_id, poll_interval_seconds=10, timeout_seconds=90)
    world_id = _extract_world_id(done)
    world = await get_world(world_id)
    assert world["id"] == world_id
    _assert_world_detail(world)


@live
@pytest.mark.live
@pytest.mark.asyncio
async def test_wait_for_world_helper():
    """wait_for_world convenience wrapper works correctly."""
    _, prompt = PROMPTS[0]
    op = await generate_world_from_text(
        text_prompt=prompt,
        display_name="wait-helper-test",
    )
    op_id = _extract_op_id(op)
    result = await wait_for_world(op_id, poll_interval_seconds=10, timeout_seconds=90)
    assert result.get("done") is True
    assert not result.get("error")


# ---------------------------------------------------------------------------
# Asset assertions
# ---------------------------------------------------------------------------


def _assert_world_assets(operation: dict) -> None:
    """Assert a completed operation contains a world with basic asset fields."""
    response = operation.get("response", {})
    world = response.get("world", {})
    assert world, f"No world in response: {operation}"
    assert world.get("id"), "World has no id"
    # Asset URLs vary by API version — at least some assets must be present
    assets = world.get("assets", {})
    assert assets, f"World has no assets block: {world}"


def _assert_world_detail(world: dict) -> None:
    """Assert a get_world response has the expected fields."""
    assert "id" in world
    assert "assets" in world
    assets = world["assets"]
    # At least one of the known URL fields should be populated
    url_fields = [
        "splat_url",
        "thumbnail_url",
        "mesh_url",
        "panorama_url",
    ]
    has_url = any(assets.get(f) for f in url_fields)
    assert has_url, f"No URL fields found in assets: {assets}"


def _extract_op_id(op: dict) -> str:
    if "operation_id" in op:
        return op["operation_id"]
    if "name" in op:
        return op["name"].split("/")[-1]
    pytest.fail(f"Cannot extract operation_id from: {op}")


def _extract_world_id(done_op: dict) -> str:
    world = done_op.get("response", {}).get("world", {})
    world_id = world.get("id", "")
    assert world_id, f"No world id in done operation: {done_op}"
    return world_id
