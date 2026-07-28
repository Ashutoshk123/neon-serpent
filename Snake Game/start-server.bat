@echo off
setlocal enabledelayedexpansion
title NEON SERPENT - Phone Server
cd /d "%~dp0"

rem If port 8000 is already in use, change this number (e.g. 8080).
set PORT=8000

echo.
echo  ============================================================
echo     NEON SERPENT  -  play on your phone
echo  ============================================================
echo.
echo   1. Phone and PC must be on the SAME Wi-Fi network.
echo   2. If Windows asks about the firewall, click ALLOW
echo      (make sure "Private networks" is ticked).
echo   3. Open Chrome on your phone and type one of these:
echo.

set "FOUND="
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /i "IPv4"') do (
  for /f "tokens=*" %%B in ("%%A") do (
    echo         http://%%B:%PORT%
    set "FOUND=1"
  )
)
if not defined FOUND echo         ^(not detected - run "ipconfig" and use your IPv4 address^)

echo.
echo   Tip: in Chrome tap the menu ^> "Add to Home screen" to get an icon.
echo.
echo  ------------------------------------------------------------

where py >nul 2>nul
if not errorlevel 1 (
  echo   Starting server with Python...   [ Ctrl+C to stop ]
  echo.
  py -m http.server %PORT% --bind 0.0.0.0
  goto done
)

where python >nul 2>nul
if not errorlevel 1 (
  echo   Starting server with Python...   [ Ctrl+C to stop ]
  echo.
  python -m http.server %PORT% --bind 0.0.0.0
  goto done
)

where node >nul 2>nul
if not errorlevel 1 (
  echo   Starting server with Node...     [ Ctrl+C to stop ]
  echo.
  node "%~dp0phone-server.js"
  goto done
)

echo.
echo   Neither Python nor Node was found on this PC.
echo.
echo   Easiest fix: open Microsoft Store, install "Python 3.12",
echo   then double-click this file again.
echo.
echo   Or skip the server: send index.html to yourself on
echo   WhatsApp / Telegram, then open it from your phone's Downloads.
echo.

:done
echo.
echo   Server stopped.
pause
