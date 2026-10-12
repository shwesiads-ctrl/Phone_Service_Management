@echo off
cd /d "%~dp0"
title FixFlow POS - PHP CLI Multi-Device Server (No XAMPP)
color 0B
cls
echo ========================================================================
echo   FixFlow Phone Service Management System - PHP CLI Server
echo   Multi-Device Local Area Network (LAN / Wi-Fi) Setup
echo ========================================================================
echo.
echo [1/3] Checking PHP CLI environment...
where php >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] PHP is not found in your system PATH!
    echo Please ensure PHP CLI is installed or add PHP to your Windows Environment Variables.
    echo (No XAMPP needed - just standard php.exe)
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('php -v') do (
    echo [OK] Detected: %%v
    goto :php_detected
)
:php_detected

echo.
if not exist "dist\index.html" (
    echo [ERROR] Build the frontend first: npm run build
    pause
    exit /b 1
)
if not defined PORT set PORT=3000
echo [INFO] Keep Node running in another terminal: npm run start:production
echo [INFO] PHP forwards API requests to Node port %PORT%.
echo [2/3] Detecting Local Network IP Address (for other devices on same Wi-Fi)...
echo ------------------------------------------------------------------------
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0 ^| findstr /v "0.0.0.0.*0.0.0.0"') do (
    echo   Host Local IP: %%a
    set LOCAL_IP=%%a
    goto :ip_found
)
:ip_found

echo ------------------------------------------------------------------------
echo.
echo [3/3] Starting PHP CLI Server on 0.0.0.0:8080 (No XAMPP required)...
echo.
echo ========================================================================
echo   HOW TO CONNECT FROM OTHER PHONES, TABLETS ^& POS TERMINALS:
echo.
echo   1. Connect your phone/tablet to the SAME Wi-Fi network as this PC.
echo   2. Open the browser (Chrome / Safari) on the device and navigate to:
echo.
echo        http://%LOCAL_IP%:8080
echo        or http://localhost:8080 (on this PC)
echo.
echo   3. Or scan the QR code located in FixFlow -^> Settings -^> Network.
echo ========================================================================
echo.
echo Starting PHP CLI built-in web server... (Press Ctrl+C to stop)
echo.
php -S 0.0.0.0:8080 router.php
pause
