# cleanup.ps1 - Run once to finish repo cleanup
# Deletes backup files and the stale web/ directory
# Run from any directory: .\cleanup.ps1

$Root = "D:\Dev\repos\worldlabs-mcp"

Write-Host "worldlabs-mcp cleanup" -ForegroundColor Cyan

# 1. Delete stale web/ directory
$webDir = Join-Path $Root "web"
if (Test-Path $webDir) {
    Remove-Item -Path $webDir -Recurse -Force -ErrorAction SilentlyContinue
    if (Test-Path $webDir) {
        Write-Host "  web/ : LOCKED (close any apps using it, then re-run)" -ForegroundColor Yellow
    } else {
        Write-Host "  web/ : deleted" -ForegroundColor Green
    }
} else {
    Write-Host "  web/ : already gone" -ForegroundColor DarkGray
}

# 2. Delete all .bak and .backup files recursively
$staleFiles = Get-ChildItem -Path $Root -Recurse -Include "*.bak","*.backup" -File -ErrorAction SilentlyContinue
foreach ($f in $staleFiles) {
    Remove-Item -Path $f.FullName -Force -ErrorAction SilentlyContinue
    Write-Host "  Deleted: $($f.Name)" -ForegroundColor DarkGray
}

# 3. Delete test_results.txt (temp output)
$testResults = Join-Path $Root "test_results.txt"
if (Test-Path $testResults) {
    Remove-Item -Path $testResults -Force -ErrorAction SilentlyContinue
    Write-Host "  test_results.txt : deleted" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Cleanup done." -ForegroundColor Cyan
