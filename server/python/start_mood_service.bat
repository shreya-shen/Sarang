@echo off
echo Starting Sarang Mood Analysis Service...
echo.
echo This will start a persistent Python service that keeps ML models loaded in memory
echo for fast mood analysis. The initial startup may take 10-15 seconds to load models.
echo.

cd /d "%~dp0"

echo Installing required packages...
pip install -r requirements_service.txt

echo.
echo Starting the service on http://localhost:8001
echo Press Ctrl+C to stop the service
echo.

python mood_service.py
