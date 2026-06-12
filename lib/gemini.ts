import { GoogleGenAI } from "@google/genai";

import { requireServerEnv } from "@/lib/env";

export const GEMINI_TEXT_MODEL = "gemini-3.5-flash";
export const GEMINI_RESEARCH_MODEL = "gemini-2.5-flash";
export const GEMINI_FAST_MODEL = "gemini-3.1-flash-lite";

export function createGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: requireServerEnv("GEMINI_API_KEY"),
  });
}
