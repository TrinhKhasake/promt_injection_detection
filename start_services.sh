#!/bin/bash

echo "Starting Prompt Injection Detection Services..."
echo

echo "Starting ChromaDB service on port 8001..."
gnome-terminal --title="ChromaDB Service" -- bash -c "python -m uvicorn chroma_service:app --reload --port 8001; exec bash" &

echo "Waiting 3 seconds for ChromaDB to start..."
sleep 3

echo "Starting Next.js server on port 3000..."
gnome-terminal --title="Next.js Server" -- bash -c "cd server && npm run dev; exec bash" &

echo
echo "Both services are starting..."
echo "- ChromaDB: http://localhost:8001"
echo "- Next.js App: http://localhost:3000"
echo
echo "Press Ctrl+C to stop all services..."
wait 