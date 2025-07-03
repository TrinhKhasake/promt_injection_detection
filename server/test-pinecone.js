// Use node-fetch v2 for CommonJS compatibility
const fetch = require('node-fetch');
require('dotenv').config({ path: './.env.local' });

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
// Environment is not needed for serverless Pinecone

if (!PINECONE_API_KEY) {
  console.error("Missing Pinecone API key.");
  process.exit(1);
}

// You may need to specify the host directly for serverless Pinecone
// Replace with your actual index host if needed
const PINECONE_INDEX_HOST = process.env.PINECONE_INDEX_HOST || "";
if (!PINECONE_INDEX_HOST) {
  console.error("Please set PINECONE_INDEX_HOST in your .env.local for serverless Pinecone.");
  process.exit(1);
}

const url = `https://${PINECONE_INDEX_HOST}/describe_index_stats`;

fetch(url, {
  method: 'POST',
  headers: {
    "Api-Key": PINECONE_API_KEY,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({})
})
  .then(res => res.json())
  .then(data => {
    console.log("Pinecone index stats:", data);
  })
  .catch(err => {
    console.error("Error connecting to Pinecone:", err);
  });