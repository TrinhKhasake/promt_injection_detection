from fastapi import FastAPI, Request, Response, Form
from fastapi.middleware.cors import CORSMiddleware
import chromadb
import uvicorn
import os

app = FastAPI()

# Allow CORS for local development (adjust origins as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create persistent ChromaDB client with data directory
persistent_dir = "./chroma_data"
os.makedirs(persistent_dir, exist_ok=True)
client = chromadb.PersistentClient(path=persistent_dir)
collection = client.get_or_create_collection("rebuff-prompt-injections")

@app.post("/add")
async def add_vector(request: Request):
    data = await request.json()
    print(f"[ChromaDB] Received /add: {data}")
    collection.add(
        documents=[data["document"]],
        metadatas=[data.get("metadata", {})],
        ids=[data["id"]]
    )
    print(f"[ChromaDB] Added document with id: {data['id']}")
    return {"status": "ok"}

@app.post("/query")
async def query_vector(request: Request):
    data = await request.json()
    print(f"[ChromaDB] Received /query: {data}")
    results = collection.query(
        query_texts=[data["query"]],
        n_results=data.get("n_results", 1)
    )
    print(f"[ChromaDB] Query results: {results}")
    return results

@app.get("/list")
async def list_vectors(request: Request):
    results = collection.get()
    print(f"[ChromaDB] Listing all vectors: {results}")
    accept = request.headers.get("accept", "")
    if "text/html" in accept:
        # Render as HTML table
        ids = results.get("ids", [])
        docs = results.get("documents", [])
        metas = results.get("metadatas", [])
        embeds = results.get("embeddings") or []
        uris = results.get("uris") or []
        datas = results.get("data") or []
        table = """
        <html><head><title>ChromaDB Vectors</title></head><body>
        <h2>ChromaDB Vectors</h2>
        <table border='1' cellpadding='5' cellspacing='0'>
        <tr><th>ID</th><th>Document</th><th>Metadata</th><th>Embedding</th><th>URI</th><th>Data</th><th>Action</th></tr>
        """
        for i in range(len(ids)):
            table += f"<tr>"
            table += f"<td>{ids[i]}</td>"
            table += f"<td>{docs[i] if i < len(docs) else ''}</td>"
            table += f"<td>{metas[i] if i < len(metas) else ''}</td>"
            table += f"<td>{embeds[i] if i < len(embeds) else ''}</td>"
            table += f"<td>{uris[i] if i < len(uris) else ''}</td>"
            table += f"<td>{datas[i] if i < len(datas) else ''}</td>"
            # Add Delete button
            table += f"<td><form method='post' action='/delete/{ids[i]}' style='display:inline;'><button type='submit' onclick='return confirm(\"Delete this entry?\")'>Delete</button></form></td>"
            table += f"</tr>"
        table += "</table></body></html>"
        return Response(content=table, media_type="text/html")
    return results

@app.post("/delete/{id}")
async def delete_vector(id: str):
    print(f"[ChromaDB] Deleting vector with id: {id}")
    collection.delete(ids=[id])
    # Redirect back to /list
    html = """
    <html><head><meta http-equiv='refresh' content='0; url=/list'></head><body>Deleted. <a href='/list'>Back to list</a></body></html>"""
    return Response(content=html, media_type="text/html")

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8001)