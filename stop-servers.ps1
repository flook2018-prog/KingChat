# KingChat Server Stop Script
Write-Host "🔴 KingChat Server Stop Script" -ForegroundColor Red
Write-Host "==============================" -ForegroundColor Red

try {
    # Stop all Node.js processes
    Write-Host "Stopping all Node.js processes..." -ForegroundColor Yellow
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    
    # Wait a moment
    Start-Sleep -Seconds 2
    
    # Check if any are still running
    $remaining = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($remaining) {
        Write-Host "⚠️ Some Node.js processes are still running" -ForegroundColor Yellow
        $remaining | ForEach-Object { Write-Host "  PID: $($_.Id)" }
    } else {
        Write-Host "✅ All servers stopped successfully!" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")