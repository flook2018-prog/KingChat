#!/bin/bash

# Railway Deployment Preparation Script

echo "🚂 Preparing KingChat for Railway Deployment"
echo "============================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📋 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - KingChat ready for Railway"
fi

# Check for required files
echo "📋 Checking required files..."

files=("Dockerfile" "railway.json" ".dockerignore" "RAILWAY_DEPLOY.md")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

# Check server package.json
if [ -f "server/package.json" ]; then
    echo "✅ server/package.json exists"
else
    echo "❌ server/package.json missing"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Push this repository to GitHub"
echo "2. Create new Railway project"
echo "3. Connect to your GitHub repository"
echo "4. Set environment variables (see .env.railway)"
echo "5. Deploy!"
echo ""
echo "📋 Don't forget to:"
echo "- Set up MongoDB Atlas or Railway MongoDB"
echo "- Update CORS_ORIGIN with your frontend domain"
echo "- Generate a strong JWT_SECRET"
echo ""
echo "🚀 Happy deploying!"