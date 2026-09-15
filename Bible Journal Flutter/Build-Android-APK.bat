@echo off
setlocal EnableDelayedExpansion
title Build Android APK — Daily Bible Journal
color 2F

set "FLUTTER_DIR=%~dp0"
set "FLUTTER_DIR=%FLUTTER_DIR:~0,-1%"
set "REACT_DIR=D:\Projects\Bible Journal"
set "NODE=C:\Users\MSI CYBORG I5\node-portable\node-v22.22.3-win-x64\node.exe"
set "ASSETS_WEB=%FLUTTER_DIR%\assets\web"
set "OUTPUT=%FLUTTER_DIR%\output"

echo.
echo  ============================================================
echo   Daily Bible Journal — Android APK Builder
echo  ============================================================
echo.

:: ── Step 1: Check Flutter ────────────────────────────────────────────────────
echo  [1/6] Checking Flutter...
where flutter >nul 2>&1
if not errorlevel 1 goto :flutter_ok

echo        Flutter not found. Installing via winget...
echo        (Downloads ~600 MB — may take several minutes)
winget install --id Google.Flutter --accept-source-agreements --accept-package-agreements
if errorlevel 1 (
    echo.
    echo        winget install failed. Install Flutter manually:
    echo        https://docs.flutter.dev/get-started/install/windows
    echo        Add Flutter to PATH, then re-run this script.
    pause & exit /b 1
)

:: Refresh PATH
for /f "delims=" %%i in ('powershell -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\"PATH\",\"Machine\")"') do set "PATH=%%i;%PATH%"
for /f "delims=" %%i in ('powershell -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\"PATH\",\"User\")"') do set "PATH=%%i;%PATH%"

where flutter >nul 2>&1
if errorlevel 1 (
    echo.
    echo        Flutter was installed but is not on PATH yet.
    echo        Please close this window, reopen Command Prompt, and run this script again.
    pause & exit /b 1
)

:flutter_ok
for /f "delims=" %%v in ('flutter --version 2^>nul ^| findstr "Flutter"') do echo        %%v

:: ── Step 2: Accept Android licenses (if needed) ──────────────────────────────
echo.
echo  [2/6] Accepting Android SDK licenses...
echo y | flutter doctor --android-licenses >nul 2>&1
echo        Done.

:: ── Step 3: flutter pub get ───────────────────────────────────────────────────
echo.
echo  [3/6] Getting Flutter packages...
cd /d "%FLUTTER_DIR%"
flutter pub get
if errorlevel 1 (
    echo        ERROR: flutter pub get failed.
    echo        Run setup.ps1 first if this is the first build.
    pause & exit /b 1
)

:: ── Step 4: Build React app ──────────────────────────────────────────────────
echo.
echo  [4/6] Building React web app...
if not exist "%NODE%" (
    echo        ERROR: Node.js not found at %NODE%
    pause & exit /b 1
)
if not exist "%REACT_DIR%\.env" (
    echo        ERROR: %REACT_DIR%\.env not found.
    echo        Copy .env.example to .env and set VITE_BIBLE_API_KEY
    pause & exit /b 1
)

"%NODE%" "%REACT_DIR%\node_modules\vite\bin\vite.js" build --outDir dist --cwd "%REACT_DIR%"
if errorlevel 1 (
    echo        ERROR: React build failed.
    pause & exit /b 1
)
echo        React build succeeded.

:: ── Step 5: Sync React dist to Flutter assets/web ────────────────────────────
echo.
echo  [5/6] Copying React build into Flutter assets...
if exist "%ASSETS_WEB%" rd /s /q "%ASSETS_WEB%"
mkdir "%ASSETS_WEB%"
xcopy /E /I /Y /Q "%REACT_DIR%\dist\*" "%ASSETS_WEB%\" >nul
echo        Copied to assets\web\

:: ── Step 6: Build Android APK ─────────────────────────────────────────────────
echo.
echo  [6/6] Building Android APK (release)...
echo        (First build takes 5-15 min while Gradle downloads dependencies)
echo.

cd /d "%FLUTTER_DIR%"
flutter build apk --release
if errorlevel 1 (
    echo.
    echo        ERROR: Flutter APK build failed.
    echo        Check flutter doctor for missing Android SDK or JDK.
    pause & exit /b 1
)

:: Copy APK to output folder
if not exist "%OUTPUT%" mkdir "%OUTPUT%"
set "APK_SRC=%FLUTTER_DIR%\build\app\outputs\flutter-apk\app-release.apk"
set "APK_DST=%OUTPUT%\BibleJournal.apk"

if exist "%APK_SRC%" (
    copy /y "%APK_SRC%" "%APK_DST%" >nul
    echo.
    echo  ============================================================
    echo   SUCCESS!
    echo  ============================================================
    echo.
    echo   APK saved to:
    echo   %APK_DST%
    echo.
    echo   To install on Android:
    echo   1. Copy BibleJournal.apk to your phone (USB or Google Drive)
    echo   2. Settings ^> Security ^> Enable "Install unknown apps"
    echo   3. Open the APK on your phone and tap Install
    echo.
) else (
    echo.
    echo   WARNING: APK not found at expected path.
    echo   Check: %APK_SRC%
    echo.
)

pause
