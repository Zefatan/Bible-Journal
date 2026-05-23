@echo off
title Daily Bible Journal
color 6F

set NODE=C:\Users\MSI CYBORG I5\node-portable\node-v22.22.3-win-x64\node.exe
set APP=D:\Projects\Bible Journal
set PORT=5173
set URL=http://localhost:%PORT%

echo.
echo   Daily Bible Journal
echo   Starting server...
echo.

:: Start the Vite server in a minimized window
start "Bible Journal Server" /MIN "%NODE%" "%APP%\node_modules\vite\bin\vite.js" --cwd "%APP%"

:: Wait for the server to be ready, then open the browser
timeout /t 4 /nobreak > nul
start "" "%URL%"

echo   App is open at %URL%
echo   Keep this window open while using the app.
echo   Close this window to shut down the server.
echo.
pause
