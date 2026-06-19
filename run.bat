@echo off
echo ===================================================
echo   Khoi chay he thong CosBook (Backend & Frontend)  
echo ===================================================
echo.

echo [1/2] Dang khoi dong Backend API o cua so moi...
start "CosBook Backend API" cmd /k "cd Backend && dotnet run"

echo [2/2] Dang khoi dong Frontend HTTP Server o cua so moi (Port 8000)...
start "CosBook Frontend Server" cmd /k "python -m http.server 8000 --directory Frontend"

echo.
echo ===================================================
echo  He thong da duoc khoi chay!
echo  - Giao dien nguoi dung: http://localhost:8000
echo  - Backend API: http://localhost:5056
echo ===================================================
echo.
pause
