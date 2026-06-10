Param([switch]$Headless, [switch]$ReuseIfRunning)
$SkipFrontend = $Headless

# --- SOTA Headless Standard ---
if ($Headless -and ($Host.UI.RawUI.WindowTitle -notmatch 'Hidden')) {
    Start-Process pwsh -ArgumentList '-NoProfile', '-File', $PSCommandPath, '-Headless' -WindowStyle Hidden
    exit
}
$WindowStyle = if ($Headless) { 'Hidden' } else { 'Normal' }
# ------------------------------

$WebPort = 10864
$BackendPort = 10865
$ProjectRoot = Split-Path -Parent $PSScriptRoot

$FleetStartPath = Join-Path $ProjectRoot "scripts\FleetStartMode.ps1"
if (-not (Test-Path -LiteralPath $FleetStartPath)) {
    Write-Host "ERROR: Missing vendored launcher helper: $FleetStartPath" -ForegroundColor Red
    exit 1
}
. $FleetStartPath
$FleetStart = Initialize-FleetStartMode @PSBoundParameters
Enter-FleetHeadlessConsole -Headless:$Headless

$portResolve = @{
    Ports      = @($WebPort, $BackendPort)
    Label      = "worldlabs-mcp"
    AllowReuse = $ReuseIfRunning
}
if ($ReuseIfRunning) {
    $portResolve.HealthChecks = @{
        $BackendPort = "http://127.0.0.1:$BackendPort/health"
        $WebPort     = "http://127.0.0.1:$WebPort/"
    }
}
$portState = Resolve-FleetPortConflict @portResolve
if ($portState.Action -eq 'Blocked') { exit 1 }
if ($portState.Reuse) {
    if (-not $FleetStart.SkipBrowser -and -not $SkipFrontend) {
        Start-Process "http://127.0.0.1:$WebPort/"
    }
    return
}

# 2. Setup
Set-Location $PSScriptRoot
if (-not (Test-Path "node_modules")) { npm install }

# 3. Start the Python backend (Background)
Write-Host "Starting Python backend on port $BackendPort ..." -ForegroundColor Cyan

$backendCmd = "`$env:PYTHONPATH = '$ProjectRoot\src'; Set-Location '$ProjectRoot'; uv run uvicorn worldlabs_mcp.server:app --host 127.0.0.1 --port $BackendPort --log-level info"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -WindowStyle Normal

# Wait for backend to be healthy before starting frontend
Write-Host "Waiting for backend on port $BackendPort ..." -ForegroundColor Cyan
$maxWait = 120
$waited = 0
while ($waited -lt $maxWait) {
    try {
        $null = Invoke-WebRequest -Uri "http://127.0.0.1:$BackendPort/health" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        Write-Host "Backend ready after ${waited}s." -ForegroundColor Green
        break
    } catch {
        Start-Sleep -Seconds 2
        $waited += 2
    }
}
if ($waited -ge $maxWait) {
    Write-Host "WARNING: Backend did not respond within ${maxWait}s. Vite may show proxy errors until it starts." -ForegroundColor Yellow
}

# 4. Run server (Vite dev)
Write-Host "Starting Vite frontend on port $WebPort ..." -ForegroundColor Green

# 4b. Launch background task to open browser once frontend is ready
$frontendUrl = "http://127.0.0.1:$WebPort/"
$pollAndOpen = "for (`$i = 0; `$i -lt 60; `$i++) { try { `$null = Invoke-WebRequest -Uri '$frontendUrl' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; Start-Process '$frontendUrl'; exit } catch { Start-Sleep -Seconds 1 } }"
Start-Process powershell -ArgumentList "-NoProfile", "-WindowStyle", "Hidden", "-Command", $pollAndOpen

Write-Host "Browser will open automatically when Vite is ready." -ForegroundColor Gray
if ($SkipFrontend) { return }
npm run dev -- --port $WebPort --host
