@echo off
echo 🔴 Stopping all KingChat servers...
echo.

echo Killing all Node.js processes...
taskkill /F /IM node.exe 2>nul

echo Closing server windows...
taskkill /F /FI "WINDOWTITLE:KingChat*" 2>nul

echo.
echo ✅ All servers stopped!
echo.
pause