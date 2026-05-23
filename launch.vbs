' launch.vbs — Silently start the Bible Journal server and open the browser
' Run with:  wscript.exe launch.vbs
' This script runs completely invisibly (no CMD or console window).

Option Explicit

Dim shell, fso, appDir, nodeExe, serveJs, port, url

Set shell  = CreateObject("WScript.Shell")
Set fso    = CreateObject("Scripting.FileSystemObject")

appDir  = fso.GetParentFolderName(WScript.ScriptFullName)
nodeExe = appDir & "\node.exe"
serveJs = appDir & "\serve.js"
port    = 5173
url     = "http://localhost:" & port

' ── Check if server is already running ──────────────────────────────────────
Dim http
On Error Resume Next
Set http = CreateObject("MSXML2.XMLHTTP")
http.open "HEAD", url & "/", False
http.setTimeouts 0, 0, 800, 800
http.send
If Err.Number = 0 And http.Status > 0 Then
    ' Server already up — just open the browser
    shell.Run url, 1, False
    WScript.Quit 0
End If
On Error GoTo 0

' ── Start the server ─────────────────────────────────────────────────────────
' Run node.exe serve.js invisibly (window style 0 = hidden, False = don't wait)
shell.Run Chr(34) & nodeExe & Chr(34) & " " & Chr(34) & serveJs & Chr(34), 0, False

' ── Wait for the server to be ready (poll up to 8 seconds) ───────────────────
Dim tries, ready
tries = 0
ready = False

Do While tries < 16 And Not ready
    WScript.Sleep 500
    On Error Resume Next
    Set http = CreateObject("MSXML2.XMLHTTP")
    http.open "HEAD", url & "/", False
    http.setTimeouts 0, 0, 400, 400
    http.send
    If Err.Number = 0 And http.Status > 0 Then
        ready = True
    End If
    On Error GoTo 0
    tries = tries + 1
Loop

' ── Open in default browser ───────────────────────────────────────────────────
shell.Run url, 1, False

WScript.Quit 0
