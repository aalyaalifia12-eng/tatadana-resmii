@echo off
title TataDana - Telegram Bot Runner
set "PATH=C:\Users\ALYA ALIFIA\.gemini\antigravity\tools\node;%PATH%"
cd /d "C:\Users\ALYA ALIFIA\.gemini\antigravity\scratch\tatadana"

echo ===================================================
echo   TataDana - Telegram Bot Polling Runner
echo ===================================================
call npm run bot:poll
pause
