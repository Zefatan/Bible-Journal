; NSIS installer script for Daily Bible Journal (Windows)
; Requires NSIS (https://nsis.sourceforge.io) to compile
; Run:  makensis installer.nsi
; Output: output\BibleJournal-Setup.exe

!include "MUI2.nsh"

; ── Basic metadata ────────────────────────────────────────────────────────────
Name "Daily Bible Journal"
OutFile "output\BibleJournal-Setup.exe"
InstallDir "$PROGRAMFILES64\BibleJournal"
InstallDirRegKey HKLM "Software\BibleJournal" "Install_Dir"
RequestExecutionLevel admin

; ── MUI Settings ─────────────────────────────────────────────────────────────
!define MUI_ABORTWARNING
!define MUI_ICON "..\public\icon.ico"

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

; ── Installer Sections ────────────────────────────────────────────────────────
Section "Daily Bible Journal" SecMain

  SetOutPath "$INSTDIR"

  ; Copy the Windows release build
  File /r "output\BibleJournal-Windows\*.*"

  ; Write registry keys for Add/Remove Programs
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\BibleJournal" \
    "DisplayName" "Daily Bible Journal"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\BibleJournal" \
    "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\BibleJournal" \
    "DisplayIcon" "$INSTDIR\bible_journal.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\BibleJournal" \
    "Publisher" "Daily Bible Journal"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\BibleJournal" \
    "DisplayVersion" "1.0.0"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\BibleJournal" \
    "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\BibleJournal" \
    "NoRepair" 1

  ; Create uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ; Start Menu shortcut
  CreateDirectory "$SMPROGRAMS\Daily Bible Journal"
  CreateShortcut "$SMPROGRAMS\Daily Bible Journal\Daily Bible Journal.lnk" \
    "$INSTDIR\bible_journal.exe"
  CreateShortcut "$SMPROGRAMS\Daily Bible Journal\Uninstall.lnk" \
    "$INSTDIR\Uninstall.exe"

  ; Desktop shortcut
  CreateShortcut "$DESKTOP\Daily Bible Journal.lnk" "$INSTDIR\bible_journal.exe"

SectionEnd

; ── Uninstaller ───────────────────────────────────────────────────────────────
Section "Uninstall"

  ; Remove installed files
  RMDir /r "$INSTDIR"

  ; Remove Start Menu
  RMDir /r "$SMPROGRAMS\Daily Bible Journal"

  ; Remove Desktop shortcut
  Delete "$DESKTOP\Daily Bible Journal.lnk"

  ; Remove registry keys
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\BibleJournal"
  DeleteRegKey HKLM "Software\BibleJournal"

SectionEnd
