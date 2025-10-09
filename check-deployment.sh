# Railway Deployment Status Check

echo "🚀 Checking KingChat Deployment Status..."
echo "=========================================="

echo ""
echo "📅 Date: $(date)"
echo "🌐 Target URL: https://kingchat-production.up.railway.app"
echo ""

echo "🔍 Testing endpoints..."
echo ""

# Test main endpoint
echo "1. Main endpoint:"
curl -s -I https://kingchat-production.up.railway.app/ | head -2

echo ""

# Test health endpoint  
echo "2. Health endpoint:"
curl -s -I https://kingchat-production.up.railway.app/health | head -2

echo ""

# Test login endpoint
echo "3. Login endpoint:"
curl -s -I https://kingchat-production.up.railway.app/login | head -2

echo ""

echo "🎯 If all show 404, deployment is not ready yet"
echo "⏰ Please wait 5-10 minutes for Railway to deploy"
echo ""
echo "✅ Expected after successful deployment:"
echo "   - Main: 302 redirect or 200 OK"
echo "   - Health: 200 OK"  
echo "   - Login: 200 OK"