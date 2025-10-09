@echo off
echo 🚂 KingChat Railway Quick Deploy Setup
echo =======================================
echo.

echo 📋 Your Railway Configuration:
echo Domain: https://kingchat.up.railway.app
echo Database: PostgreSQL (provided by Railway)
echo.

echo 🔧 Environment Variables to set in Railway:
echo.
echo NODE_ENV=production
echo PORT=5001
echo JWT_SECRET=your-super-secret-jwt-key-here
echo DATABASE_URL=postgresql://postgres:uEDCzaMjeCGBXCItjOqqMNEYECEFgBsn@postgres.railway.internal:5432/railway
echo CORS_ORIGIN=https://kingchat.up.railway.app
echo FRONTEND_URL=https://kingchat.up.railway.app
echo RAILWAY_ENVIRONMENT=production
echo.

echo 📝 Next Steps:
echo 1. Go to your Railway project dashboard
echo 2. Add the environment variables above
echo 3. Deploy will happen automatically
echo 4. Test at https://kingchat.up.railway.app/health
echo.

echo 🌐 Frontend Setup:
echo - Deploy client folder to Vercel/Netlify
echo - Or serve from Railway backend
echo - Update API URLs to point to Railway
echo.

pause