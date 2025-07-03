const fetch = require('node-fetch');

const CHROMA_SERVICE_URL = 'http://localhost:8001';

async function addVector(document, id, metadata = {}) {
  try {
    console.log('[Node.js] Calling /add on ChromaDB:', { document, id, metadata });
    const response = await fetch(`${CHROMA_SERVICE_URL}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document, id, metadata })
    });
    
    if (!response.ok) {
      throw new Error(`ChromaDB /add failed with status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('[Node.js] ChromaDB /add response:', result);
    return result;
  } catch (err) {
    console.error('[Node.js] Error calling /add on ChromaDB:', err);
    throw err;
  }
}

async function queryVector(query, n_results = 1) {
  const res = await fetch(`${CHROMA_SERVICE_URL}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, n_results })
  });
  return await res.json();
}

module.exports = { addVector, queryVector }; 