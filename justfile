set windows-shell := ["pwsh.exe", "-NoLogo", "-Command"]
import 'scripts/just/fleet.just'

# ── Dashboard ─────────────────────────────────────────────────────────────────

# Open the interactive recipe dashboard in the browser
default:
    @just --list

# ── Server ────────────────────────────────────────────────────────────────────

# Start full stack (backend + frontend webapp)
start:
    pwsh -File '{{justfile_directory()}}\start.ps1'

# Start backend only (uvicorn on port 10865, no frontend)
start-backend:
    pwsh -File '{{justfile_directory()}}\start.ps1' -BackendOnly

# Start headless (no browser open, hidden windows)
start-headless:
    pwsh -File '{{justfile_directory()}}\start.ps1' -Headless -NoBrowser

# Start MCP server in stdio mode (for Claude Desktop)
run:
    Set-Location '{{justfile_directory()}}'; uv run worldlabs-mcp

# Start MCP server with FastMCP dev inspector
dev:
    Set-Location '{{justfile_directory()}}'; uv run fastmcp dev src/worldlabs_mcp/server.py

# Start Vite frontend dev server only (backend must already be running)
frontend:
    Set-Location '{{justfile_directory()}}\web_sota'; npm run dev -- --port 10864 --host

# Build frontend for production (web_sota/dist/)
build:
    Set-Location '{{justfile_directory()}}\web_sota'; npm run build

# Preview built frontend (requires: just build first)
preview:
    Set-Location '{{justfile_directory()}}\web_sota'; npm run preview -- --port 10864

# ── Dependencies ──────────────────────────────────────────────────────────────

# Sync Python deps from pyproject.toml (creates/updates .venv)
sync:
    Set-Location '{{justfile_directory()}}'; uv sync

# Sync Python deps including all optional groups
sync-all:
    Set-Location '{{justfile_directory()}}'; uv sync --all-extras

# Install Python deps including TTS (edge-tts for spatial narration)
sync-tts:
    Set-Location '{{justfile_directory()}}'; uv sync --extra tts

# Install Python dev deps (pytest, ruff, mypy)
sync-dev:
    Set-Location '{{justfile_directory()}}'; uv sync --extra dev

# Install/update frontend npm deps
npm-install:
    Set-Location '{{justfile_directory()}}\web_sota'; npm install

# Update all Python deps to latest compatible versions
update-python:
    Set-Location '{{justfile_directory()}}'; uv lock --upgrade; uv sync

# Update all npm deps
update-npm:
    Set-Location '{{justfile_directory()}}\web_sota'; npm update

# ── Quality ───────────────────────────────────────────────────────────────────

# Run Ruff linter (Python) + Biome linter (frontend)
lint:
    Set-Location '{{justfile_directory()}}'; uv run ruff check .
    Set-Location '{{justfile_directory()}}\web_sota'; npx @biomejs/biome ci .

# Run Ruff linter on Python only
lint-py:
    Set-Location '{{justfile_directory()}}'; uv run ruff check .

# Run Biome linter on frontend only
lint-fe:
    Set-Location '{{justfile_directory()}}\web_sota'; npx @biomejs/biome ci .

# Auto-fix and format Python (ruff check --fix + ruff format)
fix:
    Set-Location '{{justfile_directory()}}'; uv run ruff check . --fix --unsafe-fixes
    Set-Location '{{justfile_directory()}}'; uv run ruff format .

# Auto-fix and format frontend (Biome)
fix-fe:
    Set-Location '{{justfile_directory()}}\web_sota'; npx @biomejs/biome check --write .

# Auto-fix everything (Python + frontend)
fix-all:
    just fix
    just fix-fe

# Run mypy type checking (non-blocking, for CI adoption)
typecheck:
    Set-Location '{{justfile_directory()}}'; uv run mypy src/ --ignore-missing-imports

# Run TypeScript type checking (frontend)
typecheck-fe:
    Set-Location '{{justfile_directory()}}\web_sota'; npx tsc --noEmit

# ── Testing ───────────────────────────────────────────────────────────────────

# Run full test suite
test:
    Set-Location '{{justfile_directory()}}'; uv run pytest tests/ -v

# Run tests with coverage report
test-cov:
    Set-Location '{{justfile_directory()}}'; uv run pytest tests/ -v --cov=src/worldlabs_mcp --cov-report=term-missing --cov-report=html

# Run only fast unit tests (skip slow integration tests)
test-unit:
    Set-Location '{{justfile_directory()}}'; uv run pytest tests/ -v -m "not slow"

# Run a specific test file
test-file FILE:
    Set-Location '{{justfile_directory()}}'; uv run pytest {{FILE}} -v

# Run tests matching a keyword
test-k KEYWORD:
    Set-Location '{{justfile_directory()}}'; uv run pytest tests/ -v -k {{KEYWORD}}

# Run tests and stop on first failure
test-fail-fast:
    Set-Location '{{justfile_directory()}}'; uv run pytest tests/ -v -x

# ── Security ──────────────────────────────────────────────────────────────────

# Run Bandit security audit on Python source
audit-sec:
    Set-Location '{{justfile_directory()}}'; uv run bandit -r src/ -ll

# Run pip-audit for known CVEs in Python deps
audit-deps:
    Set-Location '{{justfile_directory()}}'; uv run pip-audit

# Run npm audit on frontend deps
audit-npm:
    Set-Location '{{justfile_directory()}}\web_sota'; npm audit

# Run all security audits
audit-all:
    just audit-sec
    just audit-deps
    just audit-npm

# ── Packaging ─────────────────────────────────────────────────────────────────

# Build Python distribution (sdist + wheel)
build-py:
    Set-Location '{{justfile_directory()}}'; uv build

# Pack MCP server for mcpb distribution
pack:
    Set-Location '{{justfile_directory()}}'; mcpb pack

# Validate mcpb package before publishing
validate:
    Set-Location '{{justfile_directory()}}'; mcpb validate

# Show installed package version
version:
    Set-Location '{{justfile_directory()}}'; uv run python -c "from worldlabs_mcp import __version__; print(__version__)" 2>$null; if ($LASTEXITCODE -ne 0) { uv run python -c "import importlib.metadata; print(importlib.metadata.version('worldlabs-mcp'))" }

# ── Demos ─────────────────────────────────────────────────────────────────────

# Launch Spark 2.0 Viewer with a local Gaussian splat asset
view:
    pwsh -File '{{justfile_directory()}}\scripts\view-residence.ps1'

# Run spatial narration demo (requires backend running)
demo-narration:
    pwsh -File '{{justfile_directory()}}\scripts\demo-narration.ps1'

# Generate a test world from text via the MCP tool (requires API key)
demo-text:
    Set-Location '{{justfile_directory()}}'; uv run python -c "import asyncio; from worldlabs_mcp.server import generate_world_from_text; r = asyncio.run(generate_world_from_text('A misty Japanese garden at dawn')); print(r)"

# Quick health check of the backend REST API
health:
    $r = Invoke-RestMethod -Uri 'http://localhost:10865/health' -ErrorAction SilentlyContinue; if ($r) { Write-Host "Backend OK: $($r | ConvertTo-Json -Compress)" -ForegroundColor Green } else { Write-Host "Backend not responding on :10865" -ForegroundColor Red }

# Check API capabilities endpoint
capabilities:
    $r = Invoke-RestMethod -Uri 'http://localhost:10865/api/capabilities' -ErrorAction SilentlyContinue; if ($r) { $r | ConvertTo-Json } else { Write-Host "Backend not responding" -ForegroundColor Red }

# Probe local LLM discovery (Ollama + LM Studio)
probe-llm:
    $r = Invoke-RestMethod -Uri 'http://localhost:10865/api/llm/discover' -ErrorAction SilentlyContinue; if ($r) { $r | ConvertTo-Json -Depth 4 } else { Write-Host "Backend not responding" -ForegroundColor Red }

# ── Logging ───────────────────────────────────────────────────────────────────

# Tail the bridge log (src/logs/bridge.log)
log:
    Get-Content '{{justfile_directory()}}\src\logs\bridge.log' -Wait -Tail 50

# Show last 100 lines of bridge log
log-tail:
    Get-Content '{{justfile_directory()}}\src\logs\bridge.log' -Tail 100

# Clear the bridge log
log-clear:
    Clear-Content '{{justfile_directory()}}\src\logs\bridge.log' -ErrorAction SilentlyContinue; Write-Host "Log cleared."

# Show Claude Desktop MCP server log
log-mcp:
    Get-Content "$env:APPDATA\Claude\logs\mcp-server-worldlabs-mcp.log" -Tail 100 -ErrorAction SilentlyContinue

# Tail Claude Desktop MCP server log live
log-mcp-tail:
    Get-Content "$env:APPDATA\Claude\logs\mcp-server-worldlabs-mcp.log" -Wait -Tail 50 -ErrorAction SilentlyContinue

# ── Maintenance ───────────────────────────────────────────────────────────────

# Remove Python build artifacts (.venv, dist, __pycache__, .egg-info)
clean-py:
    Remove-Item -Recurse -Force '{{justfile_directory()}}\.venv' -ErrorAction SilentlyContinue; \
    Remove-Item -Recurse -Force '{{justfile_directory()}}\dist' -ErrorAction SilentlyContinue; \
    Get-ChildItem -Recurse -Filter '__pycache__' '{{justfile_directory()}}\src' | Remove-Item -Recurse -Force; \
    Get-ChildItem -Recurse -Filter '*.egg-info' '{{justfile_directory()}}' | Remove-Item -Recurse -Force; \
    Write-Host "Python artifacts cleaned."

# Remove frontend build artifacts (node_modules, dist, tsbuildinfo)
clean-fe:
    Remove-Item -Recurse -Force '{{justfile_directory()}}\web_sota\node_modules' -ErrorAction SilentlyContinue; \
    Remove-Item -Recurse -Force '{{justfile_directory()}}\web_sota\dist' -ErrorAction SilentlyContinue; \
    Get-ChildItem -Recurse -Filter '*.tsbuildinfo' '{{justfile_directory()}}\web_sota' | Remove-Item -Force; \
    Write-Host "Frontend artifacts cleaned."

# Remove all build artifacts (Python + frontend)
clean:
    just clean-py
    just clean-fe

# Remove downloaded temp assets from worldlabs temp dir
clean-assets:
    $tmp = Join-Path $env:TEMP 'worldlabs'; if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp; Write-Host "Temp assets cleaned: $tmp" } else { Write-Host "No temp assets to clean." }

# Remove TTS audio cache
clean-tts:
    $tmp = Join-Path $env:TEMP 'worldlabs-tts'; if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp; Write-Host "TTS cache cleared." } else { Write-Host "No TTS cache to clean." }

# Full clean + reinstall from scratch
clean-all:
    just clean
    just sync-all
    just npm-install
    Write-Host "Full reinstall complete." -ForegroundColor Green

# Backup repo to mcp-central-docs archive
backup:
    pwsh -File '{{justfile_directory()}}\scripts\backup-repo.ps1'

# ── Documentation ─────────────────────────────────────────────────────────────

# Open API docs in browser (requires backend running)
docs-api:
    Start-Process 'https://docs.worldlabs.ai/api'

# Open platform dashboard in browser
docs-platform:
    Start-Process 'https://platform.worldlabs.ai'

# Open Marble gallery in browser
docs-gallery:
    Start-Process 'https://worldlabs.ai/gallery'

# Show llms.txt (LLM integration manifest)
docs-llms:
    Get-Content '{{justfile_directory()}}\llms.txt'

# ── Marble Adventure (competition game) ───────────────────────────────────────

# Validate Godot hub project loads
marble-adventure-check godot= "C:\\Users\sandr\.local\bin\godot.exe":
    Set-Location '{{justfile_directory()}}\competition\marble-adventure'; & '{{godot}}' --headless --path . --quit-after 1

# Launch hub (public Marble URLs — no player account)
marble-adventure-play:
    pwsh -NoProfile -ExecutionPolicy Bypass -File '{{justfile_directory()}}\competition\play.ps1'

# Download portal preview thumbnails (author machine, needs worldlabs API)
marble-adventure-thumbs:
    pwsh -NoProfile -ExecutionPolicy Bypass -File '{{justfile_directory()}}\competition\download_world_thumbs.ps1'

# Download CDN thumbnails (no API key — for bundling in repo)
marble-adventure-cdn-thumbs:
    pwsh -NoProfile -ExecutionPolicy Bypass -File '{{justfile_directory()}}\competition\download_cdn_thumbs.ps1'

# Trailer capture helper (opens game + prints checklist)
marble-adventure-trailer:
    pwsh -NoProfile -ExecutionPolicy Bypass -File '{{justfile_directory()}}\competition\capture_trailer.ps1'

# Windows export for itch (no upload)
marble-adventure-export-win godot= "C:\\Users\sandr\.local\bin\godot.exe":
    pwsh -NoProfile -ExecutionPolicy Bypass -File '{{justfile_directory()}}\competition\ship-itch.ps1' -GodotExe '{{godot}}' -ExportOnly

# Butler push-preview (no upload)
marble-adventure-ship-preview godot= "C:\\Users\sandr\.local\bin\godot.exe":
    pwsh -NoProfile -ExecutionPolicy Bypass -File '{{justfile_directory()}}\competition\ship-itch.ps1' -GodotExe '{{godot}}' -Preview

# Hidden Butler push — needs BUTLER_API_KEY in competition/.env
marble-adventure-ship-push godot= "C:\\Users\sandr\.local\bin\godot.exe":
    pwsh -NoProfile -ExecutionPolicy Bypass -File '{{justfile_directory()}}\competition\ship-itch.ps1' -GodotExe '{{godot}}' -Push

# Regenerate Marble worlds from prompts (author, needs API + credits)
marble-adventure-regen-worlds portal="":
    pwsh -NoProfile -ExecutionPolicy Bypass -File '{{justfile_directory()}}\competition\regenerate_worlds.ps1' -Portal '{{portal}}'

# ── CI Pipeline ───────────────────────────────────────────────────────────────

# Full CI pipeline: sync, lint, typecheck, test
ci:
    just sync-dev
    just lint
    just typecheck
    just test

# Full industrialization: fix + lint + security audits + test
industrialize:
    just fix-all
    just lint
    just typecheck
    just audit-sec
    just audit-deps
    just test-cov
    Write-Host "" ; Write-Host "Industrialization complete." -ForegroundColor Green

# ── Tauri NSIS ─────────────────────────────────────────────────────────────────

# Build the PyInstaller backend .exe and copy to Tauri resources
build-sidecar:
    pwsh -NoProfile -File native\build-sidecar.ps1

# Build the Tauri NSIS desktop installer (full pipeline: frontend -> sidecar -> Rust -> NSIS)
build-native: build-sidecar
    $env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"
    $vcvars = "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"
    $envOutput = cmd /c "`"$vcvars`" > nul & set" | Where-Object { $_ -match '^(INCLUDE|LIB|LIBPATH|VCToolsVersion|WindowsSdkDir|UniversalCRTSdkDir|UCRTVersion)=' }
    foreach ($line in $envOutput) { $parts = $line.Split('=', 2); Set-Item -Path "env:$($parts[0])" -Value $parts[1] -ErrorAction SilentlyContinue }
    Set-Location '{{justfile_directory()}}\native'
    npx @tauri-apps/cli build --bundles nsis

# Run the CUA smoke test against the installed NSIS app
cua-nsis-test:
    C:\Windows\py.exe scripts/cua-smoke.py
# ── Playwright E2E ─────────────────────────────────────────────────────

# Install Playwright browsers (one-time)
e2e-install:
    cd {{REPO}}\web_sota
    npx playwright install chromium

# Run Playwright E2E smoke tests (start backend first: just serve)
e2e:
    cd {{REPO}}\web_sota
    npx playwright test

