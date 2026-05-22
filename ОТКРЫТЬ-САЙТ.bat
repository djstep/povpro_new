@echo off

chcp 65001 >nul

cd /d "%~dp0"

echo Запуск Next.js на http://localhost:3000

start "" "http://localhost:3000/"

npm run dev

