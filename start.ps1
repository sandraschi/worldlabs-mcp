Param(
    [switch]$Headless,
    [switch]$BackendOnly,
    [switch]$NoBrowser

# Fast port helpers (scripts/PortHelpers.ps1)
Param(
    [switch]$Headless,
    [switch]$BackendOnly,
    [switch]$NoBrowser
)

# --- SOTA Headless Standard 2026 ---
if ($Headless -and ($Host.Name -ne 'ConsoleHost' -or -not (Get-Variable -Name "NoRelaunch" -ErrorAction SilentlyContinue))) {
    $argList = @("-File", $PSCommandPath, "-NoRelaunch")
    if ($BackendOnly) { $argList += "-BackendOnly" }
    $argList += "-NoBrowser"
    Start-Process pwsh.exe -ArgumentList $argList -WindowStyle Hidden
    exit
}
# -----------------------------------

# Note: ErrorActionPreference left at default (Continue).
# We handle errors explicitly -- Stop mode causes winget's
# "already installed" exit codes to crash the script.
$RepoRoot     = $PSScriptRoot
$WebPort      = 10864
$BackendPort  = 10865

Write-Host ""
Write-Host "worldlabs-mcp - Setup and Start" -ForegroundColor Cyan
Write-Host "Backend  :$BackendPort   Frontend  :$WebPort" -ForegroundColor DarkGray
Write-Host ""

# ===========================================================================
# FUNCTION: Require-Command - install via winget if missing
# Naked PC Install Standard (fleet-wide).
# winget returns non-zero even for "already installed" -- we only care
# whether the command is available afterwards, not the exit code.
# ===========================================================================
function Require-Command {
    param([string]$Cmd, [string]$WingetId, [string]$Label)
    if (Get-Command $Cmd -ErrorAction SilentlyContinue) {
        Write-Host "  [ok] $Label" -ForegroundColor DarkGreen
        return
    }
    Write-Host "  [--] $Label not found - installing via winget ..." -ForegroundColor Yellow

    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if (-not $winget) {
        $candidates = @(
            "$env:LOCALAPPDATA\Microsoft\WindowsApps\winget.exe",
            "$env:PROGRAMFILES\WindowsApps\Microsoft.DesktopAppInstaller_*\winget.exe"
        )
        foreach ($c in $candidates) {
            $found = Get-Item $c -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($found) { $winget = $found.FullName; break }
        }
    } else {
        $winget = $winget.Source
    }

    if (-not $winget) {
        Write-Host "ERROR: winget not found. Install $Label manually:" -ForegroundColor Red
        Write-Host "  winget install --id $WingetId" -ForegroundColor Yellow
        exit 1
    }

    & $winget install --id $WingetId --silent --accept-source-agreements --accept-package-agreements
    # Refresh PATH -- winget installs into user PATH entries
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("PATH","User")
    if (-not (Get-Command $Cmd -ErrorAction SilentlyContinue)) {
        Write-Host "ERROR: $Label installed but '$Cmd' still not in PATH." -ForegroundColor Red
        Write-Host "Close this window, reopen PowerShell, and run start.bat again." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "  [ok] $Label installed" -ForegroundColor Green
}

# Helper: resolve npm.cmd reliably next to node.exe
function Get-NpmCmdPath {
    $nodeApp = Get-Command node -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    $nodeSrc = if ($nodeApp -and $nodeApp.Source -and ($nodeApp.Source -ne '')) { $nodeApp.Source } else { $null }
    if (-not $nodeSrc) {
        $nodeSrc = [string](where.exe node 2>$null | Select-Object -First 1)
    }
    if ($nodeSrc -and ($nodeSrc -ne '')) {
        $nodeDir = Split-Path -Path ([string]$nodeSrc) -Parent
        $cmd = Join-Path $nodeDir "npm.cmd"
        if (Test-Path -LiteralPath $cmd) { return $cmd }
    }
    $npmApp = Get-Command npm -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($npmApp -and $npmApp.Source -and ($npmApp.Source -ne '')) { return $npmApp.Source }
    $npmWhere = [string](where.exe npm 2>$null | Select-Object -First 1)
    if ($npmWhere) { return $npmWhere }
    return "npm"
}

# ===========================================================================
# 0. Require core tools (Naked PC Install Standard)
# ===========================================================================
Write-Host "[0/4] Checking required tools ..." -ForegroundColor Cyan
Require-Command "uv"   "astral-sh.uv"      "uv (Python package manager)"
Require-Command "node" "OpenJS.NodeJS.LTS" "Node.js LTS"
Require-Command "just" "Casey.Just"        "just (task runner)"
Write-Host ""

# ===========================================================================
# 1. Kill stale processes on our ports
# ===========================================================================
Write-Host "[1/4] Checking for port squatters on $WebPort and $BackendPort ..." -ForegroundColor Yellow
$stalePids = Get-NetTCPConnection -LocalPort $WebPort, $BackendPort -ErrorAction SilentlyContinue |
    Where-Object { $_.OwningProcess -gt 4 } |
    Select-Object -ExpandProperty OwningProcess -Unique
foreach ($p in $stalePids) {
    Write-Host "  Terminating PID $p ..." -ForegroundColor Red
    try { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue } catch { }
}

# ===========================================================================
# 2. Python deps
# ===========================================================================
Write-Host "[2/4] Syncing Python deps ..." -ForegroundColor Cyan
Set-Location $RepoRoot
uv sync
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: uv sync failed. Check pyproject.toml and your Python version." -ForegroundColor Red
    exit 1
}

# ===========================================================================
# 3. Start Backend (uvicorn: REST API + MCP stdio bridge)
# ===========================================================================
Write-Host "[3/4] Starting Backend (port $BackendPort) ..." -ForegroundColor Cyan
$backendCmd = "`$env:PYTHONPATH = '$RepoRoot\src'; Set-Location '$RepoRoot'; uv run uvicorn worldlabs_mcp.server:app --host 127.0.0.1 --port $BackendPort --log-level info"
$backendProc = Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -PassThru -WindowStyle Normal
Write-Host "  [ok] Backend PID: $($backendProc.Id)" -ForegroundColor DarkGreen

if ($BackendOnly) {
    Write-Host "Backend-only mode active. Press Ctrl+C to exit." -ForegroundColor Yellow
    Wait-Process -Id $backendProc.Id
    exit
}

# ===========================================================================
# 4. Start Frontend (web_sota, Vite dev server)
# ===========================================================================
Write-Host "[4/4] Starting Frontend (web_sota, port $WebPort) ..." -ForegroundColor Cyan
$webRoot = Join-Path $RepoRoot "web_sota"
Set-Location $webRoot

$npmCmd = Get-NpmCmdPath
if (-not (Test-Path (Join-Path $webRoot "node_modules"))) {
    Write-Host "  Installing npm dependencies ..." -ForegroundColor Yellow
    & $npmCmd install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: npm install failed. Check web_sota/package.json." -ForegroundColor Red
        exit 1
    }
}

# Poll-and-open browser once Vite is ready (SOTA standard)
if (-not $NoBrowser) {
    $frontendUrl = "http://127.0.0.1:$WebPort/"
    $pollAndOpen = "for (`$i = 0; `$i -lt 60; `$i++) { try { `$null = Invoke-WebRequest -Uri '$frontendUrl' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; Start-Process '$frontendUrl'; exit } catch { Start-Sleep -Seconds 1 } }"
    Start-Process powershell -ArgumentList "-NoProfile", "-WindowStyle", "Hidden", "-Command", $pollAndOpen
}

Write-Host ""
Write-Host "Startup complete. Backend :$BackendPort  Frontend :$WebPort" -ForegroundColor Green
Write-Host ""
& $npmCmd run dev -- --port $WebPort --host
_PortHelpers = Join-Path $PSScriptRoot 'scripts\PortHelpers.ps1'
if (Test-Path -LiteralPath Param(
    [switch]$Headless,
    [switch]$BackendOnly,
    [switch]$NoBrowser
)

# --- SOTA Headless Standard 2026 ---
if ($Headless -and ($Host.Name -ne 'ConsoleHost' -or -not (Get-Variable -Name "NoRelaunch" -ErrorAction SilentlyContinue))) {
    $argList = @("-File", $PSCommandPath, "-NoRelaunch")
    if ($BackendOnly) { $argList += "-BackendOnly" }
    $argList += "-NoBrowser"
    Start-Process pwsh.exe -ArgumentList $argList -WindowStyle Hidden
    exit
}
# -----------------------------------

# Note: ErrorActionPreference left at default (Continue).
# We handle errors explicitly -- Stop mode causes winget's
# "already installed" exit codes to crash the script.
$RepoRoot     = $PSScriptRoot
$WebPort      = 10864
$BackendPort  = 10865

Write-Host ""
Write-Host "worldlabs-mcp - Setup and Start" -ForegroundColor Cyan
Write-Host "Backend  :$BackendPort   Frontend  :$WebPort" -ForegroundColor DarkGray
Write-Host ""

# ===========================================================================
# FUNCTION: Require-Command - install via winget if missing
# Naked PC Install Standard (fleet-wide).
# winget returns non-zero even for "already installed" -- we only care
# whether the command is available afterwards, not the exit code.
# ===========================================================================
function Require-Command {
    param([string]$Cmd, [string]$WingetId, [string]$Label)
    if (Get-Command $Cmd -ErrorAction SilentlyContinue) {
        Write-Host "  [ok] $Label" -ForegroundColor DarkGreen
        return
    }
    Write-Host "  [--] $Label not found - installing via winget ..." -ForegroundColor Yellow

    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if (-not $winget) {
        $candidates = @(
            "$env:LOCALAPPDATA\Microsoft\WindowsApps\winget.exe",
            "$env:PROGRAMFILES\WindowsApps\Microsoft.DesktopAppInstaller_*\winget.exe"
        )
        foreach ($c in $candidates) {
            $found = Get-Item $c -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($found) { $winget = $found.FullName; break }
        }
    } else {
        $winget = $winget.Source
    }

    if (-not $winget) {
        Write-Host "ERROR: winget not found. Install $Label manually:" -ForegroundColor Red
        Write-Host "  winget install --id $WingetId" -ForegroundColor Yellow
        exit 1
    }

    & $winget install --id $WingetId --silent --accept-source-agreements --accept-package-agreements
    # Refresh PATH -- winget installs into user PATH entries
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("PATH","User")
    if (-not (Get-Command $Cmd -ErrorAction SilentlyContinue)) {
        Write-Host "ERROR: $Label installed but '$Cmd' still not in PATH." -ForegroundColor Red
        Write-Host "Close this window, reopen PowerShell, and run start.bat again." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "  [ok] $Label installed" -ForegroundColor Green
}

# Helper: resolve npm.cmd reliably next to node.exe
function Get-NpmCmdPath {
    $nodeApp = Get-Command node -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    $nodeSrc = if ($nodeApp -and $nodeApp.Source -and ($nodeApp.Source -ne '')) { $nodeApp.Source } else { $null }
    if (-not $nodeSrc) {
        $nodeSrc = [string](where.exe node 2>$null | Select-Object -First 1)
    }
    if ($nodeSrc -and ($nodeSrc -ne '')) {
        $nodeDir = Split-Path -Path ([string]$nodeSrc) -Parent
        $cmd = Join-Path $nodeDir "npm.cmd"
        if (Test-Path -LiteralPath $cmd) { return $cmd }
    }
    $npmApp = Get-Command npm -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($npmApp -and $npmApp.Source -and ($npmApp.Source -ne '')) { return $npmApp.Source }
    $npmWhere = [string](where.exe npm 2>$null | Select-Object -First 1)
    if ($npmWhere) { return $npmWhere }
    return "npm"
}

# ===========================================================================
# 0. Require core tools (Naked PC Install Standard)
# ===========================================================================
Write-Host "[0/4] Checking required tools ..." -ForegroundColor Cyan
Require-Command "uv"   "astral-sh.uv"      "uv (Python package manager)"
Require-Command "node" "OpenJS.NodeJS.LTS" "Node.js LTS"
Require-Command "just" "Casey.Just"        "just (task runner)"
Write-Host ""

# ===========================================================================
# 1. Kill stale processes on our ports
# ===========================================================================
Write-Host "[1/4] Checking for port squatters on $WebPort and $BackendPort ..." -ForegroundColor Yellow
$stalePids = Get-NetTCPConnection -LocalPort $WebPort, $BackendPort -ErrorAction SilentlyContinue |
    Where-Object { $_.OwningProcess -gt 4 } |
    Select-Object -ExpandProperty OwningProcess -Unique
foreach ($p in $stalePids) {
    Write-Host "  Terminating PID $p ..." -ForegroundColor Red
    try { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue } catch { }
}

# ===========================================================================
# 2. Python deps
# ===========================================================================
Write-Host "[2/4] Syncing Python deps ..." -ForegroundColor Cyan
Set-Location $RepoRoot
uv sync
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: uv sync failed. Check pyproject.toml and your Python version." -ForegroundColor Red
    exit 1
}

# ===========================================================================
# 3. Start Backend (uvicorn: REST API + MCP stdio bridge)
# ===========================================================================
Write-Host "[3/4] Starting Backend (port $BackendPort) ..." -ForegroundColor Cyan
$backendCmd = "`$env:PYTHONPATH = '$RepoRoot\src'; Set-Location '$RepoRoot'; uv run uvicorn worldlabs_mcp.server:app --host 127.0.0.1 --port $BackendPort --log-level info"
$backendProc = Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -PassThru -WindowStyle Normal
Write-Host "  [ok] Backend PID: $($backendProc.Id)" -ForegroundColor DarkGreen

if ($BackendOnly) {
    Write-Host "Backend-only mode active. Press Ctrl+C to exit." -ForegroundColor Yellow
    Wait-Process -Id $backendProc.Id
    exit
}

# ===========================================================================
# 4. Start Frontend (web_sota, Vite dev server)
# ===========================================================================
Write-Host "[4/4] Starting Frontend (web_sota, port $WebPort) ..." -ForegroundColor Cyan
$webRoot = Join-Path $RepoRoot "web_sota"
Set-Location $webRoot

$npmCmd = Get-NpmCmdPath
if (-not (Test-Path (Join-Path $webRoot "node_modules"))) {
    Write-Host "  Installing npm dependencies ..." -ForegroundColor Yellow
    & $npmCmd install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: npm install failed. Check web_sota/package.json." -ForegroundColor Red
        exit 1
    }
}

# Poll-and-open browser once Vite is ready (SOTA standard)
if (-not $NoBrowser) {
    $frontendUrl = "http://127.0.0.1:$WebPort/"
    $pollAndOpen = "for (`$i = 0; `$i -lt 60; `$i++) { try { `$null = Invoke-WebRequest -Uri '$frontendUrl' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; Start-Process '$frontendUrl'; exit } catch { Start-Sleep -Seconds 1 } }"
    Start-Process powershell -ArgumentList "-NoProfile", "-WindowStyle", "Hidden", "-Command", $pollAndOpen
}

Write-Host ""
Write-Host "Startup complete. Backend :$BackendPort  Frontend :$WebPort" -ForegroundColor Green
Write-Host ""
& $npmCmd run dev -- --port $WebPort --host
_PortHelpers) { . Param(
    [switch]$Headless,
    [switch]$BackendOnly,
    [switch]$NoBrowser
)

# --- SOTA Headless Standard 2026 ---
if ($Headless -and ($Host.Name -ne 'ConsoleHost' -or -not (Get-Variable -Name "NoRelaunch" -ErrorAction SilentlyContinue))) {
    $argList = @("-File", $PSCommandPath, "-NoRelaunch")
    if ($BackendOnly) { $argList += "-BackendOnly" }
    $argList += "-NoBrowser"
    Start-Process pwsh.exe -ArgumentList $argList -WindowStyle Hidden
    exit
}
# -----------------------------------

# Note: ErrorActionPreference left at default (Continue).
# We handle errors explicitly -- Stop mode causes winget's
# "already installed" exit codes to crash the script.
$RepoRoot     = $PSScriptRoot
$WebPort      = 10864
$BackendPort  = 10865

Write-Host ""
Write-Host "worldlabs-mcp - Setup and Start" -ForegroundColor Cyan
Write-Host "Backend  :$BackendPort   Frontend  :$WebPort" -ForegroundColor DarkGray
Write-Host ""

# ===========================================================================
# FUNCTION: Require-Command - install via winget if missing
# Naked PC Install Standard (fleet-wide).
# winget returns non-zero even for "already installed" -- we only care
# whether the command is available afterwards, not the exit code.
# ===========================================================================
function Require-Command {
    param([string]$Cmd, [string]$WingetId, [string]$Label)
    if (Get-Command $Cmd -ErrorAction SilentlyContinue) {
        Write-Host "  [ok] $Label" -ForegroundColor DarkGreen
        return
    }
    Write-Host "  [--] $Label not found - installing via winget ..." -ForegroundColor Yellow

    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if (-not $winget) {
        $candidates = @(
            "$env:LOCALAPPDATA\Microsoft\WindowsApps\winget.exe",
            "$env:PROGRAMFILES\WindowsApps\Microsoft.DesktopAppInstaller_*\winget.exe"
        )
        foreach ($c in $candidates) {
            $found = Get-Item $c -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($found) { $winget = $found.FullName; break }
        }
    } else {
        $winget = $winget.Source
    }

    if (-not $winget) {
        Write-Host "ERROR: winget not found. Install $Label manually:" -ForegroundColor Red
        Write-Host "  winget install --id $WingetId" -ForegroundColor Yellow
        exit 1
    }

    & $winget install --id $WingetId --silent --accept-source-agreements --accept-package-agreements
    # Refresh PATH -- winget installs into user PATH entries
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("PATH","User")
    if (-not (Get-Command $Cmd -ErrorAction SilentlyContinue)) {
        Write-Host "ERROR: $Label installed but '$Cmd' still not in PATH." -ForegroundColor Red
        Write-Host "Close this window, reopen PowerShell, and run start.bat again." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "  [ok] $Label installed" -ForegroundColor Green
}

# Helper: resolve npm.cmd reliably next to node.exe
function Get-NpmCmdPath {
    $nodeApp = Get-Command node -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    $nodeSrc = if ($nodeApp -and $nodeApp.Source -and ($nodeApp.Source -ne '')) { $nodeApp.Source } else { $null }
    if (-not $nodeSrc) {
        $nodeSrc = [string](where.exe node 2>$null | Select-Object -First 1)
    }
    if ($nodeSrc -and ($nodeSrc -ne '')) {
        $nodeDir = Split-Path -Path ([string]$nodeSrc) -Parent
        $cmd = Join-Path $nodeDir "npm.cmd"
        if (Test-Path -LiteralPath $cmd) { return $cmd }
    }
    $npmApp = Get-Command npm -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($npmApp -and $npmApp.Source -and ($npmApp.Source -ne '')) { return $npmApp.Source }
    $npmWhere = [string](where.exe npm 2>$null | Select-Object -First 1)
    if ($npmWhere) { return $npmWhere }
    return "npm"
}

# ===========================================================================
# 0. Require core tools (Naked PC Install Standard)
# ===========================================================================
Write-Host "[0/4] Checking required tools ..." -ForegroundColor Cyan
Require-Command "uv"   "astral-sh.uv"      "uv (Python package manager)"
Require-Command "node" "OpenJS.NodeJS.LTS" "Node.js LTS"
Require-Command "just" "Casey.Just"        "just (task runner)"
Write-Host ""

# ===========================================================================
# 1. Kill stale processes on our ports
# ===========================================================================
Write-Host "[1/4] Checking for port squatters on $WebPort and $BackendPort ..." -ForegroundColor Yellow
$stalePids = Get-NetTCPConnection -LocalPort $WebPort, $BackendPort -ErrorAction SilentlyContinue |
    Where-Object { $_.OwningProcess -gt 4 } |
    Select-Object -ExpandProperty OwningProcess -Unique
foreach ($p in $stalePids) {
    Write-Host "  Terminating PID $p ..." -ForegroundColor Red
    try { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue } catch { }
}

# ===========================================================================
# 2. Python deps
# ===========================================================================
Write-Host "[2/4] Syncing Python deps ..." -ForegroundColor Cyan
Set-Location $RepoRoot
uv sync
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: uv sync failed. Check pyproject.toml and your Python version." -ForegroundColor Red
    exit 1
}

# ===========================================================================
# 3. Start Backend (uvicorn: REST API + MCP stdio bridge)
# ===========================================================================
Write-Host "[3/4] Starting Backend (port $BackendPort) ..." -ForegroundColor Cyan
$backendCmd = "`$env:PYTHONPATH = '$RepoRoot\src'; Set-Location '$RepoRoot'; uv run uvicorn worldlabs_mcp.server:app --host 127.0.0.1 --port $BackendPort --log-level info"
$backendProc = Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -PassThru -WindowStyle Normal
Write-Host "  [ok] Backend PID: $($backendProc.Id)" -ForegroundColor DarkGreen

if ($BackendOnly) {
    Write-Host "Backend-only mode active. Press Ctrl+C to exit." -ForegroundColor Yellow
    Wait-Process -Id $backendProc.Id
    exit
}

# ===========================================================================
# 4. Start Frontend (web_sota, Vite dev server)
# ===========================================================================
Write-Host "[4/4] Starting Frontend (web_sota, port $WebPort) ..." -ForegroundColor Cyan
$webRoot = Join-Path $RepoRoot "web_sota"
Set-Location $webRoot

$npmCmd = Get-NpmCmdPath
if (-not (Test-Path (Join-Path $webRoot "node_modules"))) {
    Write-Host "  Installing npm dependencies ..." -ForegroundColor Yellow
    & $npmCmd install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: npm install failed. Check web_sota/package.json." -ForegroundColor Red
        exit 1
    }
}

# Poll-and-open browser once Vite is ready (SOTA standard)
if (-not $NoBrowser) {
    $frontendUrl = "http://127.0.0.1:$WebPort/"
    $pollAndOpen = "for (`$i = 0; `$i -lt 60; `$i++) { try { `$null = Invoke-WebRequest -Uri '$frontendUrl' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; Start-Process '$frontendUrl'; exit } catch { Start-Sleep -Seconds 1 } }"
    Start-Process powershell -ArgumentList "-NoProfile", "-WindowStyle", "Hidden", "-Command", $pollAndOpen
}

Write-Host ""
Write-Host "Startup complete. Backend :$BackendPort  Frontend :$WebPort" -ForegroundColor Green
Write-Host ""
& $npmCmd run dev -- --port $WebPort --host
_PortHelpers }
)

# --- SOTA Headless Standard 2026 ---
if ($Headless -and ($Host.Name -ne 'ConsoleHost' -or -not (Get-Variable -Name "NoRelaunch" -ErrorAction SilentlyContinue))) {
    $argList = @("-File", $PSCommandPath, "-NoRelaunch")
    if ($BackendOnly) { $argList += "-BackendOnly" }
    $argList += "-NoBrowser"
    Start-Process pwsh.exe -ArgumentList $argList -WindowStyle Hidden
    exit
}
# -----------------------------------

# Note: ErrorActionPreference left at default (Continue).
# We handle errors explicitly -- Stop mode causes winget's
# "already installed" exit codes to crash the script.
$RepoRoot     = $PSScriptRoot
$WebPort      = 10864
$BackendPort  = 10865

Write-Host ""
Write-Host "worldlabs-mcp - Setup and Start" -ForegroundColor Cyan
Write-Host "Backend  :$BackendPort   Frontend  :$WebPort" -ForegroundColor DarkGray
Write-Host ""

# ===========================================================================
# FUNCTION: Require-Command - install via winget if missing
# Naked PC Install Standard (fleet-wide).
# winget returns non-zero even for "already installed" -- we only care
# whether the command is available afterwards, not the exit code.
# ===========================================================================
function Require-Command {
    param([string]$Cmd, [string]$WingetId, [string]$Label)
    if (Get-Command $Cmd -ErrorAction SilentlyContinue) {
        Write-Host "  [ok] $Label" -ForegroundColor DarkGreen
        return
    }
    Write-Host "  [--] $Label not found - installing via winget ..." -ForegroundColor Yellow

    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if (-not $winget) {
        $candidates = @(
            "$env:LOCALAPPDATA\Microsoft\WindowsApps\winget.exe",
            "$env:PROGRAMFILES\WindowsApps\Microsoft.DesktopAppInstaller_*\winget.exe"
        )
        foreach ($c in $candidates) {
            $found = Get-Item $c -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($found) { $winget = $found.FullName; break }
        }
    } else {
        $winget = $winget.Source
    }

    if (-not $winget) {
        Write-Host "ERROR: winget not found. Install $Label manually:" -ForegroundColor Red
        Write-Host "  winget install --id $WingetId" -ForegroundColor Yellow
        exit 1
    }

    & $winget install --id $WingetId --silent --accept-source-agreements --accept-package-agreements
    # Refresh PATH -- winget installs into user PATH entries
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("PATH","User")
    if (-not (Get-Command $Cmd -ErrorAction SilentlyContinue)) {
        Write-Host "ERROR: $Label installed but '$Cmd' still not in PATH." -ForegroundColor Red
        Write-Host "Close this window, reopen PowerShell, and run start.bat again." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "  [ok] $Label installed" -ForegroundColor Green
}

# Helper: resolve npm.cmd reliably next to node.exe
function Get-NpmCmdPath {
    $nodeApp = Get-Command node -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    $nodeSrc = if ($nodeApp -and $nodeApp.Source -and ($nodeApp.Source -ne '')) { $nodeApp.Source } else { $null }
    if (-not $nodeSrc) {
        $nodeSrc = [string](where.exe node 2>$null | Select-Object -First 1)
    }
    if ($nodeSrc -and ($nodeSrc -ne '')) {
        $nodeDir = Split-Path -Path ([string]$nodeSrc) -Parent
        $cmd = Join-Path $nodeDir "npm.cmd"
        if (Test-Path -LiteralPath $cmd) { return $cmd }
    }
    $npmApp = Get-Command npm -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($npmApp -and $npmApp.Source -and ($npmApp.Source -ne '')) { return $npmApp.Source }
    $npmWhere = [string](where.exe npm 2>$null | Select-Object -First 1)
    if ($npmWhere) { return $npmWhere }
    return "npm"
}

# ===========================================================================
# 0. Require core tools (Naked PC Install Standard)
# ===========================================================================
Write-Host "[0/4] Checking required tools ..." -ForegroundColor Cyan
Require-Command "uv"   "astral-sh.uv"      "uv (Python package manager)"
Require-Command "node" "OpenJS.NodeJS.LTS" "Node.js LTS"
Require-Command "just" "Casey.Just"        "just (task runner)"
Write-Host ""

# ===========================================================================
# 1. Kill stale processes on our ports
# ===========================================================================
Write-Host "[1/4] Checking for port squatters on $WebPort and $BackendPort ..." -ForegroundColor Yellow
$stalePids = Get-NetTCPConnection -LocalPort $WebPort, $BackendPort -ErrorAction SilentlyContinue |
    Where-Object { $_.OwningProcess -gt 4 } |
    Select-Object -ExpandProperty OwningProcess -Unique
foreach ($p in $stalePids) {
    Write-Host "  Terminating PID $p ..." -ForegroundColor Red
    try { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue } catch { }
}

# ===========================================================================
# 2. Python deps
# ===========================================================================
Write-Host "[2/4] Syncing Python deps ..." -ForegroundColor Cyan
Set-Location $RepoRoot
uv sync
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: uv sync failed. Check pyproject.toml and your Python version." -ForegroundColor Red
    exit 1
}

# ===========================================================================
# 3. Start Backend (uvicorn: REST API + MCP stdio bridge)
# ===========================================================================
Write-Host "[3/4] Starting Backend (port $BackendPort) ..." -ForegroundColor Cyan
$backendCmd = "`$env:PYTHONPATH = '$RepoRoot\src'; Set-Location '$RepoRoot'; uv run uvicorn worldlabs_mcp.server:app --host 127.0.0.1 --port $BackendPort --log-level info"
$backendProc = Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -PassThru -WindowStyle Normal
Write-Host "  [ok] Backend PID: $($backendProc.Id)" -ForegroundColor DarkGreen

if ($BackendOnly) {
    Write-Host "Backend-only mode active. Press Ctrl+C to exit." -ForegroundColor Yellow
    Wait-Process -Id $backendProc.Id
    exit
}

# ===========================================================================
# 4. Start Frontend (web_sota, Vite dev server)
# ===========================================================================
Write-Host "[4/4] Starting Frontend (web_sota, port $WebPort) ..." -ForegroundColor Cyan
$webRoot = Join-Path $RepoRoot "web_sota"
Set-Location $webRoot

$npmCmd = Get-NpmCmdPath
if (-not (Test-Path (Join-Path $webRoot "node_modules"))) {
    Write-Host "  Installing npm dependencies ..." -ForegroundColor Yellow
    & $npmCmd install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: npm install failed. Check web_sota/package.json." -ForegroundColor Red
        exit 1
    }
}

# Poll-and-open browser once Vite is ready (SOTA standard)
if (-not $NoBrowser) {
    $frontendUrl = "http://127.0.0.1:$WebPort/"
    $pollAndOpen = "for (`$i = 0; `$i -lt 60; `$i++) { try { `$null = Invoke-WebRequest -Uri '$frontendUrl' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; Start-Process '$frontendUrl'; exit } catch { Start-Sleep -Seconds 1 } }"
    Start-Process powershell -ArgumentList "-NoProfile", "-WindowStyle", "Hidden", "-Command", $pollAndOpen
}

Write-Host ""
Write-Host "Startup complete. Backend :$BackendPort  Frontend :$WebPort" -ForegroundColor Green
Write-Host ""
& $npmCmd run dev -- --port $WebPort --host

