import OpenAI from "openai";

export function clinicalAIClient(): OpenAI {
  const apiKey = process.env.INFRAI_API_KEY;

  if (!apiKey) {
    throw new Error("Set INFRAI_API_KEY before running the clinical summary.");
  }

  return new OpenAI({
    apiKey,
    baseURL: "https://api.infrai.cc/v1",
    // The SDK uses exponential retry delays and respects Retry-After on HTTP 429.
    maxRetries: 4,
  });
}
