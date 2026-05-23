; ============================================================================
;  BibleJournal.nsi — NSIS installer for Daily Bible Journal (Windows)
;  Compiled by Build-Windows-Installer.bat
;  Output: BibleJournal-Setup.exe
;  Installs to: %LOCALAPPDATA%\Programs\Bible Journal  (no admin required)
; ============================================================================

Unicode True
SetCompressor /SOLID lzma

!include "MUI2.nsh"
!include "LogicLib.nsh"

; ── Defines (overridable via /D on the command line) ────────────────────────
!ifndef STAGINGDIR
  !define STAGINGDIR "staging"
!endif
!ifndef OUTFILE
  !define OUTFILE "BibleJournal-Setup.exe"
!endif

Name              "Daily Bible Journal"
OutFile           "${OUTFILE}"
InstallDir        "$LOCALAPPDATA\Programs\Bible Journal"
InstallDirRegKey  HKCU "Software\BibleJournal" "InstallDir"

; User-level install — no admin prompt
RequestExecutionLevel user

; ── MUI Settings ─────────────────────────────────────────────────────────────
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE    "Daily Bible Journal Setup"
!define MUI_WELCOMEPAGE_TEXT     "This will install Daily Bible Journal on your computer.$\r$\n$\r$\nYour journal entries are stored locally — they are private and never uploaded anywhere.$\r$\n$\r$\nClick Next to continue."
!define MUI_FINISHPAGE_RUN       "$INSTDIR\launch.vbs"
!define MUI_FINISHPAGE_RUN_TEXT  "Launch Daily Bible Journal now"
!define MUI_FINISHPAGE_RUN_NOTCHECKED

; Attempt to use custom icon if present
!if /FileExists "${STAGINGDIR}\icon.ico"
  !define MUI_ICON    "${STAGINGDIR}\icon.ico"
  !define MUI_UNICON  "${STAGINGDIR}\icon.ico"
!endif

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

; ── Helper macro: create shortcut ────────────────────────────────────────────
; Shortcut points to wscript.exe so there is NO visible window when launching
!macro CreateLaunchShortcut LINK_PATH
  CreateShortcut "${LINK_PATH}" \
    "$SYSDIR\wscript.exe" \
    '"$INSTDIR\launch.vbs"' \
    "$INSTDIR\node.exe" 0 SW_SHOWMINIMIZED
!macroend

; ── Main install section ──────────────────────────────────────────────────────
Section "Daily Bible Journal" SecMain

  SetOutPath "$INSTDIR"

  ; Core launcher files
  File "${STAGINGDIR}\node.exe"
  File "${STAGINGDIR}\serve.js"
  File "${STAGINGDIR}\launch.vbs"

  ; React web app files (served locally)
  SetOutPath "$INSTDIR\app"
  File /r "${STAGINGDIR}\app\*.*"

  SetOutPath "$INSTDIR"

  ; ── Desktop shortcut ──
  !insertmacro CreateLaunchShortcut "$DESKTOP\Daily Bible Journal.lnk"

  ; ── Start Menu ──
  CreateDirectory "$SMPROGRAMS\Daily Bible Journal"
  !insertmacro CreateLaunchShortcut "$SMPROGRAMS\Daily Bible Journal\Daily Bible Journal.lnk"
  CreateShortcut  "$SMPROGRAMS\Daily Bible Journal\Uninstall.lnk" "$INSTDIR\Uninstall.exe"

  ; ── Register with Windows Add/Remove Programs (HKCU = no admin) ──
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\BibleJournal" \
    "DisplayName"     "Daily Bible Journal"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\BibleJournal" \
    "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\BibleJournal" \
    "DisplayIcon"     "$INSTDIR\node.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\BibleJournal" \
    "Publisher"       "Daily Bible Journal"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\BibleJournal" \
    "DisplayVersion"  "1.0.0"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\BibleJournal" \
    "InstallLocation" "$INSTDIR"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\BibleJournal" \
    "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\BibleJournal" \
    "NoRepair" 1

  WriteRegStr HKCU "Software\BibleJournal" "InstallDir" "$INSTDIR"

  ; Write uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"

SectionEnd

; ── Uninstaller ───────────────────────────────────────────────────────────────
Section "Uninstall"

  ; Kill any running server process
  nsExec::Exec 'taskkill /f /im node.exe'

  ; Remove files
  Delete "$INSTDIR\node.exe"
  Delete "$INSTDIR\serve.js"
  Delete "$INSTDIR\launch.vbs"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir /r "$INSTDIR\app"
  RMDir "$INSTDIR"

  ; Remove shortcuts
  Delete "$DESKTOP\Daily Bible Journal.lnk"
  Delete "$SMPROGRAMS\Daily Bible Journal\Daily Bible Journal.lnk"
  Delete "$SMPROGRAMS\Daily Bible Journal\Uninstall.lnk"
  RMDir  "$SMPROGRAMS\Daily Bible Journal"

  ; Remove registry entries
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\BibleJournal"
  DeleteRegKey HKCU "Software\BibleJournal"

SectionEnd
