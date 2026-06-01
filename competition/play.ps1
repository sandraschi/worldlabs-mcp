# Marble Adventure — player launch (public mode, no World Labs account required)

param(
    [string]$GodotExe = "C:\Users\sandr\.local\bin\godot.exe",
    [ValidateSet("public_marble", "local_spark", "public_cdn_spark")]
    [string]$AccessMode = "public_marble"
)

$ErrorActionPreference = "Stop"
$ProjectDir = Join-Path $PSScriptRoot "marble-adventure"
$EnvFile = Join-Path $PSScriptRoot ".env"

if (Test-Path $EnvFile) {
    Write-Host "[play] Loading $EnvFile"
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq "" -or $line.StartsWith("#")) { return }
        $parts = $line -split "=", 2
        if ($parts.Count -eq 2) {
            $name = $parts[0].Trim()
            $value = $parts[1].Trim().Trim('"')
            Set-Item -Path "Env:$name" -Value $value
            if ($name -eq "MARBLE_ACCESS_MODE" -and $AccessMode -eq "public_marble") {
                $AccessMode = $value
            }
        }
    }
}

$env:MARBLE_ACCESS_MODE = $AccessMode

if ($AccessMode -eq "local_spark") {
    Write-Host "[play] Starting worldlabs-mcp (required for local Spark)..."
    $WorldlabsDir = "D:\Dev\repos\worldlabs-mcp"
    Start-Process pwsh -ArgumentList "-NoExit", "-Command", "Set-Location '$WorldlabsDir'; just serve" -WindowStyle Minimized
    Start-Sleep -Seconds 4
}

Write-Host "[play] Marble Adventure — access mode: $AccessMode"
if ($env:SPARK_BASE_URL) {
    Write-Host "[play] SPARK_BASE_URL=$($env:SPARK_BASE_URL)"
}
Write-Host "[play] $($ProjectDir)"
Start-Process -FilePath $GodotExe -ArgumentList "--path", "`"$ProjectDir`""
