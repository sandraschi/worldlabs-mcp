$Root = Split-Path -Parent $PSScriptRoot
$RepoName = "worldlabs-mcp"
$Triple = "x86_64-pc-windows-msvc"
$ResourceDir = "$PSScriptRoot\resources"
$DevDir = "$PSScriptRoot\binaries"

# Step 1: React frontend
Push-Location "$Root\web_sota"
npm install
npm run build
Pop-Location

# Step 2: PyInstaller backend (onefile)
Push-Location "$Root"
if (Test-Path "run_server.py") {
    uv run pyinstaller "${RepoName}-backend.spec" --clean --noconfirm
}
Pop-Location

# Step 3: Embed in Tauri resources (+ dev fallback)
New-Item -ItemType Directory -Force -Path $ResourceDir, $DevDir | Out-Null
$backendExe = Get-ChildItem -Path "$Root\dist" -Filter "${RepoName}-backend.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($backendExe) {
    Copy-Item $backendExe.FullName "$ResourceDir\${RepoName}-backend.exe" -Force
    Copy-Item $backendExe.FullName "$DevDir\${RepoName}-backend-$Triple.exe" -Force
    Write-Host "Backend copied: $($backendExe.Name)"
} else {
    Write-Host "WARNING: Backend .exe not found in dist/ — build PyInstaller spec first" -ForegroundColor Yellow
}
