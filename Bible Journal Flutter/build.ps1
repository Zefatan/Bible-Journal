# =============================================================================
#  build.ps1  —  Build Daily Bible Journal for Android and/or Windows
#
#  Usage:
#    .\build.ps1                   # build both APK and Windows
#    .\build.ps1 -Target android   # APK only
#    .\build.ps1 -Target windows   # Windows only
# =============================================================================

param(
    [ValidateSet("android","windows","both")]
    [string]$Target = "both"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$SCRIPT_DIR  = Split-Path -Parent $MyInvocation.MyCommand.Path
$REACT_DIR   = "D:\Projects\Bible Journal"
$FLUTTER_DIR = "$SCRIPT_DIR"
$ASSETS_WEB  = "$FLUTTER_DIR\assets\web"
$NODE_EXE    = "C:\Users\MSI CYBORG I5\node-portable\node-v22.22.3-win-x64\node.exe"
$OUT_DIR     = "$FLUTTER_DIR\output"

Write-Host ""
Write-Host "======================================================" -ForegroundColor DarkYellow
Write-Host "  Daily Bible Journal — Build Script" -ForegroundColor Yellow
Write-Host "  Target: $Target" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor DarkYellow
Write-Host ""

# ── Prerequisite checks ───────────────────────────────────────────────────────
$flutterCmd = Get-Command flutter -ErrorAction SilentlyContinue
if (-not $flutterCmd) {
    Write-Host "Flutter not found. Please run setup.ps1 first." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $NODE_EXE)) {
    Write-Host "Portable Node.js not found at: $NODE_EXE" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "$REACT_DIR\.env")) {
    Write-Host "Missing .env in $REACT_DIR — cannot build React app." -ForegroundColor Red
    exit 1
}

New-Item -ItemType Directory -Force $OUT_DIR | Out-Null

# ── Step 1: Build React app ───────────────────────────────────────────────────
Write-Host "[1] Building React web app..." -ForegroundColor Cyan
Push-Location $REACT_DIR
& "$NODE_EXE" "$REACT_DIR\node_modules\vite\bin\vite.js" build --outDir dist
if ($LASTEXITCODE -ne 0) { Write-Host "React build failed." -ForegroundColor Red; Pop-Location; exit 1 }
Pop-Location
Write-Host "    Done." -ForegroundColor Green

# ── Step 2: Sync React dist → Flutter assets/web ─────────────────────────────
Write-Host "[2] Syncing React build into Flutter assets..." -ForegroundColor Cyan
if (Test-Path $ASSETS_WEB) { Remove-Item -Recurse -Force $ASSETS_WEB }
New-Item -ItemType Directory -Force $ASSETS_WEB | Out-Null
Copy-Item -Recurse "$REACT_DIR\dist\*" "$ASSETS_WEB\" -Force
Write-Host "    Done." -ForegroundColor Green

Push-Location $FLUTTER_DIR

# ── Step 3: Build Android APK ─────────────────────────────────────────────────
if ($Target -eq "android" -or $Target -eq "both") {
    Write-Host ""
    Write-Host "[3] Building Android APK (release)..." -ForegroundColor Cyan
    Write-Host "    (First build can take 5–15 minutes while Gradle downloads)" -ForegroundColor DarkGray
    flutter build apk --release
    if ($LASTEXITCODE -ne 0) {
        Write-Host "    Android build FAILED." -ForegroundColor Red
        Pop-Location; exit 1
    }
    $apkSrc = "$FLUTTER_DIR\build\app\outputs\flutter-apk\app-release.apk"
    $apkDst = "$OUT_DIR\BibleJournal-release.apk"
    if (Test-Path $apkSrc) {
        Copy-Item $apkSrc $apkDst -Force
        $size = [math]::Round((Get-Item $apkDst).Length / 1MB, 1)
        Write-Host "    APK ready: $apkDst ($size MB)" -ForegroundColor Green
    }
}

# ── Step 4: Build Windows executable ─────────────────────────────────────────
if ($Target -eq "windows" -or $Target -eq "both") {
    Write-Host ""
    Write-Host "[4] Building Windows release..." -ForegroundColor Cyan
    flutter build windows --release
    if ($LASTEXITCODE -ne 0) {
        Write-Host "    Windows build FAILED." -ForegroundColor Red
        Pop-Location; exit 1
    }

    $winRelDir = "$FLUTTER_DIR\build\windows\x64\runner\Release"
    $winOutDir = "$OUT_DIR\BibleJournal-Windows"

    if (Test-Path $winOutDir) { Remove-Item -Recurse -Force $winOutDir }
    if (Test-Path $winRelDir) {
        Copy-Item -Recurse $winRelDir $winOutDir -Force
        Write-Host "    Windows build ready: $winOutDir" -ForegroundColor Green
        Write-Host "    Run:  $winOutDir\bible_journal.exe" -ForegroundColor White

        # ── Optional: create a simple installer using NSIS (if installed) ────
        $nsisExe = Get-Command makensis -ErrorAction SilentlyContinue
        if ($nsisExe) {
            Write-Host "    NSIS found — generating installer..." -ForegroundColor Cyan
            $nsisScript = "$FLUTTER_DIR\installer.nsi"
            if (Test-Path $nsisScript) {
                makensis $nsisScript
                Write-Host "    Installer created." -ForegroundColor Green
            }
        } else {
            Write-Host "    (NSIS not found — skipping installer. Install NSIS to generate a .exe installer)" -ForegroundColor DarkGray
        }
    } else {
        Write-Host "    Windows build output not found at $winRelDir" -ForegroundColor Yellow
    }
}

Pop-Location

Write-Host ""
Write-Host "======================================================" -ForegroundColor DarkGreen
Write-Host "  Build complete! Outputs in: $OUT_DIR" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor DarkGreen
Write-Host ""
