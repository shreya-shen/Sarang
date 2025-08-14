@echo off
echo ================================================
echo Ultra-Advanced Mood Detection - Complete Setup
echo ================================================
echo.

echo [1/3] Starting Python Ultra-Advanced Service...
cd /d "%~dp0\python"
start "Python Service" cmd /k "python start_production_service.py"

echo.
echo [2/3] Waiting for service to start...
timeout /t 5 /nobreak >nul

echo.
echo [3/3] Testing Integration...
cd /d "%~dp0"
node test_integration.js

echo.
echo ================================================
echo Setup Complete!
echo ================================================
echo.
echo Your services are now running:
echo   - Python Service: http://localhost:5001
echo   - Node.js Backend: Ready for npm start
echo.
echo Frontend can now call: POST /api/mood/analyze
echo.
pause
