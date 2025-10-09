# KingChat Server Restart Script
Write-Host "🔄 KingChat Server Restart Script" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Stop existing servers
Write-Host "🔴 Stopping existing servers..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✅ Stopped all Node.js processes" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ No Node.js processes to stop" -ForegroundColor Cyan
}
Start-Sleep -Seconds 2

# Start backend
Write-Host "🚀 Starting Backend Server..." -ForegroundColor Yellow
$backendPath = "c:\Users\ADMIN\Desktop\KingChat3\server"

if (Test-Path "$backendPath\server.js") {
    Set-Location -Path $backendPath
    $backend = Start-Process -FilePath "node" -ArgumentList "server.js" -PassThru -WindowStyle Normal
    Write-Host "✅ Backend started (PID: $($backend.Id))" -ForegroundColor Green
} else {
    Write-Host "❌ Backend server.js not found!" -ForegroundColor Red
    exit 1
}

# Start frontend
Write-Host "🌐 Starting Frontend Server..." -ForegroundColor Yellow
$frontendPath = "c:\Users\ADMIN\Desktop\KingChat3\client"

if (Test-Path "$frontendPath\frontend-server.js") {
    Set-Location -Path $frontendPath
    Start-Sleep -Seconds 3
    $frontend = Start-Process -FilePath "node" -ArgumentList "frontend-server.js" -PassThru -WindowStyle Normal
    Write-Host "✅ Frontend started (PID: $($frontend.Id))" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend server not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Servers started successfully!" -ForegroundColor Green
Write-Host "📋 Backend:  http://localhost:5001" -ForegroundColor Cyan
Write-Host "📋 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 To stop servers, run: .\stop-servers.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")