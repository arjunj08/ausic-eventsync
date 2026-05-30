@echo off
REM AUISC EventSync - Installation & Setup Script (Windows)
REM This script automates the setup of both frontend and backend

setlocal enabledelayedexpansion

echo.
echo 🚀 AUISC EventSync - Complete Setup
echo ====================================
echo.

REM Check Node.js
node -v >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js v16+
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js detected: %NODE_VERSION%

REM Backend Setup
echo.
echo 📦 Setting up Backend...
echo ====================================
cd "AUISC-EventSync-Backend"

if not exist "node_modules" (
    call npm install
    echo ✅ Backend dependencies installed
) else (
    echo ✅ Backend dependencies already installed
)

cd ..

REM Frontend Setup
echo.
echo 📱 Setting up Frontend...
echo ====================================
cd "AUISC-EventSync"

if not exist "node_modules" (
    call npm install
    echo ✅ Frontend dependencies installed
) else (
    echo ✅ Frontend dependencies already installed
)

cd ..

echo.
echo ✅ Setup Complete!
echo.
echo 🎯 Next Steps:
echo 1. Start MongoDB service (MongoDB Community Edition must be installed)
echo.
echo 2. Start Backend:
echo    cd AUISC-EventSync-Backend && npm run dev
echo.
echo 3. Start Frontend (in new terminal):
echo    cd AUISC-EventSync && npx expo start
echo.
echo 4. Open the app:
echo    - Press 'w' for web browser
echo    - Press 'a' for Android emulator
echo    - Press 'i' for iOS simulator
echo.
pause
