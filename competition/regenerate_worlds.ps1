# Regenerate Marble worlds from WORLD_PROMPTS.md metadata (author machine)
param(
    [string]$Portal = "",
    [string]$WorldlabsUrl = "http://127.0.0.1:10865",
    [string]$MetaJson = "$PSScriptRoot\marble-adventure\data\portal_meta.json",
    [string]$PortalsJson = "$PSScriptRoot\marble-adventure\data\portals.json"
)

$ErrorActionPreference = "Stop"

# Prompt bodies live in WORLD_PROMPTS.md - this script uses embedded map for automation.
$Prompts = @{
    gothic_cathedral = @"
Grand Gothic cathedral interior, soaring nave with ribbed vaults and clustered columns.
Rose windows casting colored god rays through incense haze.
Wet limestone floor reflecting amber candlelight.
Wide establishing shot from the crossing, strong vertical lines.
Marble Adventure gallery world. No people, no readable text, no UI.
"@
    cyberpunk_alley = @"
Rain-slick cyberpunk backstreet at night, narrow alley between towering buildings.
Neon signs in magenta, cyan, and acid green reflecting in puddles.
Steam vents, tangled cables, holographic ad panels.
Marble Adventure gallery world. No people, no readable text, no UI.
"@
    sea_of_fog = @"
Romantic landscape above an infinite sea of fog, Caspar Friedrich sublime mood.
Silent valley peaks emerging from white mist, soft sunrise gradient.
Wide vista, contemplative scale.
Marble Adventure gallery world. No people, no readable text, no UI.
"@
    wonderland = @"
Surreal dreamscape of floating bioluminescent islands, impossible stairways.
Escher-like geometry blended with Gaudi organic stone forms.
Marble Adventure gallery world. No people, no readable text, no UI.
"@
    japanese_temple = @"
Japanese temple garden in late autumn, vermilion maple canopy over mossy stone.
Koi pond with still reflections, wooden engawa, paper lantern warm glow.
Marble Adventure gallery world. No people, no readable text, no UI.
"@
    deep_forest = @"
Ancient redwood forest cathedral, dappled green-gold light through canopy.
Moss-covered stone ruins, volumetric light shafts.
Marble Adventure gallery world. No people, no readable text, no UI.
"@
    midcentury_villa = @"
Midcentury modernist villa at golden hour, infinity pool merging with tropical sky.
Concrete, glass, and teak; palm shadows on white walls.
Marble Adventure gallery world. No people, no readable text, no UI.
"@
    underwater_ruins = @"
Submerged Greco-Roman ruins on the ocean floor, bioluminescent coral and kelp.
God rays piercing turquoise water, marble columns and broken archways.
Marble Adventure gallery world. No people, no readable text, no UI.
"@
}

$portalsConfig = Get-Content $PortalsJson -Raw | ConvertFrom-Json
$targets = @($portalsConfig.portals)
if ($Portal) {
    $targets = @($targets | Where-Object { $_.id -eq $Portal })
    if ($targets.Count -eq 0) { throw "Unknown portal id: $Portal" }
}

Write-Host "Regenerating $($targets.Count) world(s) via $WorldlabsUrl"
Write-Host "Requires worldlabs-mcp serve + WORLDLABS_API_KEY in env."
Write-Host ""

foreach ($p in $targets) {
    $id = $p.id
    if (-not $Prompts.ContainsKey($id)) {
        Write-Host "SKIP $id - no prompt in script map" -ForegroundColor Yellow
        continue
    }
    Write-Host "Generating $id ($($p.label))..."
    $prompt = $Prompts[$id].Trim()
    try {
        $body = @{
            arguments = @{
                operation = "generate"
                prompt    = $prompt
                model     = "marble-1.1"
            }
        } | ConvertTo-Json -Depth 5 -Compress
        $resp = Invoke-WebRequest -Uri "$WorldlabsUrl/api/tools/worldlabs_world/call" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 600
        $json = $resp.Content | ConvertFrom-Json
        $data = $json.data
        if (-not $data.success) {
            Write-Host "  FAIL: $($data.message)" -ForegroundColor Red
            continue
        }
        $worldId = $data.data.id
        if (-not $worldId) { $worldId = $data.data.world_id }
        Write-Host "  OK marble_id=$worldId" -ForegroundColor Green
        Write-Host "  Update portals.json id=$id marble_id=$worldId"
    } catch {
        Write-Host "  FAIL: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Next: update marble_id in portals.json, then just marble-adventure-thumbs"
