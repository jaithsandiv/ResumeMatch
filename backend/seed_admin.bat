@echo off
REM Seed admin user script for ResumeMatch Backend

echo Seeding Admin User...
echo.

cd /d "%~dp0"

REM Check if .env exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo Please copy .env.example to .env and configure your settings.
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist ".venv\Scripts\python.exe" (
    echo ERROR: Virtual environment not found!
    pause
    exit /b 1
)

REM Run the seed script
.venv\Scripts\python.exe seed_admin.py

echo.
pause
