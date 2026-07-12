# install-mcp-clients.ps1 - Register worldlabs-mcp in Cursor / Claude Desktop
param([switch]$Interactive)
$ErrorActionPreference = "Stop"
$Port = 10865
$Url = "http://127.0.0.1:$Port/mcp"
$ServerName = "worldlabs-mcp"

function Write-Step { param($Msg) Write-Host ">> $Msg" -ForegroundColor Cyan }

# Cursor config
$cursorConfig = "$env:USERPROFILE\.cursor\mcp.json"
if (Test-Path $cursorConfig) {
    try {
        $cfg = Get-Content $cursorConfig -Raw | ConvertFrom-Json
        if (-not $cfg.mcpServers) { $cfg.mcpServers = @{} }
        if (-not $cfg.mcpServers.$ServerName) {
            $cfg.mcpServers | Add-Member -MemberType NoteProperty -Name $ServerName -Value @{ url = $Url }
            $cfg | ConvertTo-Json -Depth 10 | Set-Content $cursorConfig -Encoding utf8
            Write-Step "Registered in Cursor: $cursorConfig"
        } else {
            Write-Step "Cursor: $ServerName already registered."
        }
    } catch {
        Write-Host "  Cursor config update failed: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Cursor config not found at $cursorConfig - skipping." -ForegroundColor DarkGray
}

# Claude Desktop config
$claudeConfig = "$env:APPDATA\Claude\claude_desktop_config.json"
if (Test-Path $claudeConfig) {
    try {
        $cfg = Get-Content $claudeConfig -Raw | ConvertFrom-Json
        if (-not $cfg.mcpServers) { $cfg.mcpServers = @{} }
        if (-not $cfg.mcpServers.$ServerName) {
            $cfg.mcpServers | Add-Member -MemberType NoteProperty -Name $ServerName -Value @{ url = $Url }
            $cfg | ConvertTo-Json -Depth 10 | Set-Content $claudeConfig -Encoding utf8
            Write-Step "Registered in Claude Desktop: $claudeConfig"
        } else {
            Write-Step "Claude Desktop: $ServerName already registered."
        }
    } catch {
        Write-Host "  Claude Desktop config update failed: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Claude Desktop config not found at $claudeConfig - skipping." -ForegroundColor DarkGray
}

if ($Interactive) {
    Write-Host ""
    Write-Host "MCP client registration complete. The server is reachable while the operator is running." -ForegroundColor Green
    Start-Sleep 3
}
