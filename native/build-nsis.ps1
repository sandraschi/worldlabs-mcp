#Requires -Version 5.1
<#
.SYNOPSIS
Tauri NSIS desktop build (called by `just build-native` after build-sidecar).

Why a file and not justfile lines: just runs each recipe line in its own
shell, so $env:Path/vcvars exports on one line never reach the next line's
`npx tauri build` ("cargo metadata: program not found", 2026-10-14). One
process here owns the whole environment. cargo auto-detects the VS 2022
toolchain - no vcvars needed.
#>
$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"
if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    throw "cargo not found even with $env:USERPROFILE\.cargo\bin on PATH"
}
Set-Location (Join-Path $RepoRoot 'native')
npx @tauri-apps/cli build --bundles nsis
if ($LASTEXITCODE -ne 0) { throw "Tauri NSIS build failed with exit code $LASTEXITCODE" }
