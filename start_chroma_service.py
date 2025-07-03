#!/usr/bin/env python3
"""
Start the custom ChromaDB service for prompt injection detection
"""

import uvicorn
from chroma_service import app

if __name__ == "__main__":
    print("Starting custom ChromaDB service on port 8001...")
    uvicorn.run(app, host="localhost", port=8001, reload=True) 