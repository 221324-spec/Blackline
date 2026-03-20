@echo off
echo Starting Buyer's API Prediction Service...
cd /d "%~dp0buyers-api-service"
python main.py
pause