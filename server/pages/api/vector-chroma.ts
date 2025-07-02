import type { NextApiRequest, NextApiResponse } from "next";
import { addVector, queryVector } from "@/lib/chroma-client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, input, id, metadata, n_results } = req.body;

  try {
    if (action === "similaritySearch") {
      if (!input) {
        return res.status(400).json({ error: "Missing input for similarity search" });
      }
      const results = await queryVector(input, n_results || 5);
      return res.status(200).json({ results });
    } else if (action === "addDocument") {
      if (!input || !id) {
        return res.status(400).json({ error: "Missing input or id for addDocument" });
      }
      const result = await addVector(input, id, metadata || {});
      return res.status(200).json({ result });
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
} 