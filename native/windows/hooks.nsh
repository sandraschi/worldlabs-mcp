; -- native/windows/hooks.nsh --
; Kill UI + backend before install/uninstall (backend locks resources/*.exe).
; Multi-layer: Stop-Process (same-user) + taskkill (any user) + NSIS plugin.
!macro KillFleetProcesses
  DetailPrint "Stopping worldlabs-mcp processes..."

  ; Stop-Process (same-user) + taskkill (any user)
  ExecWait 'powershell -NoProfile -Command "Stop-Process -Name worldlabs-mcp-backend -Force -ErrorAction SilentlyContinue; Stop-Process -Name worldlabs-mcp-native -Force -ErrorAction SilentlyContinue; taskkill /F /IM worldlabs-mcp-backend.exe /T 2>$null; taskkill /F /IM worldlabs-mcp-native.exe /T 2>$null"' $0

  !if "${INSTALLMODE}" == "currentUser"
    nsis_tauri_utils::KillProcessCurrentUser "worldlabs-mcp-backend.exe"
    Pop $0
    nsis_tauri_utils::KillProcessCurrentUser "worldlabs-mcp-native.exe"
    Pop $0
  !else
    nsis_tauri_utils::KillProcess "worldlabs-mcp-backend.exe"
    Pop $0
    nsis_tauri_utils::KillProcess "worldlabs-mcp-native.exe"
    Pop $0
  !endif
  Sleep 3000
!macroend

!macro UninstallPrevious
  DetailPrint "Checking for previous installation..."
  !if "${INSTALLMODE}" == "currentUser"
    ReadRegStr $R0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${IDENTIFIER}" "UninstallString"
  !else
    ReadRegStr $R0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${IDENTIFIER}" "UninstallString"
  !endif
  ${If} $R0 != ""
    DetailPrint "Removing previous installation..."
    ExecWait '"$R0" /S' $0
    DetailPrint "Previous uninstall exit code: $0"
    Sleep 1500
  ${EndIf}
!macroend

!macro NSIS_HOOK_PREINSTALL
  !insertmacro KillFleetProcesses
  !insertmacro UninstallPrevious
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  !insertmacro KillFleetProcesses
!macroend

!macro NSIS_HOOK_POSTINSTALL
  IfFileExists "$INSTDIR\resources\install-mcp-clients.ps1" 0 mcp_hook_done
    DetailPrint "Optional: register worldlabs-mcp in Cursor / Claude Desktop"
    ExecWait 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\install-mcp-clients.ps1" -Interactive'
  mcp_hook_done:
!macroend
