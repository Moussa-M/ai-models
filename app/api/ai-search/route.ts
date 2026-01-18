import { generateObject } from "ai"
import { z } from "zod"

const FilterSchema = z.object({
  filters: z.object({
    // List filters - these EXCLUDE the specified values  
    provider: z.array(z.string()).describe("Provider values to INCLUDE (all others excluded). Empty array means no filter."),
    mode: z.array(z.string()).describe("Mode values to INCLUDE (all others excluded). Empty array means no filter."),
    // Boolean filters - true means "only show models with this capability"
    vision: z.boolean().describe("Set true to show only models with vision, false for no filter"),
    audio: z.boolean().describe("Set true to show only models with audio, false for no filter"),
    functionCalling: z.boolean().describe("Set true to show only models with function calling, false for no filter"),
    reasoning: z.boolean().describe("Set true to show only models with reasoning, false for no filter"),
    webSearch: z.boolean().describe("Set true to show only models with web search, false for no filter"),
    promptCaching: z.boolean().describe("Set true to show only models with prompt caching, false for no filter"),
    // Range filters
    maxInputCost: z.number().describe("Maximum input cost per 1M tokens in dollars. Use null for no limit."),
    minContext: z.number().describe("Minimum context window in tokens. Use 0 for no minimum."),
  }),
  // Columns to make visible based on the query
  showColumns: z.array(z.string()).describe("Column keys to make visible. Empty array means use defaults."),
  // Human-readable summary of the filters
  summary: z.string().describe("Brief summary of applied filters for display"),
})

export async function POST(req: Request) {
  const { query, metadata } = await req.json()

  try {
    const { object } = await generateObject({
      model: "openai/gpt-4o-mini",
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

USER QUERY: "${query}"

COLUMN KEYS for showColumns:
- provider, context, maxOutput, inputCost, outputCost
- vision, audio, functionCalling, reasoning, webSearch, promptCaching, mode

INSTRUCTIONS:
1. For "provider" filter: Return array of EXACT provider names from the list that MATCH the query. Use empty array [] if not filtering by provider.

2. For capability filters (vision, audio, functionCalling, reasoning, webSearch, promptCaching): Set to true ONLY if the user explicitly wants that capability. Use false otherwise.

3. For "maxInputCost": Set a dollar amount per 1M tokens if user mentions budget/cheap/affordable (e.g., 1 for cheap, 5 for mid-range). Use 999999 for no limit.

4. For "minContext": Set token count if user mentions context size (e.g., 100000 for large context). Use 0 for no minimum.

5. For "showColumns": Include column keys relevant to the query. Use empty array [] for defaults.

6. For "summary": Write a brief description like "Google models with vision support" or "Cheap models under $1/M tokens".

EXAMPLES:
- "cheap vision models from google" -> 
  {
    filters: { provider: ["google_ai_studio", "vertex_ai-chat-models"], vision: true, maxInputCost: 1, audio: false, functionCalling: false, reasoning: false, webSearch: false, promptCaching: false, mode: [], minContext: 0 },
    showColumns: ["provider", "inputCost", "vision"],
    summary: "Google models with vision, under $1/M tokens"
  }

- "models with reasoning" ->
  {
    filters: { reasoning: true, provider: [], mode: [], vision: false, audio: false, functionCalling: false, webSearch: false, promptCaching: false, maxInputCost: 999999, minContext: 0 },
    showColumns: ["provider", "reasoning"],
    summary: "Models with reasoning capability"
  }

- "openai chat models" ->
  {
    filters: { provider: ["openai"], mode: ["chat"], vision: false, audio: false, functionCalling: false, reasoning: false, webSearch: false, promptCaching: false, maxInputCost: 999999, minContext: 0 },
    showColumns: ["provider", "mode"],
    summary: "OpenAI chat models"
  }

Always include all filter properties with appropriate default values.`,
    })

    return Response.json(object)
  } catch (error) {
    console.error("AI search error:", error)
    return Response.json({ filters: {}, summary: "Failed to parse query" }, { status: 500 })
  }
}
