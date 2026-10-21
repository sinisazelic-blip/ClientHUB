@echo off
chcp 65001 > nul
title FluxaX Net Client HUB - Port 1991
color 0B

echo ==============================================================================
echo    FluxaX Net Client HUB - Live Studio Director & Client Portal (Port 1991)
echo ==============================================================================
echo.

cd /d "%~dp0"

echo [1/2] Oslobadjanje porta 1991 ako je zauzet...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :1991') do (
    if not "%%a"=="0" (
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo.
echo [2/2] Pokrecem Next.js Client HUB na portu 1991...
echo Adresa u mrezi: http://192.168.70.150:1991
echo Lokalno: http://localhost:1991
echo.

npm run dev
