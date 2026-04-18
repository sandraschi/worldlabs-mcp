# view-residence.ps1
# Launches the SOTA Dashboard specifically loaded with the local Tropical Luxury Residence asset.

$worldName = "Modern Tropical Luxury Residence"
$localUrl = "/api/local-assets/Modern Tropical Luxury Residence.spz"
$viewerUrl = "http://localhost:10864/spark-viewer?url=$([uri]::EscapeDataString($localUrl))&name=$([uri]::EscapeDataString($worldName))"

Write-Host " [WORLDLABS] Launching Spark 2.0 High-Fidelity Viewer..." -ForegroundColor Cyan
Write-Host " [ASSET]    $worldName" -ForegroundColor Gray
Write-Host " [PATH]     $localUrl" -ForegroundColor Gray

Start-Process $viewerUrl
