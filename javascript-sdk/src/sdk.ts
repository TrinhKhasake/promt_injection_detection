import {
  DetectRequest,
  DetectResponse,
  Rebuff,
  RebuffError,
  TacticResult,
} from "./interface";
import crypto from "crypto";
import { SdkConfig } from "./config";
import { initPinecone, chromaSimilaritySearch, chromaAddDocument } from "./lib/vectordb";
import getOpenAIInstance from "./lib/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { Document } from "langchain/document";
import Strategy from "./lib/Strategy";
import Heuristic from "./tactics/Heuristic";
import OpenAI from "./tactics/OpenAI";
import Vector from "./tactics/Vector";

function generateCanaryWord(length = 8): string {
  // Generate a secure random hexadecimal canary word
  return crypto.randomBytes(length / 2).toString("hex");
}

export default class RebuffSdk implements Rebuff {
  private sdkConfig: SdkConfig;
  private pineconeStore: PineconeStore | undefined;
  private strategies: Record<string, Strategy> | undefined;
  private defaultStrategy: string;
  private useChroma: boolean;

  /**
   * @deprecated Use `RebuffSdk.init` instead.
   */
  constructor(config: SdkConfig) {
    if (!config || !config.vectorDB) {
      throw new RebuffError("Invalid or missing SDK config: vectorDB is required");
    }
    this.sdkConfig = config;
    this.defaultStrategy = "standard";
    this.useChroma = "chroma" in config.vectorDB;
  }

  public static async init(config: SdkConfig): Promise<RebuffSdk> {
    const sdk = new RebuffSdk(config);
    if (!sdk.useChroma) {
      // Only initialize Pinecone if not using Chroma
      sdk.pineconeStore = await initPinecone(
        config.vectorDB.pinecone.environment,
        config.vectorDB.pinecone.apikey,
        config.vectorDB.pinecone.index,
        {} // openaiEmbeddings placeholder, not used in this refactor
      );
    }
    sdk.strategies = await sdk.getStrategies();
    return sdk;
  }

  private async getStrategies(): Promise<Record<string, Strategy>> {
    if (this.strategies) {
      return this.strategies;
    }
    const openai = {
      conn: getOpenAIInstance(this.sdkConfig.openai.apikey),
      model: this.sdkConfig.openai.model || "gpt-3.5-turbo",
    };
    const heuristicScoreThreshold = 0.75;
    const vectorScoreThreshold = 0.9;
    const openaiScoreThreshold = 0.9;
    this.strategies = {
      "standard": {
        tactics: [
          new Heuristic(heuristicScoreThreshold),
          new Vector(vectorScoreThreshold, this),
          new OpenAI(openaiScoreThreshold, openai.model, openai.conn),
        ]
      },
    };
    return this.strategies;
  }

  async detectInjection({
    userInput = "",
    userInputBase64 = "",
    tacticOverrides = [],
  }: DetectRequest): Promise<DetectResponse> {
    if (userInputBase64) {
      const userInputBuffer = Buffer.from(userInputBase64, "hex");
      userInput = userInputBuffer.toString("utf-8");
    }
    if (!userInput) {
      throw new RebuffError("userInput is required");
    }

    const strategies = await this.getStrategies();
    let injectionDetected = false;
    let tacticResults: TacticResult[] = [];
    for (const tactic of strategies[this.defaultStrategy].tactics) {
      const tacticOverride = tacticOverrides.find(t => t.name === tactic.name);
      if (tacticOverride && tacticOverride.run === false) {
        continue;
      }
      const threshold = tacticOverride?.threshold ?? tactic.defaultThreshold;
      const execution = await tactic.execute(userInput, threshold);
      const result = {
        name: tactic.name,
        score: execution.score,
        threshold,
        detected: execution.score > threshold,
        additionalFields: execution.additionalFields ?? {},
      } as TacticResult;
      if (result.detected) {
        injectionDetected = true;
      }
      tacticResults.push(result);
    }

    return {
      injectionDetected,
      tacticResults,
    } as DetectResponse;
  }

  addCanaryWord(
    prompt: string,
    canaryWord: string = generateCanaryWord(),
    canaryFormat = "<!-- {canary_word} -->"
  ): [string, string] {
    const canaryComment = canaryFormat.replace("{canary_word}", canaryWord);
    const promptWithCanary = `${canaryComment}\n${prompt}`;
    return [promptWithCanary, canaryWord];
  }

  isCanaryWordLeaked(
    userInput: string,
    completion: string,
    canaryWord: string,
    logOutcome = true
  ): boolean {
    if (completion.includes(canaryWord)) {
      if (logOutcome) {
        this.logLeakage(userInput, { completion, "canary_word": canaryWord });
      }
      return true;
    }
    return false;
  }

  // This method is used by the Vector tactic
  async vectorSimilaritySearch(input: string, n_results = 5): Promise<any> {
    if (this.useChroma) {
      return await chromaSimilaritySearch(input, n_results);
    } else {
      if (!this.pineconeStore) throw new RebuffError("Pinecone store not initialized");
      return await this.pineconeStore.similaritySearchWithScore(input, n_results);
    }
  }

  async addVectorDocument(input: string, id: string, metadata: Record<string, any> = {}): Promise<any> {
    if (this.useChroma) {
      return await chromaAddDocument(input, id, metadata);
    } else {
      if (!this.pineconeStore) throw new RebuffError("Pinecone store not initialized");
      // Pinecone add logic here if needed
      return null;
    }
  }

  async logLeakage(
    input: string,
    metaData: Record<string, string>
  ): Promise<void> {
    // Optionally add to vector DB for logging
    // You can call addVectorDocument here if desired
  }
}
