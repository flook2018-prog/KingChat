@echo off
REM Simple batch script for auto git push

echo 🚀 KingChat Auto Git Push
echo ========================

REM Check if message provided
if "%1"=="" (
    set MESSAGE=Auto update: %date% %time%
) else (
    set MESSAGE=%*
)

echo 📝 Message: %MESSAGE%
echo.

REM Add all changes
echo ➕ Adding changes...
git add .

REM Commit changes
echo 💾 Committing...
git commit -m "%MESSAGE%"

REM Push to GitHub
echo 🚀 Pushing to GitHub...
git push origin main

echo.
echo ✅ Auto push completed!
echo 🌐 Live: https://kingchat-production.up.railway.app
pause