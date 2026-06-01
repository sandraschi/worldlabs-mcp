# Marble Adventure — Windows export + optional Butler push to itch.io
# Safe defaults: hidden channel, no push unless -Push

param(
    [string]$GodotExe = "C:\Users\sandr\.local\bin\godot.exe",
    [string]$ItchTarget = "sandraschi/marble-adventure",
    [string]$Channel = "win",
    [string]$UserVersion = "0.1.0-prototype",
    [switch]$ExportOnly,
    [switch]$Preview,
    [switch]$Push,
    [switch]$PublicChannel
)

$ErrorActionPreference = "Stop"
$CompetitionDir = $PSScriptRoot
$ProjectDir = Join-Path $CompetitionDir "marble-adventure"
$UploadDir = Join-Path $CompetitionDir "build\windows"
$ExePath = Join-Path $UploadDir "MarbleAdventure.exe"
$EnvFile = Join-Path $CompetitionDir ".env"

function Load-DotEnv {
    param([string]$Path)
    if (-not (Test-Path $Path)) { return }
    Write-Host "[ship] Loading $Path"
    Get-Content $Path | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq "" -or $line.StartsWith("#")) { return }
        $parts = $line -split "=", 2
        if ($parts.Count -eq 2) {
            $name = $parts[0].Trim()
            $value = $parts[1].Trim().Trim('"')
            $hash = $value.IndexOf('#')
            if ($hash -ge 0) {
                $value = $value.Substring(0, $hash).Trim()
            }
            Set-Item -Path "Env:$name" -Value $value
        }
    }
}

function Find-Butler {
    if ($env:BUTLER_PATH -and (Test-Path $env:BUTLER_PATH)) {
        return $env:BUTLER_PATH
    }
    $cmd = Get-Command butler.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $cmd = Get-Command butler -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $appdata = $env:APPDATA
    if ($appdata) {
        $chosen = Join-Path $appdata "itch\broth\butler\.chosen-version"
        if (Test-Path $chosen) {
            $version = (Get-Content $chosen -Raw).Trim()
            $candidate = Join-Path $appdata "itch\broth\butler\versions\$version\butler.exe"
            if (Test-Path $candidate) { return $candidate }
        }
    }
    return $null
}

Load-DotEnv $EnvFile

if ($env:ITCH_TARGET) { $ItchTarget = $env:ITCH_TARGET }
if ($env:ITCH_CHANNEL_WIN) { $Channel = $env:ITCH_CHANNEL_WIN }

New-Item -ItemType Directory -Force -Path $UploadDir | Out-Null

Write-Host "[ship] Exporting Windows build..."
Write-Host "[ship] Project: $ProjectDir"
Write-Host "[ship] Output:  $ExePath"

& $GodotExe --headless --path $ProjectDir --export-release "Windows Desktop" $ExePath
$godotExit = $LASTEXITCODE

if (-not (Test-Path $ExePath)) {
    throw "Export failed — MarbleAdventure.exe missing. Run: cd D:\Dev\repos\godot-mcp; just install-export-templates"
}
if ($godotExit -ne 0) {
    Write-Host "[ship] Godot exited $godotExit (warnings may be harmless if exe exists)" -ForegroundColor Yellow
}

Write-Host "[ship] Export OK" -ForegroundColor Green
Get-ChildItem $UploadDir | ForEach-Object { Write-Host "  $($_.Name) ($([math]::Round($_.Length/1MB, 2)) MB)" }

if ($ExportOnly) {
    Write-Host "[ship] Export-only complete."
    exit 0
}

$butler = Find-Butler
if (-not $butler) {
    throw "Butler not found — install from https://itchio.itch.io/butler or itch app"
}

$ref = "$ItchTarget`:$Channel"
$hiddenFlag = -not $PublicChannel

if ($Preview -or -not $Push) {
    Write-Host "[ship] Preview push -> $ref"
    & $butler push-preview $UploadDir $ref
}

if (-not $Push) {
    Write-Host ""
    Write-Host "[ship] No upload yet. To push (hidden channel):" -ForegroundColor Yellow
    Write-Host "  .\ship-itch.ps1 -Push"
    Write-Host ""
    Write-Host "Set BUTLER_API_KEY in competition\.env first."
    exit 0
}

if (-not $env:BUTLER_API_KEY) {
    throw "BUTLER_API_KEY not set — add to competition\.env (never commit)"
}

Write-Host "[ship] Pushing to $ref (hidden=$hiddenFlag, version=$UserVersion)"

$pushArgs = @("push", "--userversion", $UserVersion)
if ($hiddenFlag) { $pushArgs += "--hidden" }
$pushArgs += @($UploadDir, $ref)

& $butler @pushArgs
if ($LASTEXITCODE -ne 0) {
    throw "butler push failed (exit $LASTEXITCODE)"
}

$page = "https://$($ItchTarget.Split('/')[0]).itch.io/$($ItchTarget.Split('/')[1])"
Write-Host ""
Write-Host "[ship] Push OK" -ForegroundColor Green
Write-Host "[ship] Page: $page"
if ($hiddenFlag) {
    Write-Host "[ship] Channel is HIDDEN — unhide in Edit game -> Uploads when ready." -ForegroundColor Cyan
}
Write-Host "[ship] Keep project in DRAFT until you publish the page." -ForegroundColor Cyan
