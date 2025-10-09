# File Watcher for Auto Git Push
# ติดตามการเปลี่ยนแปลงไฟล์และ push อัตโนมัติ

param(
    [string]$watchPath = ".",
    [int]$delaySeconds = 30
)

Write-Host "👀 Starting File Watcher for Auto Git Push..." -ForegroundColor Green
Write-Host "📁 Watching: $(Resolve-Path $watchPath)" -ForegroundColor Cyan
Write-Host "⏱️  Delay: $delaySeconds seconds" -ForegroundColor Yellow
Write-Host "🛑 Press Ctrl+C to stop" -ForegroundColor Red
Write-Host ""

$lastPush = Get-Date
$hasChanges = $false

while ($true) {
    # Check for git changes
    $status = git status --porcelain
    
    if ($status -and -not $hasChanges) {
        Write-Host "📝 Changes detected at $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Yellow
        $hasChanges = $true
        $changeTime = Get-Date
    }
    
    # If changes exist and delay passed, push
    if ($hasChanges -and ((Get-Date) - $changeTime).TotalSeconds -ge $delaySeconds) {
        Write-Host "🚀 Auto-pushing changes..." -ForegroundColor Green
        
        $message = "Auto-commit: Changes at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        
        git add .
        git commit -m $message
        git push origin main
        
        Write-Host "✅ Auto-push completed!" -ForegroundColor Green
        Write-Host "🌐 Live: https://kingchat-production.up.railway.app" -ForegroundColor Cyan
        Write-Host ""
        
        $hasChanges = $false
        $lastPush = Get-Date
    }
    
    Start-Sleep -Seconds 5
}