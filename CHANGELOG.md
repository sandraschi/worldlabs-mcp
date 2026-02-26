# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-02-25

### Added
- **SOTA 2026 Web Dashboard**: High-fidelity React dashboard for world management.
- **Prompt Refinement**: Local LLM integration (Ollama/LM Studio) for 20-line prompt optimization.
- **Unified Handoff**: Cross-MCP asset transfer to Unity3D, Resonite, and Blender.
- **History Persistence**: Backend `history.json` for session tracking across restarts.
- **Technical Specification**: Comprehensive `TECH_SPEC_MARBLE_API.md` for the bridge.
- **Local Bridge**: FastAPI server (`bridge.py`) on port 10865.

### Changed
- Refactored `RefineRequest` to support style-driven prompt optimization.
- Updated `RefinePrompt` logic to strictly aim for 20-line outputs.
- Consolidated world generation polling in the web UI.

### Fixed
- Duplicate `refine_prompt` endpoint definitions in `bridge.py`.
- ARIA accessibility lints in `world-gen.tsx`.

## [0.1.0] - 2026-02-23

### Added
- Initial release of worldlabs-mcp MCP server
- FastMCP 2.12+ integration for Claude Desktop
- `generate_world_from_text` — text prompt to 3D world
- `generate_world_from_image` — public image URL to 3D world (with panorama support)
- `generate_world_from_multi_image` — multiple images at azimuth angles
- `generate_world_from_video` — public video URL to 3D world
- `upload_and_generate` — local file upload + generation (end-to-end)
- `prepare_media_upload` — signed GCS URL for manual file upload
- `generate_world_from_media_asset` — generate from uploaded asset
- `get_operation` — single status poll
- `wait_for_world` — blocking poll with error detection and timeout
- `get_world` — fetch world details and asset URLs
- `list_worlds` — paginated world listing
- Proper error detection in `wait_for_world` (raises RuntimeError on API errors)
- `main()` entry point wired to `[project.scripts]`
- Full test suite (pytest-httpx mocks, 20+ tests)
- `scripts/run_server.py` for stdio and HTTP modes
- `glama.json` for Glama marketplace
- `mcp_config.json` example Claude Desktop config
- CHANGELOG, CONTRIBUTING, SECURITY docs
- `.python-version` pinned to 3.10
- GitHub Actions CI workflow

### Technical Stack
- Python 3.10+
- FastMCP 2.12.0+
- httpx 0.27.0+
- pytest + pytest-asyncio + pytest-httpx
- Ruff (lint + format)

[Unreleased]: https://github.com/sandraschi/worldlabs-mcp/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/sandraschi/worldlabs-mcp/releases/tag/v0.1.0
