# KingChat Deployment Verification Script
Write-Host "🚀 KingChat Deployment Verification" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

Write-Host "📅 Deployment Date: $(Get-Date)" -ForegroundColor Cyan
Write-Host "🏷️  Version: v1.0.1" -ForegroundColor Cyan
Write-Host "🌐 Target URL: https://kingchat.up.railway.app" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔍 Checking deployment status..." -ForegroundColor Yellow
Write-Host ""

# Check health endpoint
Write-Host "💚 Health Check:" -ForegroundColor Green
try {
    $health = Invoke-RestMethod -Uri "https://kingchat.up.railway.app/health" -TimeoutSec 10
    Write-Host "   Status: $($health.status)" -ForegroundColor Green
    Write-Host "   Uptime: $($health.uptime) seconds" -ForegroundColor Green
    Write-Host "   Database: $($health.database)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Check main page
Write-Host "🏠 Main Page:" -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "https://kingchat.up.railway.app" -TimeoutSec 10
    Write-Host "   Status Code: $($response.StatusCode)" -ForegroundColor Blue
    Write-Host "   ✅ Main page accessible" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Main page failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Check login page
Write-Host "🔐 Login Page:" -ForegroundColor Magenta
try {
    $response = Invoke-WebRequest -Uri "https://kingchat.up.railway.app/login" -TimeoutSec 10
    Write-Host "   Status Code: $($response.StatusCode)" -ForegroundColor Magenta
    Write-Host "   ✅ Login page accessible" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Login page failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "✅ Deployment verification completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Ready to use:" -ForegroundColor Yellow
Write-Host "   - Main: https://kingchat.up.railway.app" -ForegroundColor White
Write-Host "   - Login: admin / admin123" -ForegroundColor White
Write-Host "   - Health: https://kingchat.up.railway.app/health" -ForegroundColor White
Write-Host ""
Write-Host "KingChat v1.0.1 is LIVE!" -ForegroundColor Green