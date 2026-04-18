# demo-narration.ps1
# Demonstrates the Spatial Voice Agent by broadcasting a series of localized narrations.

$bridgeUrl = "http://localhost:10718/api/narration"

$events = @(
    @{ text = "Welcome to the Modern Tropical Luxury Residence. I am your Spatial Intelligence Guide."; x = 0; y = 1.6; z = 2 },
    @{ text = "To your left, note the floor-to-ceiling glass panels which World Labs has reconstructed with high-fidelity transparency."; x = -4; y = 1.6; z = 0 },
    @{ text = "Step out onto the balcony to experience the progressive Level-of-Detail streaming in the distant foliage."; x = 0; y = 1.6; z = -8 }
)

Write-Host " [SPATIAL VOICE] Initializing Gemini 3.1 Pro Narration Sequence..." -ForegroundColor Cyan

foreach ($event in $events) {
    Write-Host " [BROADCAST] Panning voice to [$($event.x), $($event.y), $($event.z)]..." -ForegroundColor Gray
    Write-Host " [TEXT]      $($event.text)" -ForegroundColor DarkGray
    
    $payload = $event | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri $bridgeUrl -Method Post -Body $payload -ContentType "application/json" | Out-Null
    } catch {
        Write-Error "Failed to broadcast. Ensure the WorldLabs Bridge is running on port 10865."
    }
    
    Start-Sleep -Seconds 5
}

Write-Host "`n [SUCCESS] Spatial demo completed." -ForegroundColor Green
