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
echo PORT=8080
echo JWT_SECRET=your-super-secret-jwt-key-make-it-at-least-32-characters-long
echo MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kingchat
echo CORS_ORIGIN=https://kingchat.up.railway.app
echo FRONTEND_URL=https://kingchat.up.railway.app
echo RAILWAY_ENVIRONMENT=production
echo.
echo 🚨 IMPORTANT: You MUST set up MongoDB Atlas!
echo Railway provides PostgreSQL, but this app uses MongoDB.
echo 1. Create MongoDB Atlas account (free tier available)
echo 2. Create a cluster and get connection string
echo 3. Set MONGODB_URI in Railway environment variables
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