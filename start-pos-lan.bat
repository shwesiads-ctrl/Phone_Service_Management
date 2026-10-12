@echo off
cd /d "%~dp0"
title FixFlow POS - Multi-Device Local Network Server
color 0A
cls
echo ========================================================================
echo   FixFlow Phone Service Management System - Multi-Device LAN Server
echo ========================================================================
echo.
echo Detecting Host Local IP Address...
echo ------------------------------------------------------------------------
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0 ^| findstr /v "0.0.0.0.*0.0.0.0"') do (
    echo   Host Local Network IP: %%a
    set LOCAL_IP=%%a
    goto :ip_found
)
:ip_found
echo ------------------------------------------------------------------------
echo.
echo Client Devices (Tablets, Phones, Second POS PC) on SAME Wi-Fi connect to:
echo.
echo     http://%LOCAL_IP%:3000
echo.
echo Starting FixFlow Server on 0.0.0.0:3000...
echo.
npm start
pause
