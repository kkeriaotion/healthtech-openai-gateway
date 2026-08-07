import OpenAI from "openai";

import { clinicalAIClient } from "./clinical_ai_client.ts";

const syntheticNote = [
  "Adult patient seen for a scheduled follow-up.",
  "Reports improved sleep after reducing afternoon caffeine.",
  "No identifying details are present in this synthetic record.",
].join(" ");

async function main(): Promise<void> {
  const ai = clinicalAIClient();
  const completion = await ai.chat.completions.create({
    model: "auto",
    messages: [
      {
        role: "system",
        content: "Summarize the de-identified clinical note in one calm, factual sentence.",
      },
      { role: "user", content: syntheticNote },
    ],
  });

  const summary = completion.choices[0]?.message.content;
  if (!summary) {
    throw new Error("The completion did not contain a summary.");
  }

  console.log(summary);
}

main().catch((error: unknown) => {
  const message = error instanceof OpenAI.APIError ? error.message : String(error);
  console.error(`Clinical summary request failed: ${message}`);
  process.exitCode = 1;
});
