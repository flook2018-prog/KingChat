#!/bin/bash

echo "🚀 KingChat Deployment Verification"
echo "===================================="
echo ""

echo "📅 Deployment Date: $(date)"
echo "🏷️  Version: v1.0.1"
echo "🌐 Target URL: https://kingchat.up.railway.app"
echo ""

echo "🔍 Checking deployment status..."
echo ""

# Check health endpoint
echo "💚 Health Check:"
curl -s https://kingchat.up.railway.app/health | head -5
echo ""

# Check main page
echo "🏠 Main Page:"
curl -s -I https://kingchat.up.railway.app | head -3
echo ""

# Check login page
echo "🔐 Login Page:"
curl -s -I https://kingchat.up.railway.app/login | head -3
echo ""

# Check API endpoint
echo "📡 API Status:"
curl -s -I https://kingchat.up.railway.app/api | head -3
echo ""

echo "✅ Deployment verification completed!"
echo ""
echo "🎯 Ready to use:"
echo "   - Main: https://kingchat.up.railway.app"
echo "   - Login: admin / admin123"
echo "   - Health: https://kingchat.up.railway.app/health"