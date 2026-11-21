@echo off
setlocal enabledelayedexpansion
title True Cycle Launcher
cd /d "%~dp0"

echo ========================================================
echo   TRUE CYCLE - LAUNCHING LOCALHOST APPLICATION
echo ========================================================

:: 1. Check & start EcoLens Python API Server (Port 8000)
netstat -ano | findstr ":8000 " | findstr "LISTENING" >nul
if errorlevel 1 (
    echo [*] Starting EcoLens AI Engine on http://localhost:8000...
    start "TrueCycle-API" /min cmd /c "python module\run.py"
) else (
    echo [v] EcoLens AI Engine is already active on port 8000.
)

:: 2. Check & start Vite Frontend Dev Server (Port 3000)
netstat -ano | findstr ":3000 " | findstr "LISTENING" >nul
if errorlevel 1 (
    echo [*] Starting True Cycle Web App on http://localhost:3000...
    start "TrueCycle-UI" /min cmd /c "node node_modules\vite\bin\vite.js --port 3000 --host"
) else (
    echo [v] True Cycle Web App is already active on port 3000.
)

:: 3. Wait until Vite Frontend (Port 3000) is ready
echo [*] Waiting for web interface to initialize...
set /a count=0

:wait_loop
ping 127.0.0.1 -n 2 >nul
netstat -ano | findstr ":3000 " | findstr "LISTENING" >nul
if not errorlevel 1 (
    goto is_ready
)
set /a count+=1
if !count! lss 20 (
    goto wait_loop
)

:is_ready
echo [v] True Cycle is ready! Opening in your default browser...
start http://localhost:3000
ping 127.0.0.1 -n 2 >nul
exit
