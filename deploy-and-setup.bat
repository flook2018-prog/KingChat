@echo off
echo 🚀 KingChat Deployment and Admin Setup
echo =====================================
echo.
echo 📝 This script will help you deploy and manage KingChat
echo.
echo 🔧 Step 1: Push code to GitHub
echo --------------------------------
git add .
git commit -m "FIX: Update database connection and admin management"
git push origin main

echo.
echo ⏳ Waiting for Railway deployment (30 seconds)...
timeout /t 30 /nobreak > nul

echo.
echo 🔍 Step 2: Test deployment
echo --------------------------
echo Testing health endpoint...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'https://kingchat-production.up.railway.app/health' -TimeoutSec 10; Write-Host 'Health Status:' $response.StatusCode -ForegroundColor Green } catch { Write-Host 'Health Check Failed' -ForegroundColor Red }"

echo.
echo 📱 Step 3: Access Application
echo ----------------------------
echo 🌐 Production URL: https://kingchat-production.up.railway.app
echo 🔐 Login: admin / admin123
echo.
echo 🛠️  Step 4: Admin Management (Railway Console)
echo ---------------------------------------------
echo To manage admins on Railway:
echo 1. Go to Railway Dashboard
echo 2. Select KingChat project
echo 3. Open Console/Terminal
echo 4. Run: node adminManager.js
echo.
echo ✅ Deployment completed!
echo.
pause