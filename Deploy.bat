@echo off
setlocal
title Deploy Bible Journal
color 3F

set "NODEDIR=C:\Users\MSI CYBORG I5\node-portable\node-v22.22.3-win-x64"
set "PATH=%NODEDIR%;%PATH%"
set "NODE=%NODEDIR%\node.exe"
set "APP=%~dp0"
set "APP=%APP:~0,-1%"
set "FIREBASE=%NODEDIR%\node_modules\firebase-tools\lib\bin\firebase.js"

echo.
echo  ================================================
echo   Bible Journal - Deploy to Phone ^& Web
echo  ================================================
echo.

echo  [1/2] Building app...
cd /d "%APP%"
"%NODE%" "node_modules\vite\bin\vite.js" build
if errorlevel 1 ( echo Build failed! & pause & exit /b 1 )

echo.
echo  [2/2] Deploying to Firebase...
"%NODE%" "%FIREBASE%" deploy --only hosting --project bible-journal-36dc0
if errorlevel 1 ( echo Deploy failed! & pause & exit /b 1 )

echo.
echo  ================================================
echo   Done! Your app is live.
echo  ================================================
echo.
echo   Open on your phone:
echo   https://bible-journal-36dc0.web.app
echo.
echo   Add to Home Screen in Chrome for app experience.
echo.
pause
