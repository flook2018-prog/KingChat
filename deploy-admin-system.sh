#!/bin/bash

echo "🚀 Deploying KingChat with PostgreSQL Admin System"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create admin table SQL for Railway
echo "🗄️ Creating admin table setup SQL..."
cat > server/admin-table-setup.sql << 'EOF'
-- Create admins table for KingChat system
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Create default admin if not exists
INSERT INTO admins (username, password, role, status)
SELECT 'admin', '$2b$12$x3Fadf4Vfm/lPy0umF5sO.V5UEUu2LPe28KrL5W.FIAQE5d.kdD1y', 'super_admin', 'active'
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE username = 'admin');
EOF

echo "✅ Admin table setup SQL created"

# Update package.json start script for Railway
echo "📝 Updating package.json for Railway..."
node -e "
const pkg = require('./package.json');
pkg.scripts = pkg.scripts || {};
pkg.scripts.start = 'cd server && node server.js';
pkg.scripts.build = 'echo Build complete';
const fs = require('fs');
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✅ Package.json updated');
"

echo "🎯 Deployment ready!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy to Railway: railway up"
echo "2. Run admin table setup in Railway console"
echo "3. Test admin system at: https://kingchat.up.railway.app/client/admin-working.html"
echo ""
echo "🔑 Default admin credentials:"
echo "   Username: admin"
echo "   Password: admin123"