import { PineconeStore } from "langchain/vectorstores/pinecone";
import { PineconeClient } from "@pinecone-database/pinecone";
import { SdkConfig } from "../config";

// Pinecone logic remains unchanged
async function initPinecone(
  environment: string,
  apiKey: string,
  index: string,
  openaiEmbeddings: any,
): Promise<PineconeStore> {
  if (!environment) {
    throw new Error("Pinecone environment definition missing");
  }
  if (!apiKey) {
    throw new Error("Pinecone apikey definition missing");
  }
  if (!index) {
    throw new Error("Pinecone index definition missing");
  }
  try {
    const pinecone = new PineconeClient();
    await pinecone.init({
      environment,
      apiKey,
    });
    const pineconeIndex = pinecone.Index(index);
    const vectorStore = await PineconeStore.fromExistingIndex(
      openaiEmbeddings,
      { pineconeIndex }
    );
    return vectorStore;
  } catch (error) {
    console.log("error", error);
    throw new Error("Failed to initialize Pinecone Client");
  }
}

function getApiUrl(path: string): string {
  if (typeof window === "undefined") {
    // Server-side: use absolute URL
    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    return base + path;
  } else {
    // Client-side: use relative URL
    return path;
  }
}

// Chroma logic is now API-based
async function chromaSimilaritySearch(input: string, n_results = 5): Promise<any> {
  const response = await fetch(getApiUrl("/api/vector-chroma"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "similaritySearch", input, n_results })
  });
  if (!response.ok) {
    throw new Error(`Chroma similarity search failed: ${response.status}`);
  }
  return (await response.json()).results;
}

async function chromaAddDocument(input: string, id: string, metadata: Record<string, any> = {}): Promise<any> {
  const response = await fetch(getApiUrl("/api/vector-chroma"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "addDocument", input, id, metadata })
  });
  if (!response.ok) {
    throw new Error(`Chroma add document failed: ${response.status}`);
  }
  return (await response.json()).result;
}

export { initPinecone, chromaSimilaritySearch, chromaAddDocument };
