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


@pytest.mark.asyncio
async def test_generate_world_prompt_fallback_shape():
    """Sampling tool without a sampling host: local engine or structured error."""
    from worldlabs_mcp.server import generate_world_prompt

    result = await generate_world_prompt(idea="misty Japanese garden at dawn", style="cinematic", ctx=None)
    assert set(result) >= {"success", "message"}
    if result["success"]:
        assert result["data"]["via"] in ("sampling", "ollama")
        assert len(result["data"]["expanded"]) > 20
    else:
        assert result["recovery_options"]


@pytest.mark.asyncio
async def test_llm_provider_surface():
    """Canonical section VI.10 contracts: providers, models, onboarding, settings, keystore roundtrip."""
    import httpx

    from worldlabs_mcp.server import app

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        r = await ac.get("/api/llm/providers")
        assert r.status_code == 200, r.text
        infos = r.json()["providers"]
        by_id = {p["id"]: p for p in infos}
        assert {"ollama", "lmstudio", "vllm"} <= set(by_id)
        assert by_id["ollama"]["kind"] == "local"
        assert by_id["openai"]["needs_key"] is True
        assert "api_key" not in r.text  # no key bytes ever

        r = await ac.get("/api/llm/models", params={"provider": "openai"})
        assert r.status_code == 200, r.text
        assert r.json()["source"] in ("live", "curated")

        r = await ac.get("/api/llm/models", params={"provider": "nope"})
        assert r.status_code == 400

        r = await ac.get("/api/llm/onboarding")
        assert r.status_code == 200, r.text
        assert "recommendation" in r.json()

        r = await ac.get("/api/llm/gpus")
        assert r.status_code == 200, r.text
        assert "gpus" in r.json()

        # settings roundtrip: save a key without switching, then delete it
        r = await ac.post(
            "/api/settings/llm",
            json={"provider": "openai", "api_key": "sk-test-key-do-not-use", "select": False},
        )
        assert r.status_code == 200, r.text
        assert r.json()["key_saved"] is True

        r = await ac.get("/api/settings/llm")
        assert r.status_code == 200, r.text
        assert r.json()["keys_configured"]["openai"] is True
        assert "sk-test-key-do-not-use" not in r.text

        r = await ac.delete("/api/settings/llm/key", params={"provider": "openai"})
        assert r.status_code == 200, r.text
        assert r.json()["removed"] is True
