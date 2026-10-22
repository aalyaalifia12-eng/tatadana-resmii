@echo off
title TataDana - Fast Launcher
set "PATH=C:\Users\ALYA ALIFIA\.gemini\antigravity\tools\node;%PATH%"
cd /d "C:\Users\ALYA ALIFIA\.gemini\antigravity\scratch\tatadana"

echo ===================================================
echo   TataDana - Catat Keuangan Langsung dari Telegram
echo ===================================================
echo Membuka aplikasi di browser...
start http://localhost:3000

echo Menjalankan production server...
call npm run start
pause
