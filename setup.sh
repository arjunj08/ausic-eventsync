#!/bin/bash

# AUISC EventSync - Installation & Setup Script
# This script automates the setup of both frontend and backend

set -e

echo "🚀 AUISC EventSync - Complete Setup"
echo "===================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16+"
    exit 1
fi

echo "✅ Node.js detected: $(node -v)"

# Backend Setup
echo ""
echo "📦 Setting up Backend..."
echo "===================================="
cd "AUISC-EventSync-Backend"

if [ ! -d "node_modules" ]; then
    npm install
    echo "✅ Backend dependencies installed"
else
    echo "✅ Backend dependencies already installed"
fi

cd ..

# Frontend Setup
echo ""
echo "📱 Setting up Frontend..."
echo "===================================="
cd "AUISC-EventSync"

if [ ! -d "node_modules" ]; then
    npm install
    echo "✅ Frontend dependencies installed"
else
    echo "✅ Frontend dependencies already installed"
fi

cd ..

echo ""
echo "✅ Setup Complete!"
echo ""
echo "🎯 Next Steps:"
echo "1. Start MongoDB service"
echo "   - Windows: mongod"
echo "   - Mac: brew services start mongodb-community"
echo "   - Linux: sudo systemctl start mongod"
echo ""
echo "2. Start Backend:"
echo "   cd AUISC-EventSync-Backend && npm run dev"
echo ""
echo "3. Start Frontend (in new terminal):"
echo "   cd AUISC-EventSync && npx expo start"
echo ""
echo "4. Open the app:"
echo "   - Press 'w' for web browser"
echo "   - Press 'a' for Android emulator"
echo "   - Press 'i' for iOS simulator"
echo ""
