param(
    [string]$InstallRoot = "$env:USERPROFILE\\Behring",
    [string]$ProjectSource = "",
    [switch]$SkipNpmInstall
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Assert-Command {
    param([string]$CommandName, [string]$HelpMessage)
    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        throw $HelpMessage
    }
}

function Ensure-Directory {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
    }
}

function Copy-If-Exists {
    param([string]$Source, [string]$Destination)
    if (Test-Path -LiteralPath $Source) {
        Copy-Item -LiteralPath $Source -Destination $Destination -Force
    }
}

Write-Step "Starting Behring setup scaffold"

if ([string]::IsNullOrWhiteSpace($ProjectSource)) {
    $ProjectSource = Split-Path -Parent $PSScriptRoot
    $ProjectSource = Split-Path -Parent $ProjectSource
}

$ManifestPath = Join-Path $PSScriptRoot "installer-manifest.json"
if (-not (Test-Path -LiteralPath $ManifestPath)) {
    throw "Installer manifest not found at $ManifestPath"
}

$Manifest = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json
$BaselinePath = Join-Path $ProjectSource $Manifest.active_baseline

if (-not (Test-Path -LiteralPath $BaselinePath)) {
    throw "Active baseline not found at $BaselinePath"
}

Assert-Command -CommandName "node" -HelpMessage "Node.js is required before setup can continue."
Assert-Command -CommandName "npm" -HelpMessage "npm is required before setup can continue."

Write-Step "Creating install directories"

$AppRoot = Join-Path $InstallRoot "app"
$RuntimeRoot = Join-Path $InstallRoot "runtime"
$RuntimeFlows = Join-Path $RuntimeRoot "flows"
$RuntimeNodeRed = Join-Path $RuntimeRoot ".node-red"
$RuntimeConfig = Join-Path $RuntimeRoot "config"

Ensure-Directory -Path $InstallRoot
Ensure-Directory -Path $AppRoot
Ensure-Directory -Path $RuntimeRoot
Ensure-Directory -Path $RuntimeFlows
Ensure-Directory -Path $RuntimeNodeRed
Ensure-Directory -Path $RuntimeConfig

Write-Step "Copying project files"

$AppFiles = @(
    "package.json",
    "package-lock.json",
    "node_modules",
    "config",
    "docs",
    "flows"
)

foreach ($Item in $AppFiles) {
    $SourcePath = Join-Path $ProjectSource $Item
    if (Test-Path -LiteralPath $SourcePath) {
        Copy-Item -LiteralPath $SourcePath -Destination $AppRoot -Recurse -Force
    }
}

Write-Step "Copying active baseline into runtime"

Copy-Item -LiteralPath (Join-Path $BaselinePath "reporting-flow.json") -Destination (Join-Path $RuntimeFlows "reporting-flow.json") -Force
Copy-Item -LiteralPath (Join-Path $BaselinePath "reporting-flow.json") -Destination (Join-Path $RuntimeNodeRed "flows.json") -Force
Copy-If-Exists -Source (Join-Path $BaselinePath "sample-input.json") -Destination (Join-Path $RuntimeRoot "sample-input.json")
Copy-If-Exists -Source (Join-Path $BaselinePath "sample-output.json") -Destination (Join-Path $RuntimeRoot "sample-output.json")

Write-Step "Preparing local environment template"

$EnvTemplatePath = Join-Path $AppRoot "config\\env.example"
$LocalEnvPath = Join-Path $RuntimeConfig ".env.local"

if (Test-Path -LiteralPath $EnvTemplatePath) {
    if (-not (Test-Path -LiteralPath $LocalEnvPath)) {
        Copy-Item -LiteralPath $EnvTemplatePath -Destination $LocalEnvPath -Force
    }
}

$LauncherPath = Join-Path $InstallRoot "Run-Behring.cmd"

Write-Step "Writing launcher wrapper"

$LauncherContent = @"
@echo off
setlocal
cd /d "%~dp0app"
echo Starting Behring Node-RED runtime...
echo.
echo Make sure your runtime environment variables are set before first live use.
node node_modules\node-red\red.js -u "%~dp0runtime\.node-red"
endlocal
"@

Set-Content -LiteralPath $LauncherPath -Value $LauncherContent -Encoding ASCII

if (-not $SkipNpmInstall) {
    Write-Step "Installing npm dependencies"
    Push-Location $AppRoot
    try {
        npm install
    } finally {
        Pop-Location
    }
} else {
    Write-Step "Skipping npm install by request"
}

Write-Step "Setup scaffold complete"

Write-Host "Install root: $InstallRoot" -ForegroundColor Green
Write-Host "Launcher: $LauncherPath" -ForegroundColor Green
Write-Host "Runtime env template: $LocalEnvPath" -ForegroundColor Green
Write-Host ""
Write-Host "This is the editable installer scaffold, not the final packaged exe yet." -ForegroundColor Yellow
