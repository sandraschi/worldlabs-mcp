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

# 2. Load .env from project root into current session
$envFile = Join-Path $ProjectRoot ".env"
if (Test-Path $envFile) {
    Write-Host "Loading .env from $envFile" -ForegroundColor Yellow
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line -split "=", 2
            if ($parts.Count -eq 2) {
                $varName = $parts[0].Trim()
                $varValue = $parts[1].Trim().Trim('"').Trim("'")
                [System.Environment]::SetEnvironmentVariable($varName, $varValue, "Process")
                Write-Host "  Set $varName" -ForegroundColor DarkGray
            }
        }
    }
}
else {
    Write-Host "No .env found at $envFile -- continuing without it" -ForegroundColor DarkYellow
}

# 3. Install Python deps
Write-Host "Checking Python deps..." -ForegroundColor Yellow
Set-Location $ProjectRoot
uv pip install fastapi uvicorn httpx python-dotenv 2>$null | Out-Null

# 4. Start backend (non-blocking)
Write-Host "Starting backend on :$BackendPort ..." -ForegroundColor Green
$env:WEB_PORT = $BackendPort
$bridgePath = Join-Path $BackendDir "bridge.py"
Start-Process uv -ArgumentList "run", "--", "python", $bridgePath -WindowStyle Hidden
Start-Sleep -Milliseconds 1200

# 5. Start frontend
Write-Host "Starting frontend on :$FrontendPort ..." -ForegroundColor Green
Set-Location $PSScriptRoot
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm packages..." -ForegroundColor Yellow
    npm install
}
npm run dev -- --port $FrontendPort --host
