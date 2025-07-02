import { NextApiRequest, NextApiResponse } from "next";

// Import the counters from detect API
import { totalRequests, injectionsDetected } from "./detect";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "not_allowed", message: "Method not allowed" });
  }
  let learnedAttackSignatures = 0;
  try {
    const chromaRes = await fetch("http://localhost:8001/list");
    const chromaList = await chromaRes.json();
    learnedAttackSignatures = (chromaList && chromaList.ids && chromaList.ids.length > 0) ? chromaList.ids.length : 0;
  } catch (err) {
    // ignore, keep as 0
  }
  return res.status(200).json({
    totalRequests,
    injectionsDetected,
    learnedAttackSignatures
  });
} 