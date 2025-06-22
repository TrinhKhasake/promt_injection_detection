import { RebuffSdk, VectorDbConfig } from "rebuff";
import { getEnvironmentVariable } from "./general-helpers";

// Temporarily disable vector DB since ChromaDB access is not available
// and Pinecone requires paid tier for serverless
// We'll re-enable this when ChromaDB access is available

// Create a minimal vector DB config that won't actually connect
const minimalVectorDB: VectorDbConfig = {
  chroma: {
    url: "http://localhost:8000", // Dummy URL
    collectionName: "dummy-collection", // Dummy collection
  }
};

// Create the base Rebuff SDK
const baseRebuff = new RebuffSdk({
  openai: {
    apikey: getEnvironmentVariable("OPENAI_API_KEY"),
    model: "gpt-3.5-turbo",
  },
  vectorDB: minimalVectorDB, // Minimal config to satisfy interface
});

// Create a wrapper that handles vector DB errors
export const rebuff = {
  ...baseRebuff,
  async detectInjection(request: any) {
    try {
      return await baseRebuff.detectInjection(request);
    } catch (error) {
      console.log("Vector DB error in detectInjection, falling back to heuristic and language model only:", error);
      
      // If vector DB fails, try without vector checking
      const requestWithoutVector = {
        ...request,
        runVectorCheck: false,
        tacticOverrides: request.tacticOverrides?.filter((t: any) => t.name !== 'vector_db') || []
      };
      
      return await baseRebuff.detectInjection(requestWithoutVector);
    }
  }
};
