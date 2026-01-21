import { z } from "zod"

const FilterSchema = z.object({
  filters: z.object({
    // ───────────────── Providers & Mode ─────────────────
    provider: z
      .array(z.string())
      .optional()
      .describe("Exact litellm_provider values to INCLUDE"),

    mode: z
      .array(
        z.enum([
          "chat",
          "embedding",
          "completion",
          "image_generation",
          "audio_transcription",
          "audio_speech",
          "moderation",
          "rerank",
          "search",
        ])
      )
      .optional()
      .describe("Model modes to INCLUDE"),

    // ───────────────── Capabilities ─────────────────
    supports: z
      .object({
        vision: z.boolean().optional(),
        audio_input: z.boolean().optional(),
        audio_output: z.boolean().optional(),
        function_calling: z.boolean().optional(),
        parallel_function_calling: z.boolean().optional(),
        reasoning: z.boolean().optional(),
        web_search: z.boolean().optional(),
        prompt_caching: z.boolean().optional(),
        response_schema: z.boolean().optional(),
        system_messages: z.boolean().optional(),
      })
      .optional(),

    // ───────────────── Token Limits ─────────────────
    min_input_tokens: z
      .number()
      .optional()
      .describe("Minimum max_input_tokens"),

    min_output_tokens: z
      .number()
      .optional()
      .describe("Minimum max_output_tokens"),

    // ───────────────── Pricing Filters ─────────────────
    pricing: z
      .object({
        // Token-based (chat / embedding / completion)
        max_input_cost_per_token: z.number().optional(),
        max_output_cost_per_token: z.number().optional(),

        // Audio
        max_input_cost_per_audio_token: z.number().optional(),
      })
      .optional(),
  }),

  showColumns: z
    .array(z.string())
    .optional()
    .describe("Column keys to show in table"),

  summary: z
    .string()
    .describe("Human-readable summary of applied filters"),
})

export async function POST(req: Request) {
  const { query, metadata } = await req.json()

  try {
    const prompt = `You are a STRICT filter generator for an LLM model catalog.

Your task: Convert the USER QUERY into a structured filter object that matches the schema.

IMPORTANT RULES:
- ONLY use fields that exist in the schema.
- DO NOT infer capabilities unless explicitly mentioned.
- DO NOT add filters the user did not ask for.
- Mode determines which pricing fields apply.

DATA CONTEXT:
Providers: ${metadata.providers.slice(0, 50).join(", ")}${metadata.providers.length > 50 ? "..." : ""}
Modes: ${metadata.modes.join(", ")}
Context range: ${metadata.contextRange.min.toLocaleString()} - ${metadata.contextRange.max.toLocaleString()} tokens
Cost range: $${metadata.costRange.minInput.toFixed(4)} - $${metadata.costRange.maxInput.toFixed(2)} per 1M input tokens

USER QUERY:
"${query}"

CAPABILITY MAPPING:
- "vision" → supports.vision = true
- "audio input" → supports.audio_input = true
- "audio output / speech" → supports.audio_output = true
- "function calling" / "tools" → supports.function_calling = true
- "reasoning" → supports.reasoning = true
- "web search" → supports.web_search = true
- "prompt caching" / "caching" → supports.prompt_caching = true
- "response schema" / "structured output" → supports.response_schema = true

PRICING RULES:
- "cheap" → max_input_cost_per_token = 0.000001 (=$1/M tokens)
- "very cheap" / "cheapest" → max_input_cost_per_token = 0.0000005 (=$0.5/M tokens)
- "affordable" / "mid-range" → max_input_cost_per_token = 0.000005 (=$5/M tokens)
- If mode=chat/completion/embedding, use token pricing
- If mode=audio*, use audio token pricing

CONTEXT RULES:
- "large context" → min_input_tokens = 100000
- "very large context" / "huge context" → min_input_tokens = 500000
- "1M context" → min_input_tokens = 1000000

PROVIDER MATCHING:
- Match provider names by substring (e.g., "google" matches "google_ai_studio", "vertex_ai-chat-models")
- "openai" matches "openai"
- "anthropic" matches "anthropic"
- "aws" / "bedrock" matches "bedrock"
- "azure" matches "azure"

SHOW COLUMNS:
Include only columns relevant to the query intent.
Available: provider, context, maxOutput, inputCost, outputCost, vision, audio, functionCalling, reasoning, webSearch, promptCaching, mode

SUMMARY:
Write a short sentence like:
- "Cheap chat models under $1/M tokens"
- "Chat models with reasoning and large context"
- "Google models with vision support"

EXAMPLES:

Query: "cheap vision models from google"
{
  "filters": {
    "provider": ["google_ai_studio", "vertex_ai-chat-models"],
    "supports": { "vision": true },
    "pricing": { "max_input_cost_per_token": 0.000001 }
  },
  "showColumns": ["provider", "inputCost", "vision"],
  "summary": "Google models with vision under $1/M tokens"
}

Query: "large context chat models with reasoning"
{
  "filters": {
    "mode": ["chat"],
    "supports": { "reasoning": true },
    "min_input_tokens": 100000
  },
  "showColumns": ["provider", "context", "reasoning"],
  "summary": "Chat models with reasoning and large context"
}

Query: "cheapest models with function calling"
{
  "filters": {
    "supports": { "function_calling": true },
    "pricing": { "max_input_cost_per_token": 0.0000005 }
  },
  "showColumns": ["provider", "inputCost", "functionCalling"],
  "summary": "Low-cost models with function calling support"
}

Return ONLY valid JSON matching the schema.`

    // Make direct API call to Ollama
    const response = await fetch("https://ollama.com/api/chat", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OLLAMA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-oss:20b-cloud",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.message?.content

    if (!content) {
      throw new Error("No content in response")
    }

    // Parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No JSON found in response")
    }

    const parsed = JSON.parse(jsonMatch[0])
    const validated = FilterSchema.parse(parsed)

    return Response.json(validated)
  } catch (error) {
    console.error("AI search error:", error)
    return Response.json({ filters: {}, summary: "Failed to parse query" }, { status: 500 })
  }
}
