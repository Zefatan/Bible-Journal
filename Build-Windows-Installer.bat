@echo off
setlocal EnableDelayedExpansion
title Build Windows Installer — Daily Bible Journal
color 3F

set "APP_DIR=%~dp0"
set "APP_DIR=%APP_DIR:~0,-1%"
set "NODE=%APP_DIR%\..\node-portable\node-v22.22.3-win-x64\node.exe"
if not exist "%NODE%" set "NODE=C:\Users\MSI CYBORG I5\node-portable\node-v22.22.3-win-x64\node.exe"

set "STAGING=%APP_DIR%\staging"
set "OUTFILE=%APP_DIR%\BibleJournal-Setup.exe"

echo.
echo  ============================================================
echo   Daily Bible Journal — Windows Installer Builder
echo  ============================================================
echo.

:: ── Step 1: Check Node.js ────────────────────────────────────────────────────
echo  [1/5] Checking Node.js...
if not exist "%NODE%" (
    echo        ERROR: node.exe not found at:
    echo        %NODE%
    echo        Please update the NODE path in this .bat file.
    pause & exit /b 1
)
echo        Found: %NODE%

:: ── Step 2: Build React app ──────────────────────────────────────────────────
echo.
echo  [2/5] Building React web app...
if not exist "%APP_DIR%\.env" (
    echo        ERROR: .env file not found.
    echo        Copy .env.example to .env and set VITE_BIBLE_API_KEY
    pause & exit /b 1
)
"%NODE%" "%APP_DIR%\node_modules\vite\bin\vite.js" build --outDir dist --cwd "%APP_DIR%"
if errorlevel 1 (
    echo        ERROR: React build failed.
    pause & exit /b 1
)
echo        React build succeeded.

:: ── Step 3: Prepare staging folder ───────────────────────────────────────────
echo.
echo  [3/5] Preparing installer files...
if exist "%STAGING%" rd /s /q "%STAGING%"
mkdir "%STAGING%\app"

:: Copy Node.js runtime
copy /y "%NODE%" "%STAGING%\node.exe" >nul

:: Copy serve.js and launch.vbs
copy /y "%APP_DIR%\serve.js"   "%STAGING%\serve.js"   >nul
copy /y "%APP_DIR%\launch.vbs" "%STAGING%\launch.vbs" >nul

:: Copy built React app into staging\app\
xcopy /E /I /Y /Q "%APP_DIR%\dist\*" "%STAGING%\app\" >nul

:: Copy icon if it exists as .ico
if exist "%APP_DIR%\public\icon.ico" copy /y "%APP_DIR%\public\icon.ico" "%STAGING%\icon.ico" >nul

echo        Staging ready.

:: ── Step 4: Install NSIS if needed ───────────────────────────────────────────
echo.
echo  [4/5] Checking NSIS (installer compiler)...
set "MAKENSIS="
where makensis >nul 2>&1
if not errorlevel 1 (
    set "MAKENSIS=makensis"
    echo        NSIS already installed.
) else (
    :: Check common install paths
    if exist "C:\Program Files (x86)\NSIS\makensis.exe" (
        set "MAKENSIS=C:\Program Files (x86)\NSIS\makensis.exe"
        echo        NSIS found at Program Files.
    ) else if exist "C:\Program Files\NSIS\makensis.exe" (
        set "MAKENSIS=C:\Program Files\NSIS\makensis.exe"
        echo        NSIS found at Program Files.
    ) else (
        echo        NSIS not found. Installing via winget...
        echo        (This may take a minute — NSIS is ~3 MB)
        winget install --id NSIS.NSIS --silent --accept-source-agreements --accept-package-agreements
        if errorlevel 1 (
            echo.
            echo        winget install failed. Please install NSIS manually:
            echo        https://nsis.sourceforge.io/Download
            echo        Then re-run this script.
            pause & exit /b 1
        )
        :: Refresh PATH after install
        for /f "delims=" %%i in ('powershell -NoProfile -Command "[System.Environment]::GetEnvironmentVariable(\"PATH\",\"Machine\")"') do set "MACHINE_PATH=%%i"
        set "PATH=%MACHINE_PATH%;%PATH%"
        if exist "C:\Program Files (x86)\NSIS\makensis.exe" (
            set "MAKENSIS=C:\Program Files (x86)\NSIS\makensis.exe"
        ) else (
            set "MAKENSIS=makensis"
        )
        echo        NSIS installed successfully.
    )
)

:: ── Step 5: Compile installer ─────────────────────────────────────────────────
echo.
echo  [5/5] Compiling installer...
"%MAKENSIS%" /V2 /DSTAGINGDIR="%STAGING%" /DOUTFILE="%OUTFILE%" "%APP_DIR%\BibleJournal.nsi"
if errorlevel 1 (
    echo        ERROR: NSIS compilation failed.
    pause & exit /b 1
)

:: ── Done ─────────────────────────────────────────────────────────────────────
echo.
echo  ============================================================
echo   SUCCESS!
echo  ============================================================
echo.
echo   Installer saved to:
echo   %OUTFILE%
echo.
echo   Distribute this single file to any Windows PC.
echo   Users just double-click it to install — no PowerShell needed.
echo.
pause
