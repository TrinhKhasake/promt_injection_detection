import { RebuffError, TacticName } from "../interface";
import Tactic, { TacticExecution } from "./Tactic";

export default class Vector implements Tactic {
  name = TacticName.VectorDB;
  defaultThreshold: number;

  // Instead of a VectorStore, we now expect the SDK instance
  private sdk: any;

  constructor(threshold: number, sdk: any) {
    this.defaultThreshold = threshold;
    this.sdk = sdk;
  }

  async execute(input: string, thresholdOverride?: number): Promise<TacticExecution> {
    const threshold = thresholdOverride || this.defaultThreshold;
    try {
      const topK = 20;
      const results = await this.sdk.vectorSimilaritySearch(input, topK);
  
      // Defensive: if results is not an array, return 0 score
      if (!Array.isArray(results)) {
        return { score: 0, additionalFields: {} };
      }
  
      let topScore = 0;
      let countOverMaxVectorScore = 0;
  
      for (const [_, score] of results) {
        if (score == undefined) {
          continue;
        }
  
        if (score > topScore) {
          topScore = score;
        }
  
        if (score >= threshold) {
          countOverMaxVectorScore++;
        }
      }
  
      // If a match exists (topScore >= threshold), additionalFields is non-empty
      // Otherwise, additionalFields is an empty object
      const additionalFields = topScore >= threshold ? { found: true } : {};
      return { score: topScore, additionalFields };
    } catch (error) {
      throw new RebuffError(`Error in getting score for vector tactic: ${error}`);
    }
  }
}
