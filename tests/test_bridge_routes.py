"""Assfix probe: new /api/skills, /api/shutdown, /api/status, /api/v1/* routes."""

import pytest


@pytest.mark.asyncio
async def test_new_routes():
    import httpx

    from worldlabs_mcp.server import app

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        r = await ac.get("/api/skills")
        assert r.status_code == 200, r.text
        skills = r.json()
        assert isinstance(skills, list) and len(skills) >= 20
        assert skills[0]["name"] == "generate_world_from_text"

        r = await ac.get("/api/status")
        assert r.status_code == 200, r.text
        assert r.json()["tool_count"] >= 20

        r = await ac.get("/api/v1/status")
        assert r.status_code == 200, r.text

        r = await ac.get("/api/v1/diagnostics")
        assert r.status_code == 200, r.text
        assert r.json()["tool_count"] >= 20

        # shutdown would kill the test runner - only check the route exists
        routes = [getattr(rt, "path", "") for rt in app.routes]
        assert "/api/shutdown" in routes
