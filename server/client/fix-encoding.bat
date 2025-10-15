@echo off
chcp 65001 >nul
cd /d "C:\Users\ADMIN\Desktop\KingChat01\KingChat01\server\client"

echo Replacing files with UTF-8 encoded versions...

copy /y "quick-messages-new.html" "quick-messages-working.html"
copy /y "settings-new.html" "settings-working.html"

echo Done!
pause