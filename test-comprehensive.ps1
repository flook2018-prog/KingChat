# Test KingChat Deployment with Different Methods
Write-Host "🔍 Comprehensive KingChat Test" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

$baseUrl = "https://kingchat-production.up.railway.app"

# Test 1: Basic connectivity
Write-Host "📡 Test 1: Basic connectivity" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $baseUrl -TimeoutSec 30 -UseBasicParsing
    Write-Host "✅ Connected successfully - Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "📄 Content Length: $($response.Content.Length) bytes" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Connection failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Health endpoint with detailed info
Write-Host "💚 Test 2: Health endpoint" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -TimeoutSec 30
    Write-Host "✅ Health check successful" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Cyan
    Write-Host "   Uptime: $($health.uptime) seconds" -ForegroundColor Cyan
    Write-Host "   Database: $($health.database)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: API endpoint
Write-Host "📡 Test 3: API endpoint" -ForegroundColor Yellow
try {
    $api = Invoke-RestMethod -Uri "$baseUrl/api" -TimeoutSec 30
    Write-Host "✅ API accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ API not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Login page
Write-Host "🔐 Test 4: Login page" -ForegroundColor Yellow
try {
    $login = Invoke-WebRequest -Uri "$baseUrl/login" -TimeoutSec 30 -UseBasicParsing
    Write-Host "✅ Login page accessible - Status: $($login.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Login page failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Test completed!" -ForegroundColor Green
Write-Host "💡 If tests show 404, try waiting a few more minutes" -ForegroundColor Yellow
Write-Host "🌐 Direct URL: $baseUrl" -ForegroundColor Cyan