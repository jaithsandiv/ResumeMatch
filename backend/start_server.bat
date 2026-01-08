@echo off
REM Quick start script for ResumeMatch Backend

echo Starting ResumeMatch Backend Server...
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
    echo Please run setup first.
    pause
    exit /b 1
)

REM Start the server
echo Starting server at http://localhost:8000
echo Swagger UI available at http://localhost:8000/docs
echo.
echo Press CTRL+C to stop the server
echo.

.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
