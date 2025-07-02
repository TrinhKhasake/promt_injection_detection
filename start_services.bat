@echo off
echo Starting Prompt Injection Detection Services...
echo.

echo Starting ChromaDB service on port 8001...
start "ChromaDB Service" cmd /k "python -m uvicorn chroma_service:app --reload --port 8001"

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