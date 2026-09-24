@echo off
set "PATH=C:\Users\MSI CYBORG I5\node-portable\node-v22.22.3-win-x64;%PATH%"
cd /d "D:\Projects\Bible Journal"
echo.
echo  Logging in to Firebase...
echo  A browser window will open. Sign in with your Google account.
echo.
"C:\Users\MSI CYBORG I5\node-portable\node-v22.22.3-win-x64\node.exe" "C:\Users\MSI CYBORG I5\node-portable\node-v22.22.3-win-x64\node_modules\firebase-tools\lib\bin\firebase.js" login
echo.
echo  Building app...
"C:\Users\MSI CYBORG I5\node-portable\node-v22.22.3-win-x64\node.exe" "node_modules\vite\bin\vite.js" build
echo.
echo  Deploying to Firebase Hosting...
"C:\Users\MSI CYBORG I5\node-portable\node-v22.22.3-win-x64\node.exe" "C:\Users\MSI CYBORG I5\node-portable\node-v22.22.3-win-x64\node_modules\firebase-tools\lib\bin\firebase.js" deploy --only hosting --project bible-journal-36dc0
echo.
echo  Done! Press any key to close.
pause
