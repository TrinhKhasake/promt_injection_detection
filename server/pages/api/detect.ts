import { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";
import { rebuff } from "@/lib/rebuff";
import {
  runMiddleware,
  checkApiKeyAndReduceBalance,
} from "@/lib/detect-helpers";
import { ApiFailureResponse } from "@types";
import { queryVector, addVector } from "@/lib/chroma-client";

const cors = Cors({
  methods: ["POST"],
});

let totalRequests = 0;
let injectionsDetected = 0;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  await runMiddleware(req, res, cors);
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "not_allowed",
      message: "Method not allowed",
    } as ApiFailureResponse);
  }
  try {
    totalRequests += 1;
    // Extract the API key from the Authorization header
    const apiKey = req.headers.authorization?.split(" ")[1];

    // Assert that the API key is present
    if (!apiKey) {
      return res.status(401).json({
        error: "unauthorized",
        message: "Missing API key",
      } as ApiFailureResponse);
    }

    // Check if the API key is valid and reduce the account balance
    const { success, message } = await checkApiKeyAndReduceBalance(apiKey);

    if (!success) {
      return res.status(401).json({
        error: "unauthorized",
        message: message,
      } as ApiFailureResponse);
    }

    const {
      userInputBase64,
      runHeuristicCheck = true,
      runVectorCheck = false,
      runLanguageModelCheck = true,
      maxHeuristicScore = null,
      maxModelScore = null,
      maxVectorScore = null,
      userInput = "",
    } = req.body;
    console.log('[Node.js] /api/detect called with:', { userInput, runVectorCheck });
    let chromaResults = null;
    let learnedAttackSignatures = 0;
    if (runVectorCheck && userInput) {
      try {
        chromaResults = await queryVector(userInput, 3);
      } catch (err) {
        console.error("ChromaDB query error:", err);
      }
    }
    // Get all current signatures from ChromaDB
    let chromaList = null;
    try {
      const res = await fetch('http://localhost:8001/list');
      chromaList = await res.json();
      learnedAttackSignatures = (chromaList && chromaList.ids && chromaList.ids.length > 0) ? chromaList.ids.length : 0;
    } catch (err) {
      console.error("ChromaDB list error:", err);
    }
    try {
      const resp = await rebuff.detectInjection({
        userInput,
        userInputBase64,
        runHeuristicCheck,
        runVectorCheck: false,
        runLanguageModelCheck,
        maxHeuristicScore,
        maxModelScore,
        maxVectorScore,
      });
      console.log('[Node.js] Detection result:', resp);
      
      // Add to ChromaDB if injection detected and not already present
      if (resp.injectionDetected && userInput) {
        injectionsDetected += 1;
        // Check if already exists in ChromaDB
        const documents = chromaList && chromaList.documents ? chromaList.documents : [];
        const exists = documents.some(doc => doc === userInput);
        
        console.log('[Node.js] ChromaDB check:', {
          userInput,
          existingDocuments: documents,
          exists,
          chromaList: chromaList
        });
        
        if (!exists) {
          console.log('[Node.js] Adding unique injection to ChromaDB...');
          try {
            await addVector(userInput, `injection-${Date.now()}`, { detected: true });
            // learnedAttackSignatures will be updated on next fetch
            console.log('[Node.js] Successfully added to ChromaDB.');
          } catch (error) {
            console.error('[Node.js] Failed to add to ChromaDB:', error);
          }
        } else {
          console.log('[Node.js] Injection already exists in ChromaDB, not adding.');
        }
      }
      
      // Attach ChromaDB results and learned attack signatures for demonstration
      return res.status(200).json({ ...resp, chromaResults, learnedAttackSignatures, totalRequests, injectionsDetected });
    } catch (error) {
      console.error("Error in detecting injection:");
      console.error(error);
      return res.status(400).json({
        error: "bad_request",
        message: error.message,
      } as ApiFailureResponse);
    }
  } catch (error) {
    console.error("Error in detect API:");
    console.error(error);
    return res.status(500).json({
      error: "server_error",
      message: "Internal server error",
    } as ApiFailureResponse);
  }
}
