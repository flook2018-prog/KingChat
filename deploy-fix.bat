@echo off
chcp 65001 >nul
cd /d "C:\Users\ADMIN\Desktop\KingChat01\KingChat01"

echo Adding all changes...
git add .

echo Committing changes...
git commit -m "Fix encoding issues for Thai text display"

echo Pushing to repository...
git push origin main

echo Deployment completed!
pause