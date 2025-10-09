REM KingChat Quick Git Commands

REM Quick push
echo Creating gp.bat for quick push...
echo @echo off > gp.bat
echo git add . >> gp.bat
echo git commit -m "Quick update: %%1" >> gp.bat
echo git push origin main >> gp.bat

REM Feature push  
echo Creating gf.bat for feature push...
echo @echo off > gf.bat
echo git add . >> gf.bat
echo git commit -m "Feature: %%1" >> gf.bat
echo git push origin main >> gf.bat

REM Hotfix push
echo Creating gh.bat for hotfix push...
echo @echo off > gh.bat
echo git add . >> gh.bat
echo git commit -m "HOTFIX: %%1" >> gh.bat
echo git push origin main >> gh.bat

REM Deploy push
echo Creating gd.bat for deploy push...
echo @echo off > gd.bat
echo git add . >> gd.bat
echo git commit -m "DEPLOY: KingChat update" >> gd.bat
echo git push origin main >> gd.bat

echo Git shortcuts created!
echo Usage:
echo   gp "message"     - Quick push
echo   gf "feature"     - Feature push  
echo   gh "fix"         - Hotfix push
echo   gd               - Deploy push