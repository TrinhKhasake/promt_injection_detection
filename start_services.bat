@echo off
REM Try to read OPENAI_API_KEY from .env file
setlocal EnableDelayedExpansion
set OPENAI_API_KEY=
if exist .env (
  for /f "usebackq tokens=1,2 delims==" %%A in (".env") do (
    if "%%A"=="OPENAI_API_KEY" set OPENAI_API_KEY=%%B
  )
)

if "%OPENAI_API_KEY%"=="" (
  echo [ERROR] OPENAI_API_KEY not found in .env file. Please set it manually in this script or in your .env file.
  pause
  exit /b 1
)

echo Starting Prompt Injection Detection Services...
echo.

echo Starting ChromaDB service on port 8001...
start "ChromaDB Service" cmd /k "set OPENAI_API_KEY=%OPENAI_API_KEY% && python -m uvicorn chroma_service:app --reload --port 8001"

echo Waiting 3 seconds for ChromaDB to start...
timeout /t 3 /nobreak > nul

echo Starting Next.js server on port 3000...
start "Next.js Server" cmd /k "cd server && npm run dev"

echo.
echo Both services are starting...
echo - ChromaDB: http://localhost:8001
echo - Next.js App: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul 