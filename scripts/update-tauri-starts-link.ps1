# update-tauri-starts-link.ps1 - Create/refresh D:\Dev\Tauri starts\worldlabs-mcp-setup.lnk
param(
    [string]$InstallerPath = ""
)

$ErrorActionPreference = "Stop"
$RepoName = "worldlabs-mcp"
$StartsDir = "D:\Dev\Tauri starts"
$LnkPath = Join-Path $StartsDir "$RepoName-setup.lnk"

if (-not $InstallerPath) {
    $NativeDir = Join-Path $PSScriptRoot ".." "native"
    $nsisDir = Join-Path $NativeDir "target" "release" "bundle" "nsis"
    $candidates = Get-ChildItem -Path $nsisDir -Filter "*_x64-setup.exe" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
    if (-not $candidates) { throw "No NSIS installer found under $nsisDir" }
    $InstallerPath = $candidates[0].FullName
}

if (-not (Test-Path $InstallerPath)) { throw "Installer not found at $InstallerPath" }

# Ensure target dir exists
if (-not (Test-Path $StartsDir)) { New-Item -ItemType Directory -Path $StartsDir -Force | Out-Null }

$sh = New-Object -ComObject WScript.Shell
$sc = $sh.CreateShortcut($LnkPath)
$sc.TargetPath = (Resolve-Path $InstallerPath).Path
$sc.WorkingDirectory = (Get-Item $InstallerPath).DirectoryName
$sc.Description = "Latest $RepoName NSIS installer"
$sc.Save()

Write-Host "Created $LnkPath → $InstallerPath" -ForegroundColor Green
