@echo off
title True Cycle Server Shutdown
cd /d "%~dp0"

echo ========================================================
echo   TRUE CYCLE - STOPPING BACKGROUND SERVERS
echo ========================================================

powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000, 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { if ($_ -gt 0) { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue; Write-Host ('Stopped process PID: ' + $_) } }"

echo [v] Servers on port 3000 and 8000 stopped.
ping 127.0.0.1 -n 2 >nul
exit
