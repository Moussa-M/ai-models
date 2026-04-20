import { z } from "zod"

const ALLOWED_MODES = [
  "chat",
  "embedding",
  "completion",
  "image_generation",
  "audio_transcription",
  "audio_speech",
  "moderation",
  "rerank",
  "search",
] as const

const ALLOWED_SHOW_COLUMNS = [
  "provider",
  "context",
  "maxOutput",
  "inputCost",
  "outputCost",
  "vision",
  "audio",
  "functionCalling",
  "reasoning",
  "webSearch",
  "promptCaching",
  "mode",
] as const

const FilterSchema = z.object({
  filters: z.object({
    provider: z.array(z.string()).optional().describe("Exact litellm_provider values to INCLUDE"),

    mode: z.array(z.enum(ALLOWED_MODES)).optional().describe("Model modes to INCLUDE"),

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

    min_input_tokens: z.number().optional().describe("Minimum max_input_tokens"),
    min_output_tokens: z.number().optional().describe("Minimum max_output_tokens"),

    pricing: z
      .object({
        max_input_cost_per_token: z.number().optional(),
        max_output_cost_per_token: z.number().optional(),
        max_input_cost_per_audio_token: z.number().optional(),
      })
      .optional(),
  }),

  showColumns: z.array(z.string()).optional().describe("Column keys to show in table"),
  summary: z.string().describe("Human-readable summary of applied filters"),
})

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value !== "string") return undefined

  const stripped = value.replace(/[$,]/g, "").trim()
  const parsed = Number.parseFloat(stripped)
  return Number.isFinite(parsed) ? parsed : undefined
}

function toBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    const v = value.toLowerCase().trim()
    if (v === "true") return true
    if (v === "false") return false
  }
  return undefined
}

function normalizeMode(mode: string): (typeof ALLOWED_MODES)[number] | undefined {
  const m = mode.toLowerCase().trim()

  if (ALLOWED_MODES.includes(m as (typeof ALLOWED_MODES)[number])) {
    return m as (typeof ALLOWED_MODES)[number]
  }

  if (["responses", "response", "assistant"].includes(m)) return "chat"
  if (["completions", "text_completion"].includes(m)) return "completion"
  if (["image", "image_gen", "image-edit", "image_edit"].includes(m)) return "image_generation"
  if (["transcription", "asr", "audio_transcribe"].includes(m)) return "audio_transcription"
  if (["speech", "tts", "text_to_speech"].includes(m)) return "audio_speech"

  return undefined
}

function normalizeAIOutput(raw: unknown) {
  const source = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>
  const rawFilters =
    typeof source.filters === "object" && source.filters !== null ? (source.filters as Record<string, unknown>) : {}

  const filters: {
    provider?: string[]
    mode?: (typeof ALLOWED_MODES)[number][]
    supports?: Record<string, boolean>
    min_input_tokens?: number
    min_output_tokens?: number
    pricing?: Record<string, number>
  } = {}

  if (Array.isArray(rawFilters.provider)) {
    const providers = rawFilters.provider.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    if (providers.length > 0) filters.provider = providers
  }

  if (Array.isArray(rawFilters.mode)) {
    const modes = rawFilters.mode
      .filter((v): v is string => typeof v === "string")
      .map((v) => normalizeMode(v))
      .filter((v): v is (typeof ALLOWED_MODES)[number] => Boolean(v))

    if (modes.length > 0) filters.mode = [...new Set(modes)]
  }

  if (typeof rawFilters.supports === "object" && rawFilters.supports !== null) {
    const supportsRaw = rawFilters.supports as Record<string, unknown>
    const supports = {
      vision: toBoolean(supportsRaw.vision),
      audio_input: toBoolean(supportsRaw.audio_input),
      audio_output: toBoolean(supportsRaw.audio_output),
      function_calling: toBoolean(supportsRaw.function_calling),
      parallel_function_calling: toBoolean(supportsRaw.parallel_function_calling),
      reasoning: toBoolean(supportsRaw.reasoning),
      web_search: toBoolean(supportsRaw.web_search),
      prompt_caching: toBoolean(supportsRaw.prompt_caching),
      response_schema: toBoolean(supportsRaw.response_schema),
      system_messages: toBoolean(supportsRaw.system_messages),
    }
    const cleaned = Object.fromEntries(Object.entries(supports).filter(([, value]) => value !== undefined)) as Record<
      string,
      boolean
    >
    if (Object.keys(cleaned).length > 0) filters.supports = cleaned
  }

  const minInput = toNumber(rawFilters.min_input_tokens)
  if (minInput !== undefined) filters.min_input_tokens = minInput

  const minOutput = toNumber(rawFilters.min_output_tokens)
  if (minOutput !== undefined) filters.min_output_tokens = minOutput

  if (typeof rawFilters.pricing === "object" && rawFilters.pricing !== null) {
    const pricingRaw = rawFilters.pricing as Record<string, unknown>
    const pricing = {
      max_input_cost_per_token: toNumber(pricingRaw.max_input_cost_per_token),
      max_output_cost_per_token: toNumber(pricingRaw.max_output_cost_per_token),
      max_input_cost_per_audio_token: toNumber(pricingRaw.max_input_cost_per_audio_token),
    }
    const cleaned = Object.fromEntries(Object.entries(pricing).filter(([, value]) => value !== undefined)) as Record<
      string,
      number
    >
    if (Object.keys(cleaned).length > 0) filters.pricing = cleaned
  }

  const showColumns = Array.isArray(source.showColumns)
    ? source.showColumns.filter(
        (v): v is (typeof ALLOWED_SHOW_COLUMNS)[number] =>
          typeof v === "string" && ALLOWED_SHOW_COLUMNS.includes(v as (typeof ALLOWED_SHOW_COLUMNS)[number]),
      )
    : undefined

  const summary =
    typeof source.summary === "string" && source.summary.trim().length > 0 ? source.summary : "Filters applied"

  return {
    filters,
    ...(showColumns && showColumns.length > 0 ? { showColumns } : {}),
    summary,
  }
}

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
- "vision" -> supports.vision = true
- "audio input" -> supports.audio_input = true
- "audio output / speech" -> supports.audio_output = true
- "function calling" / "tools" -> supports.function_calling = true
- "reasoning" -> supports.reasoning = true
- "web search" -> supports.web_search = true
- "prompt caching" / "caching" -> supports.prompt_caching = true
- "response schema" / "structured output" -> supports.response_schema = true
- "system messages" -> supports.system_messages = true

PRICING RULES:
- "cheap" -> max_input_cost_per_token = 0.000001 (=$1/M tokens)
- "very cheap" / "cheapest" -> max_input_cost_per_token = 0.0000005 (=$0.5/M tokens)
- "affordable" / "mid-range" -> max_input_cost_per_token = 0.000005 (=$5/M tokens)
- If mode=chat/completion/embedding, use token pricing
- If mode=audio*, use audio token pricing

CONTEXT RULES:
- "large context" -> min_input_tokens = 100000
- "very large context" / "huge context" -> min_input_tokens = 500000
- "1M context" -> min_input_tokens = 1000000

MODE RULES:
- Allowed mode values only: ${ALLOWED_MODES.join(", ")}
- If user asks for "responses", map to "chat"
- If user asks for image gen, use "image_generation"

PROVIDER MATCHING:
- Match provider names by substring (e.g., "google" matches "google_ai_studio", "vertex_ai-chat-models")
- "openai" matches "openai"
- "anthropic" matches "anthropic"
- "aws" / "bedrock" matches "bedrock"
- "azure" matches "azure"

SHOW COLUMNS:
Include only columns relevant to the query intent.
Available: provider, context, maxOutput, inputCost, outputCost, vision, audio, functionCalling, reasoning, webSearch, promptCaching, mode

Return ONLY valid JSON matching the schema.`

    const response = await fetch("https://ollama.com/api/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma4:31b",
        format: "json",
        messages: [{ role: "user", content: prompt }],
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

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No JSON found in response")
    }

    const parsed = JSON.parse(jsonMatch[0])
    const normalized = normalizeAIOutput(parsed)
    const validated = FilterSchema.safeParse(normalized)

    if (!validated.success) {
      console.error("AI search validation error:", validated.error.flatten())
      return Response.json({ filters: normalized.filters ?? {}, summary: normalized.summary ?? "Filters applied" })
    }

    return Response.json(validated.data)
  } catch (error) {
    console.error("AI search error:", error)
    return Response.json({ filters: {}, summary: "Unable to parse AI filters right now" })
  }
}
