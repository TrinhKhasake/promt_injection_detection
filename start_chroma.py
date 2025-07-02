import chromadb
import time
import requests
import threading

def start_chroma_server():
    """Start ChromaDB server"""
    try:
        print("Starting ChromaDB server...")
        chromadb.run_server(host='localhost', port=8000)
    except Exception as e:
        print(f"Error starting ChromaDB: {e}")

def test_connection():
    """Test connection to ChromaDB"""
    time.sleep(3)  # Wait for server to start
    try:
        response = requests.get('http://localhost:8000', timeout=10)
        print(f"ChromaDB is running! Status: {response.status_code}")
        return True
    except Exception as e:
        print(f"ChromaDB not ready: {e}")
        return False

if __name__ == "__main__":
    # Start server in a separate thread
    server_thread = threading.Thread(target=start_chroma_server, daemon=True)
    server_thread.start()
    
    # Test connection
    if test_connection():
        print("ChromaDB is ready to use!")
        # Keep the script running
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("Stopping ChromaDB server...")
    else:
        print("Failed to start ChromaDB server") 