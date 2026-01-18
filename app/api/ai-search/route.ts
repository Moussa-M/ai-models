import { generateObject } from "ai"
import { z } from "zod"

const FilterSchema = z.object({
  filters: z.object({
    // List filters - these EXCLUDE the specified values
    provider: z.array(z.string()).optional().describe("Provider values to INCLUDE (all others excluded)"),
    mode: z.array(z.string()).optional().describe("Mode values to INCLUDE (all others excluded)"),
    // Boolean filters - true means "only show models with this capability"
    vision: z.boolean().optional().describe("Set true to show only models with vision"),
    audio: z.boolean().optional().describe("Set true to show only models with audio"),
    functionCalling: z.boolean().optional().describe("Set true to show only models with function calling"),
    reasoning: z.boolean().optional().describe("Set true to show only models with reasoning"),
    webSearch: z.boolean().optional().describe("Set true to show only models with web search"),
    promptCaching: z.boolean().optional().describe("Set true to show only models with prompt caching"),
    // Range filters
    maxInputCost: z.number().optional().describe("Maximum input cost per 1M tokens in dollars"),
    minContext: z.number().optional().describe("Minimum context window in tokens"),
  }),
  // Columns to make visible based on the query
  showColumns: z.array(z.string()).optional().describe("Column keys to make visible"),
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
1. For "provider" filter: Return array of EXACT provider names from the list that MATCH the query. For example, if user says "google", include providers containing "google" like "google_ai_studio", "vertex_ai-chat-models", etc.

2. For capability filters (vision, audio, functionCalling, reasoning, webSearch, promptCaching): Set to true ONLY if the user explicitly wants that capability.

3. For "maxInputCost": Set a dollar amount per 1M tokens if user mentions budget/cheap/affordable (e.g., 1 for cheap, 5 for mid-range).

4. For "minContext": Set token count if user mentions context size (e.g., 100000 for large context).

5. For "showColumns": Include columns relevant to the query so user can see filtered data.

6. For "summary": Write a brief description like "Google models with vision support" or "Cheap models under $1/M tokens".

EXAMPLES:
- "cheap vision models from google" -> 
  {
    filters: { provider: ["google_ai_studio", "vertex_ai-chat-models", ...all google providers], vision: true, maxInputCost: 1 },
    showColumns: ["provider", "inputCost", "vision"],
    summary: "Google models with vision, under $1/M tokens"
  }

- "models with reasoning" ->
  {
    filters: { reasoning: true },
    showColumns: ["provider", "reasoning"],
    summary: "Models with reasoning capability"
  }

- "openai chat models" ->
  {
    filters: { provider: ["openai"], mode: ["chat"] },
    showColumns: ["provider", "mode"],
    summary: "OpenAI chat models"
  }

Return only relevant filters. Don't include filters if the user didn't mention them.`,
    })

    return Response.json(object)
  } catch (error) {
    console.error("AI search error:", error)
    return Response.json({ filters: {}, summary: "Failed to parse query" }, { status: 500 })
  }
}
