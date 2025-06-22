// Pinecone client temporarily disabled since vector DB is not available
// import { PineconeClient } from "@pinecone-database/pinecone";

// if (!process.env.PINECONE_API_KEY) {
//   throw new Error("Pinecone api key var missing");
// }

// async function initPinecone() {
//   try {
//     const pinecone = new PineconeClient();
//     await pinecone.init({
//       apiKey: process.env.PINECONE_API_KEY ?? "",
//     });
//     return pinecone;
//   } catch (error) {
//     console.log("error", error);
//     throw new Error("Failed to initialize Pinecone Client");
//   }
// }

// export const pinecone = initPinecone();

// Export a dummy function to avoid import errors
export const pinecone = null;
