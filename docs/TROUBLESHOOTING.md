# Troubleshooting

## Quick Diagnostics

```powershell
just health          # curl http://localhost:10865/health
just capabilities    # curl http://localhost:10865/api/capabilities
just probe-llm       # curl http://localhost:10865/api/llm/discover
just log-tail        # last 100 lines of src/logs/bridge.log
just log-mcp         # Claude Desktop MCP log tail
```

Check `logs/bridge.log` (RotatingFile 5MB x5) and `C:\Users\sandr\AppData\Roaming\Claude\logs\mcp-server-worldlabs-mcp.log` (Claude Desktop, latin-1).

## Common Issues

### 402 Payment Required
Out of API credits. Check balance at [platform.worldlabs.ai](https://platform.worldlabs.ai) - credits on marble.worldlabs.ai (web app) are **separate** from API Platform credits.

### 401 Unauthorized / Invalid API Key
- Verify `WORLDLABS_API_KEY` in `.env` is set and valid.
- Test: `Invoke-RestMethod -Headers @{"Authorization"="Bearer $env:WORLDLABS_API_KEY"} https://api.worldlabs.ai/marble/v1/worlds?limit=1`
- Regenerate at [platform.worldlabs.ai/api-keys](https://platform.worldlabs.ai/api-keys).

### Port Conflicts (10864 / 10865 already in use)
`start.ps1` auto-clears zombies via `FleetStartMode.ps1` (`Resolve-FleetPortConflict`). If it still fails:
```powershell
Get-NetTCPConnection -LocalPort 10864,10865 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
# Or:
npx kill-port 10864 10865
```

### Backend not responding / Frontend blank
- `just health` should return `{"status":"ok"}`. If not, backend crashed - check `logs/bridge.log`.
- Frontend Vite proxy targets `http://127.0.0.1:10865` - ensure backend is running (`just start-backend`).
- Browser console: check for CORS errors - `allow_origin_regex` covers `*.ts.net`, `192.168.*`, `10.*`, `100.*`, `localhost`, `tauri://localhost` unconditionally.

### Generation stuck / operation never completes
- Poll manually: `get_operation(operation_id="<id>")` or `wait_for_world(operation_id="<id>", timeout_seconds=120)`.
- Check Marble API status: some generations take 2-5 minutes (video longer).
- If `status: failed`, `message` field has the reason (e.g. invalid image URL, unsupported format).

### Local LLM not detected
- `just probe-llm` should show `ollama: {available: true, models: [...]}` or `lmstudio: {available: true}`.
- Start Ollama: `ollama serve` + `ollama pull llama3.2:3b` (or any model).
- Start LM Studio: enable local server on `:1234` (CORS enabled).
- Without a local LLM, `refine_with_local_llm` returns an error and FloatingChat shows "No local LLM detected" - the server still works, just without LLM features.

### DCC Export fails (Blender/Unity/Resonite)
- Verify target MCP is running: `Test-NetConnection -ComputerName 127.0.0.1 -Port 10700` (Blender), `10730` (Unity).
- Check `WORLDLABS_LOCAL_PATH` points to a readable directory.
- Resonite OSC: confirm `RESONITE_OSC_HOST`/`PORT` match your Resonite OSC listener.

### Plex / Cinema Worlds not loading
- `PLEX_TOKEN` must be set (get from `plex-mcp` or Plex Web > Settings > Account).
- `PLEX_BASE_URL` default `http://localhost:32400` - adjust if Plex is remote.
- Test: `Invoke-RestMethod "http://localhost:32400/?X-Plex-Token=$env:PLEX_TOKEN"`

### Godot hub won't launch (Marble Adventure)
- `just marble-adventure-check` - validates Godot 4.4 loads the hub.
- `just marble-adventure-play` needs Godot at `C:\Users\sandr\.local\bin\godot.exe` (or pass `godot=` arg).
- Worlds are public Marble URLs - no player account needed (`public_marble` default).

### Pre-commit / lint failures
```powershell
just fix        # ruff --fix + ruff format
just fix-fe     # biome check --write in web_sota
uv run pre-commit run --all-files
```

### Editable install false-green (tests pass but source not used)
```powershell
D:\Dev\repos\mcp-central-docs\scripts\check-editable-install.ps1 -RepoRoot (Get-Location).Path
# If FAIL: uv pip install -e .
```

### NSIS build fails
- Needs Rust (`cargo`) + Visual Studio 2022 `vcvars64.bat` + Tauri CLI. See `native/build-sidecar.ps1`.
- `just build-native` does the full pipeline (frontend -> sidecar -> Rust -> NSIS). Check `BUILD_LOG.md` for history.
- If `tauri.conf.json` resources includes `.env` not `.env.example`, build leaks secrets (CRITICAL) - must be `.env.example`.

## Getting Help

- Docs: `README.md`, `docs/SETUP.md`, `docs/FEATURES.md`, `docs/ARCHITECTURE.md`, `docs/PROMPT_GUIDE.md`
- Issues: [github.com/sandraschi/worldlabs-mcp/issues](https://github.com/sandraschi/worldlabs-mcp/issues)
- World Labs API: [docs.worldlabs.ai/api](https://docs.worldlabs.ai/api) + [platform.worldlabs.ai](https://platform.worldlabs.ai)
- Fleet standards: `mcp-central-docs/troubleshooting/BUGS_DEPOT.md` (known fleet-wide bugs like CORS gating, BOM trap, Batch Mutation Safety)
