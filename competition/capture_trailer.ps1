# Launch Marble Adventure and print trailer capture checklist
param(
    [string]$GodotExe = "C:\Users\sandr\.local\bin\godot.exe"
)

$ErrorActionPreference = "Stop"
$MarketingDir = Join-Path $PSScriptRoot "marketing"
New-Item -ItemType Directory -Force -Path $MarketingDir | Out-Null

Write-Host ""
Write-Host "=== Marble Adventure — trailer capture ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start OBS or ShareX screen recorder (1920x1080)"
Write-Host "2. Run play.ps1 in public_marble mode"
Write-Host "3. Follow shot list in marketing/README.md"
Write-Host "4. Save raw video as marketing/trailer_raw.mp4"
Write-Host "5. Convert with ffmpeg (command in marketing/README.md)"
Write-Host ""
Write-Host "Opening game..."
Write-Host ""

& (Join-Path $PSScriptRoot "play.ps1") -GodotExe $GodotExe -AccessMode public_marble
