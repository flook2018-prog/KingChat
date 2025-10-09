# KingChat Deployment Status
Write-Host "Checking KingChat Deployment..." -ForegroundColor Green

try {
    $response = Invoke-WebRequest -Uri "https://kingchat-production.up.railway.app/" -TimeoutSec 10
    Write-Host "Main page status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Main page: Not accessible ($($_.Exception.Message))" -ForegroundColor Red
}

try {
    $health = Invoke-RestMethod -Uri "https://kingchat-production.up.railway.app/health" -TimeoutSec 10
    Write-Host "Health check: Working - $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "Health check: Not working ($($_.Exception.Message))" -ForegroundColor Red
}

try {
    $login = Invoke-WebRequest -Uri "https://kingchat-production.up.railway.app/login" -TimeoutSec 10
    Write-Host "Login page status: $($login.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Login page: Not accessible ($($_.Exception.Message))" -ForegroundColor Red
}

Write-Host ""
Write-Host "If all endpoints show errors, Railway deployment is still in progress" -ForegroundColor Yellow
Write-Host "Wait 5-10 minutes and try again" -ForegroundColor Yellow