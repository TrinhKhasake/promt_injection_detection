import { RebuffSdk } from "rebuff";
import { getEnvironmentVariable } from "./general-helpers";

const getRebuffSdk = () => {
  return new RebuffSdk({
    openai: {
      apikey: getEnvironmentVariable("OPENAI_API_KEY"),
      model: "gpt-3.5-turbo",
    },
    vectorDB: {
      chroma: {
        url: "http://localhost:8001",
        collectionName: "rebuff-prompt-injections"
      }
    }
  });
};

export const rebuff = {
  async detectInjection(request: any) {
    const sdk = getRebuffSdk();
    try {
      return await sdk.detectInjection(request);
    } catch (error) {
      if (request.runVectorCheck) {
        console.log(
          "Vector DB connection failed, falling back to heuristic and LLM checks."
        );
        const requestWithoutVector = {
          ...request,
          runVectorCheck: false,
        };
        // Retry with the same SDK instance, but with vector check disabled
        return sdk.detectInjection(requestWithoutVector);
      }
      // If the error occurred even without the vector check, re-throw it
      throw error;
    }
  },
};
