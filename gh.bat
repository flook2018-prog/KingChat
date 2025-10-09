@echo off 
git add . 
git commit -m "HOTFIX: %1" 
git push origin main 
