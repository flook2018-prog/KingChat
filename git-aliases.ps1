# KingChat Development Aliases
# วางในไฟล์ PowerShell Profile เพื่อใช้คำสั่งสั้นๆ

# Quick git commands
function gp { param($msg = "Quick update") git add .; git commit -m $msg; git push origin main }
function gf { param($feature) git add .; git commit -m "🔧 Feature: $feature"; git push origin main }
function gh { param($fix) git add .; git commit -m "🔥 HOTFIX: $fix"; git push origin main }
function gd { git add .; git commit -m "🚀 DEPLOY: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"; git push origin main }

Write-Host "📋 KingChat Git Aliases Loaded:" -ForegroundColor Green
Write-Host "   gp 'message'    - Quick push" -ForegroundColor White
Write-Host "   gf 'feature'    - Feature push" -ForegroundColor White  
Write-Host "   gh 'fix'        - Hotfix push" -ForegroundColor White
Write-Host "   gd              - Deploy push" -ForegroundColor White