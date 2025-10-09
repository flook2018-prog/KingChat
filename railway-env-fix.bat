@echo off
echo 🔧 KingChat Railway Environment Variables Fix
echo =============================================
echo.
echo 📋 Current Issue:
echo    - Environment variables not set in Railway
echo    - Database connection failing
echo    - Server running without database features
echo.
echo 🚀 Solution Steps:
echo.
echo 1. Go to Railway Dashboard:
echo    https://railway.app/dashboard
echo.
echo 2. Select your KingChat project
echo.
echo 3. Click on "Variables" tab
echo.
echo 4. Add these Environment Variables:
echo.
echo    DATABASE_URL = postgresql://postgres:uEDCzaMjeCGBXCItjOqqMNEYECEFgBsn@postgres.railway.internal:5432/railway
echo.
echo    JWT_SECRET = railway-jwt-secret-2024
echo.
echo    NODE_ENV = production
echo.
echo    PORT = 8080
echo.
echo 5. Click "Deploy" to redeploy
echo.
echo ✅ Expected Result After Fix:
echo    - NODE_ENV: production
echo    - DATABASE_URL: SET
echo    - JWT_SECRET: SET
echo    - Database: connected
echo.
echo 🔍 Check deployment logs for verification
echo.
pause