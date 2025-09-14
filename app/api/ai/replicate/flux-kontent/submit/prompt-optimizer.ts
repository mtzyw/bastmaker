import { anthropic } from "@ai-sdk/anthropic";
import { deepseek } from "@ai-sdk/deepseek";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { xai } from "@ai-sdk/xai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { LanguageModel, generateText } from "ai";


// GPT-4.1 nano is cheap and fast, recommend to use it
function getLanguageModel(): LanguageModel | null {
  const provider = process.env.IMAGE_PROMPT_TRANSLATE_PROVIDER;
  const modelId = process.env.IMAGE_PROMPT_TRANSLATE_MODEL;

  if (!provider || !modelId) {
    console.warn("Missing IMAGE_PROMPT_TRANSLATE_PROVIDER or IMAGE_PROMPT_TRANSLATE_MODEL.");
    return null;
  }

  switch (provider) {
    case "openai":
      if (!process.env.OPENAI_API_KEY) {
        console.error("Missing OPENAI_API_KEY for translation provider.");
        return null;
      }
      return openai(modelId);

    case "anthropic":
      if (!process.env.ANTHROPIC_API_KEY) {
        console.error("Missing ANTHROPIC_API_KEY for translation provider.");
        return null;
      }
      return anthropic(modelId);

    case "google":
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY for translation provider.");
        return null;
      }
      return google(modelId);

    case "deepseek":
      if (!process.env.DEEPSEEK_API_KEY) {
        console.error("Missing DEEPSEEK_API_KEY for translation provider.");
        return null;
      }
      return deepseek(modelId);

    case "xai":
      if (!process.env.XAI_API_KEY) {
        console.error("Missing XAI_API_KEY for translation provider.");
        return null;
      }
      return xai(modelId);

    case "openrouter":
      if (!process.env.OPENROUTER_API_KEY) {
        console.error("Missing OPENROUTER_API_KEY for translation provider.");
        return null;
      }
      const openrouterProvider = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
      });
      return openrouterProvider.chat(modelId);

    default:
      console.error(`Unsupported translation provider: ${provider}`);
      return null;
  }
}

export async function translateAndOptimizePrompt(
  prompt: string
): Promise<string> {
  const model = getLanguageModel();

  if (!model) {
    console.warn(
      "Translation model not configured, skipping prompt optimization."
    );
    return prompt;
  }

  try {
    const { text } = await generateText({
      model,
      // prompt: `Translate the following text to English and optimize it as a prompt for an AI image generation model. Output only the final optimized English prompt, without any other text or explanation. The original text is: "${prompt}"`,
      prompt: `Translate and optimize the following text into an English prompt for an AI image generation model. Preserve the original meaning precisely without adding extraneous details or creative interpretations. The original text is: "${prompt}" - Now provide only the most accurate and concise English version suitable for image generation, strictly adhering to the source content.`
    });
    return text.trim();
  } catch (error) {
    console.error("Failed to translate and optimize prompt:", error);
    return prompt;
  }
} 