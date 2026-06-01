# Download Marble world thumbnails into marble-adventure/worlds/
param(
    [string]$WorldlabsUrl = "http://127.0.0.1:10865",
    [string]$OutDir = "$PSScriptRoot\marble-adventure\worlds"
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$ids = Get-Content "$PSScriptRoot\world_ids.json" | ConvertFrom-Json
foreach ($prop in $ids.PSObject.Properties) {
    $slug = $prop.Name
    $worldId = $prop.Value
    Write-Host "Fetching $slug ($worldId)..."
    try {
        $body = @{ arguments = @{ operation = "get"; world_id = $worldId } } | ConvertTo-Json -Compress
        $resp = Invoke-WebRequest -Uri "$WorldlabsUrl/api/tools/worldlabs_world/call" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 60
        $json = $resp.Content | ConvertFrom-Json
        $data = $json.data
        if (-not $data.success) {
            Write-Host "  SKIP: $($data.message)" -ForegroundColor Yellow
            continue
        }
        $world = $data.data
        $thumb = $world.assets.thumbnail_url
        if (-not $thumb) {
            $thumb = $world.assets.thumbnail
        }
        if (-not $thumb) {
            Write-Host "  SKIP: no thumbnail_url" -ForegroundColor Yellow
            continue
        }
        $out = Join-Path $OutDir "${slug}_thumb.webp"
        Invoke-WebRequest -Uri $thumb -OutFile $out -UseBasicParsing -TimeoutSec 120
        Write-Host "  OK: $out" -ForegroundColor Green
    } catch {
        Write-Host "  FAIL: $_" -ForegroundColor Red
    }
}

Write-Host "Done. Restart Godot hub to refresh previews."
