# Daily Bible Journal — Flutter App

Cross-platform wrapper (Android APK + Windows .exe) around the Daily Bible Journal React web app.

## How it works

The Flutter app embeds the React web app inside a WebView using `flutter_inappwebview`.
At runtime, `InAppLocalhostServer` serves the built React files (bundled inside the app as
Flutter assets) on `http://localhost:8080`.  All journal data is stored in the WebView's
localStorage, which persists between sessions just like the browser version.

External links (Bible Hub commentaries, Bible Gateway) open in the system browser.

---

## Prerequisites

| Tool | How to get |
|------|-----------|
| **Flutter SDK** | `setup.ps1` installs it via winget, OR download from https://docs.flutter.dev/get-started/install/windows |
| **Android Studio** (optional but recommended) | For running an emulator |
| **Android SDK / platform-tools** | Installed automatically by Android Studio or Flutter |
| **NSIS** (optional) | For building a Windows installer .exe — https://nsis.sourceforge.io |
| **WebView2 Runtime** (Windows) | Usually pre-installed on Windows 10/11. If missing: https://developer.microsoft.com/en-us/microsoft-edge/webview2/ |
| **Node.js** (portable) | Already present at `C:\Users\MSI CYBORG I5\node-portable\…` |

---

## First-time setup

Open **PowerShell** (not admin required for Flutter) and run:

```powershell
cd "D:\Projects\Bible Journal Flutter"
.\setup.ps1
```

This will:
1. Install Flutter via winget (if not already installed)
2. Accept Android SDK licenses
3. Build the React web app (`npm run build`)
4. Copy the React `dist/` into `assets/web/`
5. Run `flutter pub get` to download Flutter packages

---

## Building the app

```powershell
# Build both Android APK and Windows .exe
.\build.ps1

# Build Android APK only
.\build.ps1 -Target android

# Build Windows only
.\build.ps1 -Target windows
```

Output files appear in the `output\` folder:

| File | Description |
|------|-------------|
| `output\BibleJournal-release.apk` | Android installer — sideload on your phone |
| `output\BibleJournal-Windows\bible_journal.exe` | Windows app (run directly) |
| `output\BibleJournal-Setup.exe` | Windows installer (requires NSIS) |

---

## Installing on Android

1. On your Android phone, go to **Settings → Security → Install unknown apps** and allow
   installs from Files or your file manager.
2. Copy `BibleJournal-release.apk` to your phone (USB cable, or share via Google Drive).
3. Open the APK file on your phone and tap **Install**.
4. Launch **Daily Bible Journal** from your app drawer.

> **Note:** Your journal data is stored in the app's private localStorage.
> It is not shared with the browser version.

---

## Running on Windows (without installer)

Double-click `output\BibleJournal-Windows\bible_journal.exe`.

All DLLs and assets are in the same folder — no installation required. You can copy
the entire `BibleJournal-Windows\` folder anywhere you like (e.g., your Desktop).

---

## Project structure

```
Bible Journal Flutter\
├── lib\
│   └── main.dart          ← Flutter app (WebView wrapper)
├── android\               ← Android-specific config
├── windows\               ← Windows-specific config
├── assets\
│   └── web\               ← React dist/ is copied here by build.ps1
├── pubspec.yaml           ← Flutter dependencies
├── setup.ps1              ← First-time setup script
├── build.ps1              ← Build script (APK + Windows)
└── installer.nsi          ← NSIS Windows installer script
```

---

## Updating the app

Whenever you change the React app:

```powershell
# Just re-run the build — it rebuilds React and repackages Flutter
.\build.ps1
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `flutter: command not found` | Close and reopen PowerShell after setup.ps1 |
| `SDK location not found` | Run `flutter doctor` and follow Android SDK setup steps |
| White screen on launch | Check that `assets/web/index.html` exists; re-run build.ps1 |
| Commentary links don't open | Ensure `url_launcher` is in pubspec.yaml and `flutter pub get` was run |
| APK install blocked | Enable "Install from unknown sources" in Android Settings |
