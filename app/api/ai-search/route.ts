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

type Mode = (typeof ALLOWED_MODES)[number]

const MODE_ALIASES: Record<string, Mode> = {
  responses: "chat",
  response: "chat",
  assistant: "chat",
  completions: "completion",
  text_completion: "completion",
  image: "image_generation",
  image_gen: "image_generation",
  "image-edit": "image_generation",
  image_edit: "image_generation",
  transcription: "audio_transcription",
  asr: "audio_transcription",
  audio_transcribe: "audio_transcription",
  speech: "audio_speech",
  tts: "audio_speech",
  text_to_speech: "audio_speech",
  video_generation: "image_generation",
  ocr: "chat",
  vector_store: "embedding",
}

const PROVIDER_KEYWORDS: Record<string, string[]> = {
  openai: ["openai"],
  anthropic: ["anthropic", "claude"],
  google: ["google", "gemini", "vertex"],
  bedrock: ["aws", "bedrock", "amazon"],
  azure: ["azure", "microsoft"],
  mistral: ["mistral"],
  cohere: ["cohere"],
  deepseek: ["deepseek"],
  groq: ["groq"],
  meta: ["meta", "llama"],
  together_ai: ["together"],
  fireworks_ai: ["fireworks"],
  replicate: ["replicate"],
  perplexity: ["perplexity"],
  xai: ["xai", "grok"],
  deepinfra: ["deepinfra"],
  sambanova: ["sambanova"],
  cerebras: ["cerebras"],
  ai21: ["ai21", "jurassic"],
  stability: ["stability", "stable diffusion"],
}

const MODE_KEYWORDS: Record<Mode, string[]> = {
  chat: ["chat", "conversation", "talk"],
  embedding: ["embed", "vector"],
  completion: ["completion", "complete"],
  image_generation: ["image", "img", "dall-e", "dalle", "picture", "photo", "generate image", "image gen"],
  audio_transcription: ["transcri", "asr", "speech to text", "stt"],
  audio_speech: ["tts", "text to speech", "voice", "speak"],
  moderation: ["moderat"],
  rerank: ["rerank", "re-rank"],
  search: ["search"],
}

const PRICING_KEYWORDS: Record<string, number> = {
  free: 0.000000001,
  cheapest: 0.0000005,
  "very cheap": 0.0000005,
  cheap: 0.000001,
  affordable: 0.000005,
  "mid-range": 0.000005,
  budget: 0.000001,
  "low cost": 0.000001,
  inexpensive: 0.000001,
}

const CONTEXT_KEYWORDS: Record<string, number> = {
  "1m context": 1000000,
  "million token": 1000000,
  "very large context": 500000,
  "huge context": 500000,
  "large context": 100000,
  "long context": 100000,
  "big context": 100000,
  "128k": 128000,
  "200k": 200000,
}

const CAPABILITY_KEYWORDS: Record<string, string> = {
  vision: "vision",
  "see image": "vision",
  "audio input": "audio_input",
  "audio output": "audio_output",
  "function call": "function_calling",
  "tool use": "function_calling",
  "tool call": "function_calling",
  tools: "function_calling",
  reasoning: "reasoning",
  "chain of thought": "reasoning",
  "web search": "web_search",
  "prompt cach": "prompt_caching",
  caching: "prompt_caching",
  "structured output": "response_schema",
  "response schema": "response_schema",
  "json mode": "response_schema",
  "system message": "system_messages",
}

function extractProviders(query: string, allProviders: string[]): string[] {
  const q = query.toLowerCase()
  const matched = new Set<string>()

  for (const [providerPrefix, keywords] of Object.entries(PROVIDER_KEYWORDS)) {
    if (keywords.some((kw) => q.includes(kw))) {
      for (const p of allProviders) {
        const pLower = p.toLowerCase()
        if (
          pLower.startsWith(providerPrefix) ||
          pLower.includes(providerPrefix) ||
          keywords.some((kw) => pLower.startsWith(kw) || pLower.includes(kw))
        ) {
          matched.add(p)
        }
      }
    }
  }

  return [...matched]
}

function extractModes(query: string): Mode[] {
  const q = query.toLowerCase()
  const matched = new Set<Mode>()

  for (const [mode, keywords] of Object.entries(MODE_KEYWORDS)) {
    if (keywords.some((kw) => q.includes(kw))) {
      matched.add(mode as Mode)
    }
  }

  return [...matched]
}

function extractPricing(query: string): number | undefined {
  const q = query.toLowerCase()

  for (const [keyword, value] of Object.entries(PRICING_KEYWORDS).sort((a, b) => b[0].length - a[0].length)) {
    if (q.includes(keyword)) return value
  }

  const priceMatch = q.match(/(?:under|below|less than|max|up to)\s+\$?(\d+(?:\.\d+)?)\s*(?:dollar|\$|per\s*m|per\s*million)?/)
  if (priceMatch) {
    const dollars = parseFloat(priceMatch[1])
    if (Number.isFinite(dollars) && dollars > 0) return dollars / 1000000
  }

  return undefined
}

function extractContext(query: string): number | undefined {
  const q = query.toLowerCase()

  for (const [keyword, value] of Object.entries(CONTEXT_KEYWORDS).sort((a, b) => b[0].length - a[0].length)) {
    if (q.includes(keyword)) return value
  }

  return undefined
}

function extractCapabilities(query: string): Record<string, boolean> {
  const q = query.toLowerCase()
  const caps: Record<string, boolean> = {}

  for (const [keyword, field] of Object.entries(CAPABILITY_KEYWORDS)) {
    if (q.includes(keyword)) caps[field] = true
  }

  return caps
}

function pickShowColumns(
  modes: Mode[],
  providers: string[],
  caps: Record<string, boolean>,
  hasPricing: boolean,
): string[] {
  const cols = new Set<string>(["provider", "mode"])

  if (providers.length > 0) cols.add("provider")
  if (hasPricing) {
    cols.add("inputCost")
    cols.add("outputCost")
  }
  if (modes.some((m) => ["chat", "completion", "embedding"].includes(m))) {
    cols.add("context")
    cols.add("maxOutput")
    cols.add("inputCost")
    cols.add("outputCost")
  }
  if (modes.includes("image_generation")) {
    cols.add("inputCost")
    cols.add("outputCost")
  }
  for (const cap of Object.keys(caps)) {
    const colMap: Record<string, string> = {
      vision: "vision",
      audio_input: "audio",
      audio_output: "audio",
      function_calling: "functionCalling",
      reasoning: "reasoning",
      web_search: "webSearch",
      prompt_caching: "promptCaching",
    }
    if (colMap[cap]) cols.add(colMap[cap])
  }

  return [...cols]
}

function normalizeMode(mode: string): Mode | undefined {
  const m = mode.toLowerCase().trim()
  if (ALLOWED_MODES.includes(m as Mode)) return m as Mode
  return MODE_ALIASES[m]
}

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

function normalizeAIOutput(raw: unknown) {
  const source = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>
  const rawFilters =
    typeof source.filters === "object" && source.filters !== null ? (source.filters as Record<string, unknown>) : {}

  const filters: Record<string, unknown> = {}

  if (Array.isArray(rawFilters.provider)) {
    const providers = rawFilters.provider.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    if (providers.length > 0) filters.provider = providers
  }

  if (Array.isArray(rawFilters.mode)) {
    const modes = rawFilters.mode
      .filter((v): v is string => typeof v === "string")
      .map((v) => normalizeMode(v))
      .filter((v): v is Mode => Boolean(v))
    if (modes.length > 0) filters.mode = [...new Set(modes)]
  }

  if (typeof rawFilters.supports === "object" && rawFilters.supports !== null) {
    const supportsRaw = rawFilters.supports as Record<string, unknown>
    const cleaned = Object.fromEntries(
      [
        "vision",
        "audio_input",
        "audio_output",
        "function_calling",
        "parallel_function_calling",
        "reasoning",
        "web_search",
        "prompt_caching",
        "response_schema",
        "system_messages",
      ]
        .map((k) => [k, toBoolean(supportsRaw[k])])
        .filter(([, v]) => v !== undefined),
    )
    if (Object.keys(cleaned).length > 0) filters.supports = cleaned
  }

  const minInput = toNumber(rawFilters.min_input_tokens)
  if (minInput !== undefined) filters.min_input_tokens = minInput

  const minOutput = toNumber(rawFilters.min_output_tokens)
  if (minOutput !== undefined) filters.min_output_tokens = minOutput

  if (typeof rawFilters.pricing === "object" && rawFilters.pricing !== null) {
    const pricingRaw = rawFilters.pricing as Record<string, unknown>
    const cleaned = Object.fromEntries(
      ["max_input_cost_per_token", "max_output_cost_per_token", "max_input_cost_per_audio_token"]
        .map((k) => [k, toNumber(pricingRaw[k])])
        .filter(([, v]) => v !== undefined),
    )
    if (Object.keys(cleaned).length > 0) filters.pricing = cleaned
  }

  const showColumns = Array.isArray(source.showColumns)
    ? source.showColumns.filter(
        (v): v is string => typeof v === "string" && ALLOWED_SHOW_COLUMNS.includes(v as (typeof ALLOWED_SHOW_COLUMNS)[number]),
      )
    : undefined

  const summary =
    typeof source.summary === "string" && source.summary.trim().length > 0 ? source.summary : "Filters applied"

  return { filters, ...(showColumns && showColumns.length > 0 ? { showColumns } : {}), summary }
}

function isSimpleQuery(query: string, providers: string[]): boolean {
  const extracted = {
    providers: extractProviders(query, providers),
    modes: extractModes(query),
    pricing: extractPricing(query),
    context: extractContext(query),
    caps: extractCapabilities(query),
  }

  const q = query.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim()
  const knownWords = new Set([
    "models", "model", "of", "from", "by", "with", "the", "a", "an", "and", "or",
    "all", "show", "list", "find", "get", "give", "me", "that", "are", "is",
    "which", "what", "gen", "generation", "for", "under", "below", "less", "than",
    "max", "up", "to", "dollar", "dollars", "per", "million", "most", "best",
    "top", "any", "every", "only", "not", "no", "but", "also", "can", "do",
    "support", "supporting", "supports", "have", "has", "having",
  ])

  for (const kws of Object.values(PROVIDER_KEYWORDS)) for (const kw of kws) knownWords.add(kw)
  for (const kws of Object.values(MODE_KEYWORDS)) for (const kw of kws) for (const w of kw.split(" ")) knownWords.add(w)
  for (const kw of Object.keys(PRICING_KEYWORDS)) for (const w of kw.split(" ")) knownWords.add(w)
  for (const kw of Object.keys(CONTEXT_KEYWORDS)) for (const w of kw.split(" ")) knownWords.add(w)
  for (const kw of Object.keys(CAPABILITY_KEYWORDS)) for (const w of kw.split(" ")) knownWords.add(w)

  const words = q.split(/\s+/).filter((w) => w.length > 0)
  const unknownWords = words.filter((w) => {
    if (knownWords.has(w)) return false
    if (/^\d+(\.\d+)?$/.test(w)) return false
    for (const kw of knownWords) {
      if (w.length > 3 && kw.length > 3 && (w.startsWith(kw) || kw.startsWith(w))) return false
    }
    return true
  })

  const hasAnyExtraction =
    extracted.providers.length > 0 ||
    extracted.modes.length > 0 ||
    extracted.pricing !== undefined ||
    extracted.context !== undefined ||
    Object.keys(extracted.caps).length > 0

  return hasAnyExtraction && unknownWords.length === 0
}

function buildFastResponse(query: string, providers: string[]) {
  const extractedProviders = extractProviders(query, providers)
  const modes = extractModes(query)
  const pricing = extractPricing(query)
  const context = extractContext(query)
  const caps = extractCapabilities(query)

  const filters: Record<string, unknown> = {}

  if (extractedProviders.length > 0) filters.provider = extractedProviders
  if (modes.length > 0) filters.mode = modes
  if (Object.keys(caps).length > 0) filters.supports = caps
  if (pricing !== undefined) filters.pricing = { max_input_cost_per_token: pricing }
  if (context !== undefined) filters.min_input_tokens = context

  const showColumns = pickShowColumns(modes, extractedProviders, caps, pricing !== undefined)

  const parts: string[] = []
  if (extractedProviders.length > 0) parts.push(extractedProviders.join(", "))
  if (modes.length > 0) parts.push(modes.join(", "))
  if (pricing !== undefined) parts.push("budget-filtered")
  if (context !== undefined) parts.push(`min ${context.toLocaleString()} tokens`)
  if (Object.keys(caps).length > 0) parts.push(Object.keys(caps).join(", "))

  const summary = parts.length > 0 ? `Showing ${parts.join(" · ")} models` : "Filters applied"

  return { filters, showColumns, summary }
}

function buildCompactPrompt(query: string, metadata: {
  providers: string[]
  modes: string[]
  contextRange: { min: number; max: number }
  costRange: { minInput: number; maxInput: number }
}) {
  const relevantProviders = extractProviders(query, metadata.providers)
  const providerList =
    relevantProviders.length > 0 ? relevantProviders.join(", ") : metadata.providers.slice(0, 15).join(", ")

  return `Convert this LLM catalog query to a JSON filter object.
Query: "${query}"
Providers available: ${providerList}
Modes: ${ALLOWED_MODES.join(", ")}
Schema: {filters:{provider?:string[],mode?:string[],supports?:{vision,audio_input,audio_output,function_calling,reasoning,web_search,prompt_caching,response_schema,system_messages:bool},min_input_tokens?:number,pricing?:{max_input_cost_per_token?:number}},showColumns?:string[],summary:string}
Rules:
- free→pricing.max_input_cost_per_token=0.000000001
- cheap→0.000001, very cheap→0.0000005, affordable→0.000005
- image gen→mode=image_generation, responses→mode=chat
- large context→min_input_tokens=100000, 1M→1000000
- Only set filters the user asked for
- showColumns from: provider,context,maxOutput,inputCost,outputCost,vision,audio,functionCalling,reasoning,webSearch,promptCaching,mode
Return ONLY valid JSON.`
}

export async function POST(req: Request) {
  const { query, metadata } = await req.json()

  if (isSimpleQuery(query, metadata.providers)) {
    return Response.json(buildFastResponse(query, metadata.providers))
  }

  const prompt = buildCompactPrompt(query, metadata)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch("https://ollama.com/api/chat", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma3:12b",
        format: "json",
        messages: [{ role: "user", content: prompt }],
        stream: false,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return Response.json(buildFastResponse(query, metadata.providers))
    }

    const data = await response.json()
    const content = data.message?.content

    if (!content) {
      return Response.json(buildFastResponse(query, metadata.providers))
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json(buildFastResponse(query, metadata.providers))
    }

    const parsed = JSON.parse(jsonMatch[0])
    const normalized = normalizeAIOutput(parsed)

    return Response.json(normalized)
  } catch {
    clearTimeout(timeout)
    return Response.json(buildFastResponse(query, metadata.providers))
  }
}
