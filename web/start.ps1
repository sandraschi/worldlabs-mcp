$FrontendPort = 10864
$BackendPort = 10865
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $PSScriptRoot "backend"

Write-Host "World Labs MCP Webapp Launcher" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:$FrontendPort" -ForegroundColor White
Write-Host "Backend:  http://localhost:$BackendPort" -ForegroundColor White

# 1. Clear ports
Write-Host "Clearing ports..." -ForegroundColor Yellow
foreach ($p in @($FrontendPort, $BackendPort)) {
    Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

# 2. Install Python deps
Write-Host "Checking Python deps..." -ForegroundColor Yellow
Set-Location $ProjectRoot
uv pip install fastapi uvicorn httpx 2>$null | Out-Null

# 3. Start backend (non-blocking)
Write-Host "Starting backend on :$BackendPort ..." -ForegroundColor Green
$env:WEB_PORT = $BackendPort
$bridgePath = Join-Path $BackendDir "bridge.py"
Start-Process uv -ArgumentList "run", "--", "python", $bridgePath -WindowStyle Hidden
Start-Sleep -Milliseconds 1200

# 4. Start frontend
Write-Host "Starting frontend on :$FrontendPort ..." -ForegroundColor Green
Set-Location $PSScriptRoot
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm packages..." -ForegroundColor Yellow
    npm install
}
npm run dev -- --port $FrontendPort --host
