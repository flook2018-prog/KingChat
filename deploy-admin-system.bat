@echo off
echo 🚀 Deploying KingChat with PostgreSQL Admin System

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Not in project root directory
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Create admin table SQL for Railway
echo 🗄️ Creating admin table setup SQL...
(
echo -- Create admins table for KingChat system
echo CREATE TABLE IF NOT EXISTS admins ^(
echo     id SERIAL PRIMARY KEY,
echo     username VARCHAR^(255^) UNIQUE NOT NULL,
echo     password VARCHAR^(255^) NOT NULL,
echo     role VARCHAR^(50^) DEFAULT 'admin',
echo     status VARCHAR^(50^) DEFAULT 'active',
echo     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
echo     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
echo     last_login TIMESTAMP
echo ^);
echo.
echo -- Create default admin if not exists
echo INSERT INTO admins ^(username, password, role, status^)
echo SELECT 'admin', '$2b$12$x3Fadf4Vfm/lPy0umF5sO.V5UEUu2LPe28KrL5W.FIAQE5d.kdD1y', 'super_admin', 'active'
echo WHERE NOT EXISTS ^(SELECT 1 FROM admins WHERE username = 'admin'^);
) > server\admin-table-setup.sql

echo ✅ Admin table setup SQL created

REM Update package.json start script for Railway
echo 📝 Updating package.json for Railway...
node -e "const pkg = require('./package.json'); pkg.scripts = pkg.scripts || {}; pkg.scripts.start = 'cd server && node server.js'; pkg.scripts.build = 'echo Build complete'; const fs = require('fs'); fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2)); console.log('✅ Package.json updated');"

echo 🎯 Deployment ready!
echo.
echo 📋 Next steps:
echo 1. Deploy to Railway: railway up
echo 2. Run admin table setup in Railway console
echo 3. Test admin system at: https://kingchat.up.railway.app/client/admin-working.html
echo.
echo 🔑 Default admin credentials:
echo    Username: admin
echo    Password: admin123

pause