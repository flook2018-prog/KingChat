# Auto Git Push Script for KingChat
# ใช้สำหรับ push การแก้ไขขึ้น Git อัตโนมัติ

param(
    [string]$message = "Auto update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

Write-Host "🔄 Auto Git Push Starting..." -ForegroundColor Green
Write-Host "📁 Working Directory: $(Get-Location)" -ForegroundColor Cyan

# Check for changes
$status = git status --porcelain
if ($status) {
    Write-Host "📝 Changes detected:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    
    # Add all changes
    Write-Host "➕ Adding all changes..." -ForegroundColor Blue
    git add .
    
    # Commit changes
    Write-Host "💾 Committing changes..." -ForegroundColor Magenta
    git commit -m $message
    
    # Push to origin main
    Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Green
    git push origin main
    
    Write-Host "✅ Auto push completed successfully!" -ForegroundColor Green
    Write-Host "🌐 Changes are now live on GitHub" -ForegroundColor Cyan
} else {
    Write-Host "ℹ️  No changes detected. Nothing to commit." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 KingChat Auto Git Push Complete!" -ForegroundColor Green