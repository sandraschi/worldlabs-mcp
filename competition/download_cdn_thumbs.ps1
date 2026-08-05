# Download Marble CDN thumbnails into marble-adventure/worlds/ (no API key)
param(
    [string]$PortalsJson = "$PSScriptRoot\marble-adventure\data\portals.json",
    [string]$OutDir = "$PSScriptRoot\marble-adventure\worlds"
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$config = Get-Content $PortalsJson -Raw | ConvertFrom-Json
$cdnBase = $config.cdn_base.TrimEnd("/")

foreach ($portal in $config.portals) {
    $slug = $portal.id
    $uuid = $portal.marble_id
    Write-Host "Fetching $slug ($uuid)..."

    $urls = @(
        "$cdnBase/$uuid/thumbnail.jpg",
        "$cdnBase/$uuid/thumb.jpg",
        "$cdnBase/$uuid/pano.jpg"
    )

    $saved = $false
    foreach ($url in $urls) {
        try {
            $out = Join-Path $OutDir "${slug}_thumb.jpg"
            Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing -TimeoutSec 60
            if ((Get-Item $out).Length -gt 1024) {
                Write-Host "  OK: $out" -ForegroundColor Green
                $saved = $true
                break
            }
            Remove-Item $out -Force
        } catch {
            Write-Host "  try: $url - $($_.Exception.Message)" -ForegroundColor DarkGray
        }
    }

    if (-not $saved) {
        Write-Host "  SKIP: no CDN thumbnail for $slug" -ForegroundColor Yellow
    }
}

Write-Host "Done. Thumbs in $OutDir"
