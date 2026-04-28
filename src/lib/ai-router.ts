import { RECIPE_DETAILS_PROMPT, RECIPE_SEARCH_PROMPT, TASK_ADJUSTMENT_PROMPT } from "./prompts";
import { geminiAgent, Recipe, RecipeDetails, TaskAdjustment } from "./gemini";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_TEXT_MODEL || "qwen/qwen3-32b";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

function extractJson(text: string): string {
  const trimmed = text.trim();

  // Remove qwen-style reasoning blocks that may precede JSON.
  const withoutThinkBlocks = trimmed.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  const fencedMatch = withoutThinkBlocks.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  // Fallback: extract first JSON array/object span in plain text.
  const firstArray = withoutThinkBlocks.indexOf("[");
  const firstObject = withoutThinkBlocks.indexOf("{");
  const startCandidates = [firstArray, firstObject].filter((idx) => idx >= 0);
  if (startCandidates.length === 0) return withoutThinkBlocks;

  const start = Math.min(...startCandidates);
  const arrayEnd = withoutThinkBlocks.lastIndexOf("]");
  const objectEnd = withoutThinkBlocks.lastIndexOf("}");
  const end = Math.max(arrayEnd, objectEnd);

  if (end > start) {
    return withoutThinkBlocks.slice(start, end + 1).trim();
  }

  return withoutThinkBlocks;
}

async function callGroqJson<T>(prompt: string): Promise<T> {
  if (!GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: "Return strictly valid JSON only, with no markdown.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API failed: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Groq API returned empty content");
  }

  return JSON.parse(extractJson(content)) as T;
}

export const aiRouter = {
  textProviderName() {
    return GROQ_API_KEY ? `groq:${GROQ_MODEL}` : "gemini:fallback";
  },

  async searchRecipes(
    query: string,
    diet?: string,
    count: number = 5,
    language: string = "en",
    ingredients: string[] = []
  ): Promise<{ recipes: Recipe[]; correctedQuery: string }> {
    try {
      const prompt = RECIPE_SEARCH_PROMPT(query, diet, count, language, ingredients);
      const raw = await callGroqJson<{ corrected_query?: string; recipes?: Recipe[] } | Recipe[]>(prompt);
      if (Array.isArray(raw)) {
        return { recipes: raw, correctedQuery: query };
      }
      return { recipes: raw.recipes || [], correctedQuery: query };
    } catch {
      return geminiAgent.searchRecipes(query, diet, count, language, ingredients);
    }
  },

  async getRecipeDetails(id: string, title: string, language: string = "en"): Promise<RecipeDetails> {
    try {
      const prompt = RECIPE_DETAILS_PROMPT(title, language);
      const details = await callGroqJson<Omit<RecipeDetails, "id">>(prompt);
      return { id, ...details };
    } catch {
      return geminiAgent.getRecipeDetails(id, title, language);
    }
  },

  async suggestTaskAdjustments(
    originalStep: string,
    validationResult: string,
    remainingSteps: Array<{ step_number: number; instruction: string }>
  ): Promise<TaskAdjustment> {
    try {
      const prompt = TASK_ADJUSTMENT_PROMPT(originalStep, validationResult, remainingSteps);
      return await callGroqJson<TaskAdjustment>(prompt);
    } catch {
      return geminiAgent.suggestTaskAdjustments(originalStep, validationResult, remainingSteps);
    }
  },
};

