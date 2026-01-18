import { generateObject } from "ai"
import { createOllama } from "ollama-ai-provider-v2"
import { z } from "zod"

// Create Ollama Cloud provider
const ollama = createOllama({
  baseURL: "https://ollama.com/api",
  headers: {
    Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
  },
})

// Fallback model string for Vercel AI Gateway (OpenAI)
const FALLBACK_MODEL = "openai/gpt-4o-mini"

const FilterSchema = z.object({
  filters: z.object({
    // List filters - these INCLUDE the specified values  
    provider: z.array(z.string()).describe("Provider values to INCLUDE (all others excluded). Empty array means no filter."),
    mode: z.array(z.string()).describe("Mode values to INCLUDE (all others excluded). Empty array means no filter."),
    // Boolean filters - true means "only show models with this capability"
    vision: z.boolean().optional().describe("Set true to show only models with vision"),
    audio: z.boolean().optional().describe("Set true to show only models with audio"),
    functionCalling: z.boolean().optional().describe("Set true to show only models with function calling"),
    reasoning: z.boolean().optional().describe("Set true to show only models with reasoning"),
    webSearch: z.boolean().optional().describe("Set true to show only models with web search"),
    promptCaching: z.boolean().optional().describe("Set true to show only models with prompt caching"),
    // Range filters
    maxInputCost: z.number().describe("Maximum input cost per 1M tokens in dollars. Use 999999 for no limit."),
    maxOutputCost: z.number().describe("Maximum output cost per 1M tokens in dollars. Use 999999 for no limit."),
    minContext: z.number().describe("Minimum context window in tokens. Use 0 for no minimum."),
    minOutputTokens: z.number().describe("Minimum max output tokens. Use 0 for no minimum."),
    excludeDeprecated: z.boolean().describe("Set true to exclude deprecated models, false to include all"),
  }),
  // Sorting configuration
  sortBy: z.object({
    key: z.string().describe("Column key to sort by: inputCost, outputCost, context, maxOutput, provider, model"),
    direction: z.enum(["asc", "desc"]).describe("Sort direction: asc for ascending, desc for descending"),
  }),
  // Columns to make visible based on the query
  showColumns: z.array(z.string()).optional().describe("Column keys to make visible"),
  // Human-readable summary of the filters
  summary: z.string().describe("Brief summary of applied filters for display"),
})

// Provider alias mapping for better matching
const PROVIDER_ALIASES: Record<string, string[]> = {
  google: ["google_ai_studio", "gemini", "vertex_ai", "vertex_ai-chat-models", "vertex_ai-vision-models", "vertex_ai-language-models", "vertex_ai-code-text-models", "vertex_ai-code-chat-models"],
  openai: ["openai", "text-completion-openai", "azure", "azure_ai"],
  anthropic: ["anthropic", "vertex_ai-anthropic_models"],
  meta: ["meta_llama", "ollama", "vertex_ai-llama_models"],
  mistral: ["mistral", "codestral", "text-completion-codestral", "vertex_ai-mistral_models"],
  amazon: ["bedrock", "amazon_nova", "bedrock_converse", "sagemaker"],
  microsoft: ["azure", "azure_ai", "azure_text"],
  cohere: ["cohere", "cohere_chat"],
  deepseek: ["deepseek", "vertex_ai-deepseek_models"],
}

export async function POST(req: Request) {
  const { query, metadata } = await req.json()

  try {
    const { object } = await generateObject({
      model: ollama("gemma3:12b-cloud"),
      schema: FilterSchema,
      prompt: `You are a filter generator for an LLM model comparison table. Convert the user's natural language query into column filters.

AVAILABLE DATA:
- Providers (exact names): ${metadata.providers.slice(0, 50).join(", ")}${metadata.providers.length > 50 ? "..." : ""}
- Modes: ${metadata.modes.join(", ")}
- Context window range: ${metadata.contextRange.min.toLocaleString()} to ${metadata.contextRange.max.toLocaleString()} tokens
- Input cost range: $${metadata.costRange.minInput.toFixed(4)} to $${metadata.costRange.maxInput.toFixed(2)} per 1M tokens
- Output cost range: $${metadata.costRange.minOutput.toFixed(4)} to $${metadata.costRange.maxOutput.toFixed(2)} per 1M tokens
- Models with vision: ${metadata.capabilityCounts.vision}
- Models with audio: ${metadata.capabilityCounts.audio}
- Models with function calling: ${metadata.capabilityCounts.functionCalling}
- Models with reasoning: ${metadata.capabilityCounts.reasoning}
- Models with web search: ${metadata.capabilityCounts.webSearch}
- Models with prompt caching: ${metadata.capabilityCounts.promptCaching}

PROVIDER ALIASES (use these to expand common names):
- "google" → google_ai_studio, gemini, vertex_ai, vertex_ai-chat-models, vertex_ai-vision-models
- "openai" → openai, text-completion-openai, azure, azure_ai
- "anthropic" → anthropic, vertex_ai-anthropic_models
- "meta" or "llama" → meta_llama, ollama, vertex_ai-llama_models
- "mistral" → mistral, codestral, vertex_ai-mistral_models
- "amazon" or "aws" → bedrock, amazon_nova, bedrock_converse, sagemaker
- "microsoft" or "azure" → azure, azure_ai, azure_text
- "cohere" → cohere, cohere_chat
- "deepseek" → deepseek, vertex_ai-deepseek_models

USER QUERY: "${query}"

COLUMN KEYS for showColumns:
- provider, context, maxOutput, inputCost, outputCost
- vision, audio, functionCalling, reasoning, webSearch, promptCaching, mode

INSTRUCTIONS:
1. For "provider" filter: Return array of EXACT provider names from the available list that MATCH the query. Use the PROVIDER ALIASES above to expand common names like "google" to all Google-related providers. Use empty array [] if not filtering by provider.

2. For capability filters (vision, audio, functionCalling, reasoning, webSearch, promptCaching): Set to true ONLY if the user explicitly wants that capability.

3. For "maxInputCost": Set a dollar amount per 1M tokens if user mentions budget/cheap/affordable (e.g., 0.5 for very cheap, 1 for cheap, 5 for mid-range). Use 999999 for no limit.

4. For "maxOutputCost": Set a dollar amount per 1M tokens if user mentions output cost. Use 999999 for no limit.

5. For "minContext": Set token count if user mentions context size (e.g., 100000 for "100k context", 1000000 for "million token context"). Use 0 for no minimum.

6. For "minOutputTokens": Set minimum output tokens if user mentions output length needs. Use 0 for no minimum.

7. For "excludeDeprecated": Set true if user wants only current/active models, false otherwise.

8. For "sortBy": Set based on user intent:
   - "cheapest" or "affordable" → { key: "inputCost", direction: "asc" }
   - "most expensive" or "premium" → { key: "inputCost", direction: "desc" }
   - "largest context" → { key: "context", direction: "desc" }
   - Default → { key: "inputCost", direction: "asc" }

9. For "showColumns": Include column keys relevant to the query so user can see filtered data.

10. For "summary": Write a brief description like "Google models with vision support" or "Cheap models under $1/M tokens".

EXAMPLES:
- "cheapest vision models from google" -> 
  {
    filters: { provider: ["google_ai_studio", "gemini", "vertex_ai-chat-models", "vertex_ai-vision-models"], vision: true, maxInputCost: 999999, maxOutputCost: 999999, audio: false, functionCalling: false, reasoning: false, webSearch: false, promptCaching: false, mode: [], minContext: 0, minOutputTokens: 0, excludeDeprecated: false },
    sortBy: { key: "inputCost", direction: "asc" },
    showColumns: ["provider", "inputCost", "vision"],
    summary: "Google models with vision, sorted by price"
  }

- "models with reasoning and large context" ->
  {
    filters: { reasoning: true, provider: [], mode: [], vision: false, audio: false, functionCalling: false, webSearch: false, promptCaching: false, maxInputCost: 999999, maxOutputCost: 999999, minContext: 100000, minOutputTokens: 0, excludeDeprecated: false },
    sortBy: { key: "context", direction: "desc" },
    showColumns: ["provider", "reasoning", "context"],
    summary: "Reasoning models with 100k+ context"
  }

- "cheap openai chat models under $1" ->
  {
    filters: { provider: ["openai"], mode: ["chat"], vision: false, audio: false, functionCalling: false, reasoning: false, webSearch: false, promptCaching: false, maxInputCost: 1, maxOutputCost: 999999, minContext: 0, minOutputTokens: 0, excludeDeprecated: false },
    sortBy: { key: "inputCost", direction: "asc" },
    showColumns: ["provider", "mode", "inputCost", "outputCost"],
    summary: "OpenAI chat models under $1/M tokens"
  }

Return only relevant filters. Don't include filters if the user didn't mention them.`,
    })

    return Response.json(object)
  } catch (error) {
    console.error("AI search error:", error)
    return Response.json({ 
      filters: {}, 
      sortBy: { key: "inputCost", direction: "asc" },
      summary: "Failed to parse query" 
    }, { status: 500 })
  }
}
