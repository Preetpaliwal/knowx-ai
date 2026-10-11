@echo off
echo ====================================
echo Starting StudyMate AI Full Stack
echo ====================================
echo.

REM Start Backend
start "StudyMate Backend (Port 8000)" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate.bat && python -m uvicorn main:app --reload --port 8000"

REM Start Frontend
start "StudyMate Frontend (Port 3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Services launched:
echo   - Backend:  http://localhost:8000 (API Docs: http://localhost:8000/docs)
echo   - Frontend: http://localhost:3000
echo.
pause
