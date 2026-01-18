import { generateObject, generateText } from "ai"
import { createOllama } from "ollama-ai-provider-v2"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

// Create Ollama Cloud provider
const ollama = createOllama({
  baseURL: "https://ollama.com/api",
  headers: {
    Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
  },
})

const FilterSchema = z.object({
  filters: z.object({
    // List filters - these INCLUDE the specified values  
    provider: z.array(z.string()).describe("Provider values to INCLUDE (all others excluded). Empty array means no filter."),
    mode: z.array(z.string()).describe("Mode values to INCLUDE (all others excluded). Empty array means no filter."),
    // Boolean filters - true means "only show models with this capability"
    vision: z.boolean().describe("Set true to show only models with vision, false otherwise"),
    audio: z.boolean().describe("Set true to show only models with audio, false otherwise"),
    functionCalling: z.boolean().describe("Set true to show only models with function calling, false otherwise"),
    reasoning: z.boolean().describe("Set true to show only models with reasoning, false otherwise"),
    webSearch: z.boolean().describe("Set true to show only models with web search, false otherwise"),
    promptCaching: z.boolean().describe("Set true to show only models with prompt caching, false otherwise"),
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
  showColumns: z.array(z.string()).describe("Column keys to make visible based on query relevance"),
  // Human-readable summary of the filters
  summary: z.string().describe("Brief summary of applied filters for display"),
})

// Provider alias mapping for better matching
const PROVIDER_ALIASES: Record<string, string[]> = {
  google: ["google_ai_studio", "gemini", "vertex_ai", "vertex_ai-chat-models", "vertex_ai-vision-models", "vertex_ai-language-models", "vertex_ai-code-text-models", "vertex_ai-code-chat-models"],
  openai: ["openai", "text-completion-openai"],
  anthropic: ["anthropic", "vertex_ai-anthropic_models"],
  meta: ["meta_llama", "vertex_ai-llama_models"],
  llama: ["meta_llama", "ollama", "ollama_chat", "vertex_ai-llama_models"],
  ollama: ["ollama", "ollama_chat"],
  mistral: ["mistral", "codestral", "text-completion-codestral", "vertex_ai-mistral_models"],
  amazon: ["bedrock", "amazon_nova", "bedrock_converse", "sagemaker"],
  aws: ["bedrock", "amazon_nova", "bedrock_converse", "sagemaker"],
  microsoft: ["azure", "azure_ai", "azure_text"],
  azure: ["azure", "azure_ai", "azure_text"],
  cohere: ["cohere", "cohere_chat"],
  deepseek: ["deepseek", "vertex_ai-deepseek_models"],
  groq: ["groq"],
  together: ["together_ai"],
  perplexity: ["perplexity"],
  xai: ["xai"],
  grok: ["xai"],
}

function buildPrompt(query: string, metadata: any): string {
  return `You are a filter generator for an LLM model comparison table. Convert the user's natural language query into column filters.

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

PROVIDER ALIASES (use these to expand common names to EXACT provider names):
- "google" or "gemini" → google_ai_studio, gemini, vertex_ai, vertex_ai-chat-models, vertex_ai-vision-models
- "openai" or "gpt" → openai, text-completion-openai
- "anthropic" or "claude" → anthropic, vertex_ai-anthropic_models
- "meta" or "llama" → meta_llama, ollama, ollama_chat, vertex_ai-llama_models
- "ollama" → ollama, ollama_chat
- "mistral" → mistral, codestral, vertex_ai-mistral_models
- "amazon" or "aws" or "bedrock" → bedrock, amazon_nova, bedrock_converse, sagemaker
- "microsoft" or "azure" → azure, azure_ai, azure_text
- "cohere" → cohere, cohere_chat
- "deepseek" → deepseek, vertex_ai-deepseek_models
- "groq" → groq
- "together" → together_ai
- "xai" or "grok" → xai

IMPORTANT: When user mentions a provider name, find ALL matching providers from the AVAILABLE DATA list above. Only include providers that actually exist in the available list.

USER QUERY: "${query}"

COLUMN KEYS for showColumns:
- provider, context, maxOutput, inputCost, outputCost
- vision, audio, functionCalling, reasoning, webSearch, promptCaching, mode

INSTRUCTIONS:
1. For "provider" filter: Return array of EXACT provider names from the available list that MATCH the query. Use the PROVIDER ALIASES above to expand common names like "google" to all Google-related providers. Use empty array [] if not filtering by provider.

2. For capability filters (vision, audio, functionCalling, reasoning, webSearch, promptCaching): Set to true ONLY if the user explicitly wants that capability, false otherwise.

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

Return valid JSON matching this exact schema:
{
  "filters": {
    "provider": string[],
    "mode": string[],
    "vision": boolean,
    "audio": boolean,
    "functionCalling": boolean,
    "reasoning": boolean,
    "webSearch": boolean,
    "promptCaching": boolean,
    "maxInputCost": number,
    "maxOutputCost": number,
    "minContext": number,
    "minOutputTokens": number,
    "excludeDeprecated": boolean
  },
  "sortBy": { "key": string, "direction": "asc" | "desc" },
  "showColumns": string[],
  "summary": string
}

EXAMPLES:
- "cheapest vision models from google" -> 
  {
    "filters": { "provider": ["google_ai_studio", "gemini", "vertex_ai-chat-models", "vertex_ai-vision-models"], "mode": [], "vision": true, "audio": false, "functionCalling": false, "reasoning": false, "webSearch": false, "promptCaching": false, "maxInputCost": 999999, "maxOutputCost": 999999, "minContext": 0, "minOutputTokens": 0, "excludeDeprecated": false },
    "sortBy": { "key": "inputCost", "direction": "asc" },
    "showColumns": ["provider", "inputCost", "vision"],
    "summary": "Google models with vision, sorted by price"
  }

- "cheap openai chat models under $1" ->
  {
    "filters": { "provider": ["openai"], "mode": ["chat"], "vision": false, "audio": false, "functionCalling": false, "reasoning": false, "webSearch": false, "promptCaching": false, "maxInputCost": 1, "maxOutputCost": 999999, "minContext": 0, "minOutputTokens": 0, "excludeDeprecated": false },
    "sortBy": { "key": "inputCost", "direction": "asc" },
    "showColumns": ["provider", "mode", "inputCost", "outputCost"],
    "summary": "OpenAI chat models under $1/M tokens"
  }

- "ollama vision models" ->
  {
    "filters": { "provider": ["ollama", "ollama_chat"], "mode": [], "vision": true, "audio": false, "functionCalling": false, "reasoning": false, "webSearch": false, "promptCaching": false, "maxInputCost": 999999, "maxOutputCost": 999999, "minContext": 0, "minOutputTokens": 0, "excludeDeprecated": false },
    "sortBy": { "key": "inputCost", "direction": "asc" },
    "showColumns": ["provider", "vision", "inputCost"],
    "summary": "Ollama models with vision capability"
  }

- "cheap vision models" ->
  {
    "filters": { "provider": [], "mode": [], "vision": true, "audio": false, "functionCalling": false, "reasoning": false, "webSearch": false, "promptCaching": false, "maxInputCost": 1, "maxOutputCost": 999999, "minContext": 0, "minOutputTokens": 0, "excludeDeprecated": false },
    "sortBy": { "key": "inputCost", "direction": "asc" },
    "showColumns": ["provider", "vision", "inputCost", "outputCost"],
    "summary": "Cheap vision models under $1/M tokens"
  }`
}

/**
 * Parse JSON that might be wrapped in markdown code blocks
 */
function parseJSONResponse(text: string): unknown {
  // Try direct parse first
  try {
    return JSON.parse(text)
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim())
    }
    // Try to find JSON object pattern
    const objectMatch = text.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      return JSON.parse(objectMatch[0])
    }
    throw new Error("Could not parse JSON from response")
  }
}

export async function POST(req: Request) {
  const { query, metadata } = await req.json()
  const prompt = buildPrompt(query, metadata)

  // Try Ollama Cloud first
  try {
    const { text } = await generateText({
      model: ollama("gemma3:12b-cloud"),
      prompt,
    })
    
    const parsed = parseJSONResponse(text)
    const validated = FilterSchema.parse(parsed)
    return Response.json(validated)
  } catch (ollamaError) {
    console.warn("Ollama Cloud failed, falling back to OpenAI:", ollamaError)
    
    // Fallback to OpenAI with structured output
    try {
      const { object } = await generateObject({
        model: openai("gpt-4o-mini"),
        schema: FilterSchema,
        prompt,
      })
      return Response.json(object)
    } catch (openaiError) {
      console.error("OpenAI fallback also failed:", openaiError)
      return Response.json({ 
        filters: {
          provider: [],
          mode: [],
          vision: false,
          audio: false,
          functionCalling: false,
          reasoning: false,
          webSearch: false,
          promptCaching: false,
          maxInputCost: 999999,
          maxOutputCost: 999999,
          minContext: 0,
          minOutputTokens: 0,
          excludeDeprecated: false,
        },
        sortBy: { key: "inputCost", direction: "asc" },
        showColumns: [],
        summary: "Failed to parse query" 
      }, { status: 500 })
    }
  }
}
