@echo off
REM VARSHANETRA Complete Startup Script for Windows
REM This batch file starts everything together

echo ================================================
echo     VARSHANETRA - Complete System Startup
echo ================================================
echo.

echo Checking prerequisites...
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] Node.js not found! Please install from https://nodejs.org/
    pause
    exit /b 1
) else (
    echo [OK] Node.js installed
)

REM Check Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] Python not found! Please install from https://www.python.org/
    pause
    exit /b 1
) else (
    echo [OK] Python installed
)

echo.
echo ================================================
echo Starting all services...
echo ================================================
echo.
echo Frontend: http://localhost:3000
echo ML Server: http://localhost:5000
echo.
echo Press Ctrl+C to stop all services
echo.
echo ================================================
echo.

REM Run the dev command
npm run dev
