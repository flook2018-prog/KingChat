# Git Auto Push Functions
function Push-Quick {
    param([string]$message = "Auto update: $(Get-Date -Format 'HH:mm:ss')")
    
    Write-Host "🚀 Quick Push: $message" -ForegroundColor Green
    git add .
    git commit -m $message
    git push origin main
    Write-Host "✅ Pushed to GitHub!" -ForegroundColor Green
}

function Push-Feature {
    param([string]$feature = "new feature")
    
    $msg = "🔧 Feature: $feature"
    Write-Host "🔧 Feature Push: $msg" -ForegroundColor Blue
    git add .
    git commit -m $msg
    git push origin main
    Write-Host "✅ Feature pushed!" -ForegroundColor Green
}

function Push-Hotfix {
    param([string]$fix = "urgent fix")
    
    $msg = "🔥 HOTFIX: $fix"
    Write-Host "🔥 Hotfix Push: $msg" -ForegroundColor Red
    git add .
    git commit -m $msg
    git push origin main
    Write-Host "✅ Hotfix deployed!" -ForegroundColor Green
}

function Push-Deploy {
    $msg = "🚀 DEPLOY: KingChat $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    Write-Host "🚀 Deploy Push: $msg" -ForegroundColor Magenta
    git add .
    git commit -m $msg
    git push origin main
    Write-Host "✅ Deployed to Railway!" -ForegroundColor Green
    Write-Host "🌐 Live: https://kingchat-production.up.railway.app" -ForegroundColor Cyan
}

# Set aliases
Set-Alias gp Push-Quick
Set-Alias gf Push-Feature  
Set-Alias gh Push-Hotfix
Set-Alias gd Push-Deploy

Write-Host "📋 Git Commands Ready:" -ForegroundColor Yellow
Write-Host "   gp 'message'    - Quick push" -ForegroundColor White
Write-Host "   gf 'feature'    - Feature push" -ForegroundColor White
Write-Host "   gh 'fix'        - Hotfix push" -ForegroundColor White
Write-Host "   gd              - Deploy push" -ForegroundColor White