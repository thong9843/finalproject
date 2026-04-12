@echo off
title VLU Enterprise Link
echo ======================================
echo Khoi dong He thong VLU Enterprise Link
echo ======================================

echo [1/2] Dang khoi dong Backend...
start "Backend Server" cmd /c "cd backend && npm run dev"

echo [2/2] Dang khoi dong Frontend...
start "Frontend Server" cmd /c "cd frontend && npm run dev"

echo --------------------------------------
echo Hai server dang chay o cac cua so rieng biet.
echo De tat he thong, hay tat hai cua so mau den moi mo.
echo --------------------------------------
pause
