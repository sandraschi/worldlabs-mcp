# sync-mcpb-staging.ps1 - refresh the mcpb/ staging bundle from src/
# The mcpb/ dir is the pack root (manifest.json, pyproject.toml, assets/).
# Its src/worldlabs_mcp/ copy MUST be regenerated from the real source on
# every pack. Never hand-edit files under mcpb/src/.
param([string]$RepoRoot = (Split-Path -Parent $PSScriptRoot))

$ErrorActionPreference = 'Stop'
$srcPkg = Join-Path $RepoRoot 'src\worldlabs_mcp'
$dstSrc = Join-Path $RepoRoot 'mcpb\src'
$dstPkg = Join-Path $dstSrc 'worldlabs_mcp'

if (-not (Test-Path $srcPkg)) { throw "Source package not found: $srcPkg" }

# Nuke and recreate the staged package dir so deletions propagate too
if (Test-Path $dstPkg) { Remove-Item -Recurse -Force $dstPkg }
New-Item -ItemType Directory -Force -Path $dstPkg | Out-Null

Get-ChildItem $srcPkg -Filter '*.py' -File |
    Where-Object { $_.Name -notlike '*.bak' -and $_.Name -notmatch '_\d{8}_\d{6}' } |
    Copy-Item -Destination $dstPkg

# Remove any loose .py strays directly under mcpb/src/ (past duplication bug)
Get-ChildItem $dstSrc -Filter '*.py' -File -ErrorAction SilentlyContinue | Remove-Item -Force

# Keep staged pyproject version in lockstep with the root pyproject
$rootProj = Get-Content (Join-Path $RepoRoot 'pyproject.toml') -Raw
$ver = if ($rootProj -match '(?m)^version = "(.*)"') { $matches[1] } else { $null }
if ($ver) {
    $stagedProjPath = Join-Path $RepoRoot 'mcpb\pyproject.toml'
    $manifestPath = Join-Path $RepoRoot 'mcpb\manifest.json'
    (Get-Content $stagedProjPath -Raw) -replace '(?m)^version = ".*"', "version = `"$ver`"" |
        Set-Content $stagedProjPath -Encoding utf8 -NoNewline
    (Get-Content $manifestPath -Raw) -replace '"version": ".*?"', "`"version`": `"$ver`"" |
        Set-Content $manifestPath -Encoding utf8 -NoNewline
}

$count = (Get-ChildItem $dstPkg -Filter '*.py').Count
Write-Host "Staged $count package files into mcpb/src/worldlabs_mcp (version $ver)" -ForegroundColor Green
