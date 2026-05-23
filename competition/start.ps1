# Marble Adventure — Launch Pipeline
# Starts Godot game + godot-mcp bridge + worldlabs-mcp backend
# Required for full MCP-orchestrated world import workflow
param(
    [string]$GodotExe = "C:\Users\sandr\.local\bin\godot.exe"
)

$ErrorActionPreference = "Stop"

# ─── Ports ────────────────────────────────────────────────────
$GodotBridgePort = 9080       # Godot TCP bridge (mcp_bridge.gd)
$GodotMcpPort    = 10993      # godot-mcp backend
$WorldLabsPort   = 10865      # worldlabs-mcp backend

# ─── Clear port zombies ───────────────────────────────────────
foreach ($port in @($GodotBridgePort, $GodotMcpPort, $WorldLabsPort)) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) {
        Write-Host "[start] Killing zombie on port $port (PID $($conn[0].OwningProcess))"
        Stop-Process -Id $conn[0].OwningProcess -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
}

# ─── Launch Godot (game + bridge) ────────────────────────────
$ProjectDir = "$PSScriptRoot\marble-adventure"
Write-Host "[start] Launching Godot: $ProjectDir"
Start-Process -FilePath $GodotExe -ArgumentList "--editor", "--path", "`"$ProjectDir`"" -WindowStyle Normal

# Wait for Godot bridge to come online
Write-Host "[start] Waiting for Godot bridge on port $GodotBridgePort..."
$sw = [System.Diagnostics.Stopwatch]::StartNew()
while ($sw.Elapsed.TotalSeconds -lt 30) {
    $conn = Get-NetTCPConnection -LocalPort $GodotBridgePort -ErrorAction SilentlyContinue
    if ($conn) {
        Write-Host "[start] Godot bridge ready (port $GodotBridgePort)"
        break
    }
    Start-Sleep -Seconds 1
}

# ─── Launch godot-mcp ────────────────────────────────────────
$GodotMcpDir = "D:\Dev\repos\godot-mcp"
Write-Host "[start] Launching godot-mcp backend on port $GodotMcpPort"
Start-Process -FilePath "pwsh" -ArgumentList "-NoExit", "-Command", "cd '$GodotMcpDir'; .venv\Scripts\python.exe -m godot_mcp.server" -WindowStyle Minimized

# Wait for godot-mcp to come online
Write-Host "[start] Waiting for godot-mcp on port $GodotMcpPort..."
Start-Sleep -Seconds 3

$sw.Restart()
while ($sw.Elapsed.TotalSeconds -lt 15) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:$GodotMcpPort/health" -Method Get -TimeoutSec 2 -ErrorAction Stop
        if ($r.StatusCode -eq 200) {
            Write-Host "[start] godot-mcp ready (port $GodotMcpPort)"
            break
        }
    } catch {}
    Start-Sleep -Seconds 1
}

# ─── Launch worldlabs-mcp ────────────────────────────────────
$WorldlabsDir = "D:\Dev\repos\worldlabs-mcp"
Write-Host "[start] Launching worldlabs-mcp backend on port $WorldLabsPort"
Start-Process -FilePath "pwsh" -ArgumentList "-NoExit", "-Command", "cd '$WorldlabsDir'; .venv\Scripts\python.exe -m worldlabs_mcp.server" -WindowStyle Minimized

# Wait for worldlabs-mcp to come online
Write-Host "[start] Waiting for worldlabs-mcp on port $WorldLabsPort..."
Start-Sleep -Seconds 3

$sw.Restart()
while ($sw.Elapsed.TotalSeconds -lt 15) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:$WorldLabsPort/health" -Method Get -TimeoutSec 2 -ErrorAction Stop
        if ($r.StatusCode -eq 200) {
            Write-Host "[start] worldlabs-mcp ready (port $WorldLabsPort)"
            break
        }
    } catch {}
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "==========================================="
Write-Host " Pipeline Ready"
Write-Host "==========================================="
Write-Host " Godot game + bridge : port $GodotBridgePort"
Write-Host " godot-mcp backend   : port $GodotMcpPort"
Write-Host " worldlabs-mcp       : port $WorldLabsPort"
Write-Host "==========================================="
Write-Host ""
Write-Host "Next: use MCP tools to generate worlds and import into Godot"
