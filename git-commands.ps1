# Quick Git Commands for KingChat Development

# Function to quickly commit and push with custom message
function Quick-Push {
    param([string]$msg = "Quick update: $(Get-Date -Format 'HH:mm:ss')")
    
    Write-Host "🚀 Quick Push: $msg" -ForegroundColor Green
    git add .
    git commit -m $msg
    git push origin main
    Write-Host "✅ Pushed to GitHub!" -ForegroundColor Green
}

# Function to push with feature tag
function Feature-Push {
    param([string]$feature = "feature")
    
    $msg = "🔧 $feature update: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    Write-Host "🔧 Feature Push: $msg" -ForegroundColor Blue
    git add .
    git commit -m $msg
    git push origin main
    Write-Host "✅ Feature pushed!" -ForegroundColor Green
}

# Function to push hotfix
function Hotfix-Push {
    param([string]$fix = "hotfix")
    
    $msg = "🔥 HOTFIX: $fix - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    Write-Host "🔥 Hotfix Push: $msg" -ForegroundColor Red
    git add .
    git commit -m $msg
    git push origin main
    Write-Host "✅ Hotfix deployed!" -ForegroundColor Green
}

# Function to auto deploy to Railway
function Deploy-Now {
    param([string]$version = "auto")
    
    $msg = "🚀 DEPLOY: KingChat $version - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "🚀 Deploying: $msg" -ForegroundColor Magenta
    git add .
    git commit -m $msg
    git push origin main
    Write-Host "✅ Deployed to Railway!" -ForegroundColor Green
    Write-Host "🌐 Live: https://kingchat-production.up.railway.app" -ForegroundColor Cyan
}

# Display available commands
Write-Host "📋 KingChat Git Commands Available:" -ForegroundColor Yellow
Write-Host "   Quick-Push 'message'     - Quick commit and push" -ForegroundColor White
Write-Host "   Feature-Push 'feature'   - Push new feature" -ForegroundColor White
Write-Host "   Hotfix-Push 'fix'        - Push urgent fix" -ForegroundColor White
Write-Host "   Deploy-Now 'version'     - Deploy to production" -ForegroundColor White
Write-Host ""
Write-Host "Example: Quick-Push 'Updated login page'" -ForegroundColor Green