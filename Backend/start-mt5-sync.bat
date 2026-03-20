@echo off
echo Starting MT5 Sync Service...
cd /d "%~dp0mt5-sync-service"
python main.py
pause
