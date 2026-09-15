# =============================================================================
#  setup.ps1  —  First-time setup for Daily Bible Journal Flutter app
#  Run this script once from PowerShell (admin NOT required)
# =============================================================================

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$SCRIPT_DIR  = Split-Path -Parent $MyInvocation.MyCommand.Path
$REACT_DIR   = "D:\Projects\Bible Journal"
$FLUTTER_DIR = "$SCRIPT_DIR"
$ASSETS_WEB  = "$FLUTTER_DIR\assets\web"
$NODE_EXE    = "C:\Users\MSI CYBORG I5\node-portable\node-v22.22.3-win-x64\node.exe"

Write-Host ""
Write-Host "======================================================" -ForegroundColor DarkYellow
Write-Host "  Daily Bible Journal — Flutter Setup" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor DarkYellow
Write-Host ""

# ── Step 1: Check / install Flutter ──────────────────────────────────────────
Write-Host "[1/6] Checking for Flutter..." -ForegroundColor Cyan
$flutterCmd = Get-Command flutter -ErrorAction SilentlyContinue
if ($flutterCmd) {
    Write-Host "      Flutter found: $($flutterCmd.Source)" -ForegroundColor Green
} else {
    Write-Host "      Flutter not found. Installing via winget..." -ForegroundColor Yellow
    Write-Host "      (Downloads ~600 MB — may take several minutes)" -ForegroundColor DarkGray

    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if (-not $winget) {
        Write-Host ""
        Write-Host "  winget not available. Install Flutter manually:" -ForegroundColor Red
        Write-Host "  https://docs.flutter.dev/get-started/install/windows" -ForegroundColor Yellow
        Write-Host "  Then re-run this script." -ForegroundColor Yellow
        exit 1
    }

    winget install --id Google.Flutter --accept-source-agreements --accept-package-agreements

    # Refresh PATH
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("PATH","User")

    $flutterCmd = Get-Command flutter -ErrorAction SilentlyContinue
    if (-not $flutterCmd) {
        Write-Host ""
        Write-Host "  Flutter installed but not on PATH yet." -ForegroundColor Yellow
        Write-Host "  Close this window, reopen PowerShell, and run setup.ps1 again." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "      Flutter installed successfully." -ForegroundColor Green
}

# ── Step 2: Scaffold with flutter create (generates Windows/Android boilerplate)
Write-Host ""
Write-Host "[2/6] Scaffolding Flutter project (generates platform boilerplate)..." -ForegroundColor Cyan
Write-Host "      This may ask to overwrite some files — answer 'y' to all." -ForegroundColor DarkGray

# Save our custom files BEFORE flutter create overwrites them
$customMainDart        = Get-Content "$FLUTTER_DIR\lib\main.dart" -Raw -ErrorAction SilentlyContinue
$customPubspec         = Get-Content "$FLUTTER_DIR\pubspec.yaml" -Raw -ErrorAction SilentlyContinue
$customAndroidManifest = Get-Content "$FLUTTER_DIR\android\app\src\main\AndroidManifest.xml" -Raw -ErrorAction SilentlyContinue
$customStyles          = Get-Content "$FLUTTER_DIR\android\app\src\main\res\values\styles.xml" -Raw -ErrorAction SilentlyContinue
$customColors          = Get-Content "$FLUTTER_DIR\android\app\src\main\res\values\colors.xml" -Raw -ErrorAction SilentlyContinue
$customMainActivity    = Get-Content "$FLUTTER_DIR\android\app\src\main\kotlin\com\example\bible_journal\MainActivity.kt" -Raw -ErrorAction SilentlyContinue
$customAppBuildGradle  = Get-Content "$FLUTTER_DIR\android\app\build.gradle" -Raw -ErrorAction SilentlyContinue

Push-Location $FLUTTER_DIR

# flutter create --overwrite regenerates all boilerplate (Windows runner C++ files,
# Gradle wrappers, etc.) while our custom files are saved in memory above.
flutter create --project-name bible_journal --org com.example --platforms android,windows --overwrite .

if ($LASTEXITCODE -ne 0) {
    Write-Host "  flutter create failed." -ForegroundColor Red
    Pop-Location; exit 1
}

# Restore our custom files
Write-Host "      Restoring custom app files..." -ForegroundColor DarkGray
if ($customMainDart)        { Set-Content "$FLUTTER_DIR\lib\main.dart" $customMainDart -Encoding utf8 }
if ($customPubspec)         { Set-Content "$FLUTTER_DIR\pubspec.yaml" $customPubspec -Encoding utf8 }
if ($customAndroidManifest) { Set-Content "$FLUTTER_DIR\android\app\src\main\AndroidManifest.xml" $customAndroidManifest -Encoding utf8 }
if ($customStyles)          { Set-Content "$FLUTTER_DIR\android\app\src\main\res\values\styles.xml" $customStyles -Encoding utf8 }
if ($customColors)          { Set-Content "$FLUTTER_DIR\android\app\src\main\res\values\colors.xml" $customColors -Encoding utf8 }
if ($customMainActivity)    { Set-Content "$FLUTTER_DIR\android\app\src\main\kotlin\com\example\bible_journal\MainActivity.kt" $customMainActivity -Encoding utf8 }
if ($customAppBuildGradle)  { Set-Content "$FLUTTER_DIR\android\app\build.gradle" $customAppBuildGradle -Encoding utf8 }

Pop-Location
Write-Host "      Scaffold complete." -ForegroundColor Green

# ── Step 3: Accept Android licenses ──────────────────────────────────────────
Write-Host ""
Write-Host "[3/6] Accepting Android SDK licenses..." -ForegroundColor Cyan
# Auto-accept all prompts
"y`ny`ny`ny`ny`ny`n" | flutter --no-version-check doctor --android-licenses 2>&1 | Out-Null
Write-Host "      Done." -ForegroundColor Green

# ── Step 4: Build the React web app ──────────────────────────────────────────
Write-Host ""
Write-Host "[4/6] Building React web app..." -ForegroundColor Cyan

if (-not (Test-Path $NODE_EXE)) {
    Write-Host "  Portable Node.js not found: $NODE_EXE" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path "$REACT_DIR\.env")) {
    Write-Host "  Missing $REACT_DIR\.env" -ForegroundColor Red
    Write-Host "  Copy .env.example → .env and set VITE_BIBLE_API_KEY" -ForegroundColor Yellow
    exit 1
}

Push-Location $REACT_DIR
& "$NODE_EXE" "$REACT_DIR\node_modules\vite\bin\vite.js" build --outDir dist
if ($LASTEXITCODE -ne 0) { Write-Host "React build failed." -ForegroundColor Red; Pop-Location; exit 1 }
Pop-Location
Write-Host "      React build succeeded." -ForegroundColor Green

# ── Step 5: Copy React dist → Flutter assets/web ─────────────────────────────
Write-Host ""
Write-Host "[5/6] Copying React build into Flutter assets..." -ForegroundColor Cyan
if (Test-Path $ASSETS_WEB) { Remove-Item -Recurse -Force $ASSETS_WEB }
New-Item -ItemType Directory -Force $ASSETS_WEB | Out-Null
Copy-Item -Recurse "$REACT_DIR\dist\*" "$ASSETS_WEB\" -Force
Write-Host "      Copied to: $ASSETS_WEB" -ForegroundColor Green

# ── Step 6: flutter pub get ───────────────────────────────────────────────────
Write-Host ""
Write-Host "[6/6] Running flutter pub get..." -ForegroundColor Cyan
Push-Location $FLUTTER_DIR
flutter pub get
if ($LASTEXITCODE -ne 0) { Write-Host "flutter pub get failed." -ForegroundColor Red; Pop-Location; exit 1 }
Pop-Location

# ── Done ─────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "======================================================" -ForegroundColor DarkGreen
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor DarkGreen
Write-Host ""
Write-Host "  Build commands:" -ForegroundColor White
Write-Host "    Both APK + Windows:  .\build.ps1" -ForegroundColor Cyan
Write-Host "    Android APK only:    .\build.ps1 -Target android" -ForegroundColor Cyan
Write-Host "    Windows .exe only:   .\build.ps1 -Target windows" -ForegroundColor Cyan
Write-Host ""
Write-Host "  flutter doctor (to check your environment):" -ForegroundColor White
Write-Host "    flutter doctor -v" -ForegroundColor Cyan
Write-Host ""
