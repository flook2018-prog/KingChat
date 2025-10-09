@echo off
echo 🔴 Stopping all Node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo 🚀 Starting KingChat Backend Server...
cd /d "c:\Users\ADMIN\Desktop\KingChat3\server"
start "KingChat Backend" cmd /k "node server.js"

echo ⏱️ Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo 🌐 Starting KingChat Frontend Server...
cd /d "c:\Users\ADMIN\Desktop\KingChat3\client"
start "KingChat Frontend" cmd /k "node frontend-server.js"

echo ✅ Both servers are starting...
echo 📋 Backend: http://localhost:5001
echo 📋 Frontend: http://localhost:3000
echo.
echo Press any key to exit this script...
pause >nul