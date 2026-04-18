import sys

import pytest
from pytest_httpx import HTTPXMock

# Use absolute path to backend
BACKEND_PATH = r"d:\Dev\repos\worldlabs-mcp\web_sota\backend"
if BACKEND_PATH not in sys.path:
    sys.path.append(BACKEND_PATH)


@pytest.mark.asyncio
async def test_refine_prompt_ollama(httpx_mock: HTTPXMock):
    from worldlabs_mcp.server import app
    import httpx

    httpx_mock.add_response(
        method="POST",
        url="http://localhost:11434/api/chat",
        json={"message": {"content": "Descriptive refined prompt"}},
    )

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/llm/refine", json={"prompt": "forest", "provider": "ollama", "model": "llama3"}
        )

    assert response.status_code == 200
    assert response.json() == {"refined": "Descriptive refined prompt", "status": "ok"}


@pytest.mark.asyncio
async def test_refine_prompt_lmstudio(httpx_mock: HTTPXMock):
    from worldlabs_mcp.server import app
    import httpx

    httpx_mock.add_response(
        method="POST",
        url="http://localhost:1234/v1/chat/completions",
        json={"choices": [{"message": {"content": "Pro world design prompt"}}]},
    )

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/api/llm/refine", json={"prompt": "city", "provider": "lmstudio", "model": "qwen2"}
        )

    assert response.status_code == 200
    assert response.json() == {"refined": "Pro world design prompt", "status": "ok"}
