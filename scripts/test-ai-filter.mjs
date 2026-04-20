#!/usr/bin/env node
// Comprehensive evaluation of the AI filter generation pipeline (gemma4:31b)
// Tests every FilterSchema field, all modes, all capability flags,
// pricing variants, token limits, showColumns, multi-filter combos,
// and sort-intent queries.
//
// Run all:          node scripts/test-ai-filter.mjs
// Run single group: node scripts/test-ai-filter.mjs --group Capabilities
// Verbose output:   node scripts/test-ai-filter.mjs -v

import { parseArgs } from "node:util"

const { values: argv } = parseArgs({
  options: {
    group:   { type: "string" },
    verbose: { type: "boolean", short: "v", default: false },
  },
  strict: false,
})

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY
if (!OLLAMA_API_KEY) {
  console.error("Missing OLLAMA_API_KEY env var")
  process.exit(1)
}

const MOCK_METADATA = {
  providers: [
    "openai", "anthropic", "google_ai_studio", "vertex_ai-chat-models",
    "bedrock", "azure", "cohere", "mistral", "groq", "together_ai",
    "ollama", "deepinfra", "fireworks_ai", "perplexity", "anyscale",
    "deepseek", "dashscope", "xai", "yi", "amazon",
  ],
  modes: [
    "chat", "embedding", "completion",
    "image_generation", "audio_transcription", "audio_speech",
    "moderation", "rerank", "search",
  ],
  contextRange: { min: 4096, max: 2000000 },
  costRange:    { minInput: 0.0, maxInput: 80.0 },
}

// ─── Test Suite ───────────────────────────────────────────────────────────────
const SUITE = {

  // ── 1. Providers ──────────────────────────────────────────────────────────
  Providers: [
    {
      label: "OpenAI only",
      query: "openai models",
      expect: (r) => [
        { label: "provider ⊇ openai",    pass: r.filters.provider?.some((p) => p.includes("openai")) },
        { label: "summary non-empty",     pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "Anthropic only",
      query: "anthropic models",
      expect: (r) => [
        { label: "provider ⊇ anthropic", pass: r.filters.provider?.some((p) => p.includes("anthropic")) },
        { label: "summary non-empty",     pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "Google models",
      query: "google models",
      expect: (r) => [
        { label: "provider ⊇ google",    pass: r.filters.provider?.some((p) => p.includes("google") || p.includes("vertex")) },
        { label: "summary non-empty",     pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "Azure models",
      query: "azure models",
      expect: (r) => [
        { label: "provider ⊇ azure",     pass: r.filters.provider?.some((p) => p.includes("azure")) },
        { label: "summary non-empty",     pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "AWS Bedrock models",
      query: "aws bedrock models",
      expect: (r) => [
        { label: "provider ⊇ bedrock",   pass: r.filters.provider?.some((p) => p.includes("bedrock") || p.includes("amazon")) },
        { label: "summary non-empty",     pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "Mistral models",
      query: "mistral models",
      expect: (r) => [
        { label: "provider ⊇ mistral",   pass: r.filters.provider?.some((p) => p.includes("mistral")) },
        { label: "summary non-empty",     pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "Cohere models",
      query: "cohere models",
      expect: (r) => [
        { label: "provider ⊇ cohere",    pass: r.filters.provider?.some((p) => p.includes("cohere")) },
        { label: "summary non-empty",     pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "Groq models",
      query: "groq models",
      expect: (r) => [
        { label: "provider ⊇ groq",      pass: r.filters.provider?.some((p) => p.includes("groq")) },
        { label: "summary non-empty",     pass: r.summary?.length > 0 },
      ],
    },
  ],

  // ── 2. Modes ──────────────────────────────────────────────────────────────
  Modes: [
    {
      label: "chat",
      query: "chat models",
      expect: (r) => [
        { label: 'mode includes "chat"',                pass: r.filters.mode?.includes("chat") },
        { label: "summary non-empty",                   pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "embedding",
      query: "embedding models",
      expect: (r) => [
        { label: 'mode includes "embedding"',           pass: r.filters.mode?.includes("embedding") },
        { label: "summary non-empty",                   pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "completion",
      query: "text completion models",
      expect: (r) => [
        { label: 'mode includes "completion"',          pass: r.filters.mode?.includes("completion") },
        { label: "summary non-empty",                   pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "image_generation",
      query: "image generation models",
      expect: (r) => [
        { label: 'mode includes "image_generation"',    pass: r.filters.mode?.includes("image_generation") },
        { label: "summary non-empty",                   pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "audio_transcription",
      query: "audio transcription models",
      expect: (r) => [
        { label: 'mode includes "audio_transcription"', pass: r.filters.mode?.includes("audio_transcription") },
        { label: "summary non-empty",                   pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "audio_speech",
      query: "text to speech models",
      expect: (r) => [
        { label: 'mode includes "audio_speech"',        pass: r.filters.mode?.includes("audio_speech") },
        { label: "summary non-empty",                   pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "rerank",
      query: "reranking models",
      expect: (r) => [
        { label: 'mode includes "rerank"',              pass: r.filters.mode?.includes("rerank") },
        { label: "summary non-empty",                   pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "moderation",
      query: "content moderation models",
      expect: (r) => [
        { label: 'mode includes "moderation"',          pass: r.filters.mode?.includes("moderation") },
        { label: "summary non-empty",                   pass: r.summary?.length > 0 },
      ],
    },
  ],

  // ── 3. All Capability Flags ───────────────────────────────────────────────
  Capabilities: [
    {
      label: "supports.vision",
      query: "models with vision support",
      expect: (r) => [
        { label: "supports.vision = true",                     pass: r.filters.supports?.vision === true },
        { label: "showColumns includes vision",                pass: r.showColumns?.includes("vision") },
        { label: "summary non-empty",                          pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "supports.audio_input",
      query: "models that support audio input",
      expect: (r) => [
        { label: "supports.audio_input = true",               pass: r.filters.supports?.audio_input === true },
        { label: "summary non-empty",                          pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "supports.audio_output",
      query: "models that support audio output or speech synthesis",
      expect: (r) => [
        { label: "supports.audio_output = true",              pass: r.filters.supports?.audio_output === true },
        { label: "summary non-empty",                          pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "supports.function_calling",
      query: "models with function calling / tools support",
      expect: (r) => [
        { label: "supports.function_calling = true",          pass: r.filters.supports?.function_calling === true },
        { label: "showColumns includes functionCalling",      pass: r.showColumns?.includes("functionCalling") },
        { label: "summary non-empty",                          pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "supports.parallel_function_calling",
      query: "models that support parallel function calling",
      expect: (r) => [
        { label: "supports.parallel_function_calling = true", pass: r.filters.supports?.parallel_function_calling === true },
        { label: "summary non-empty",                          pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "supports.reasoning",
      query: "models with reasoning capabilities",
      expect: (r) => [
        { label: "supports.reasoning = true",                 pass: r.filters.supports?.reasoning === true },
        { label: "showColumns includes reasoning",            pass: r.showColumns?.includes("reasoning") },
        { label: "summary non-empty",                          pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "supports.web_search",
      query: "models with web search support",
      expect: (r) => [
        { label: "supports.web_search = true",                pass: r.filters.supports?.web_search === true },
        { label: "showColumns includes webSearch",            pass: r.showColumns?.includes("webSearch") },
        { label: "summary non-empty",                          pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "supports.prompt_caching",
      query: "models that support prompt caching",
      expect: (r) => [
        { label: "supports.prompt_caching = true",            pass: r.filters.supports?.prompt_caching === true },
        { label: "showColumns includes promptCaching",        pass: r.showColumns?.includes("promptCaching") },
        { label: "summary non-empty",                          pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "supports.response_schema",
      query: "models with structured output or response schema support",
      expect: (r) => [
        { label: "supports.response_schema = true",           pass: r.filters.supports?.response_schema === true },
        { label: "summary non-empty",                          pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "supports.system_messages",
      query: "models that support system messages",
      expect: (r) => [
        { label: "supports.system_messages = true",           pass: r.filters.supports?.system_messages === true },
        { label: "summary non-empty",                          pass: r.summary?.length > 0 },
      ],
    },
  ],

  // ── 4. Token Limits ───────────────────────────────────────────────────────
  TokenLimits: [
    {
      label: "min_input_tokens: large context (100k)",
      query: "models with large context window",
      expect: (r) => [
        { label: "min_input_tokens >= 100000",    pass: (r.filters.min_input_tokens ?? 0) >= 100000 },
        { label: "showColumns includes context",  pass: r.showColumns?.includes("context") },
        { label: "summary non-empty",             pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "min_input_tokens: very large context (500k)",
      query: "models with very large context window",
      expect: (r) => [
        { label: "min_input_tokens >= 500000",    pass: (r.filters.min_input_tokens ?? 0) >= 500000 },
        { label: "summary non-empty",             pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "min_input_tokens: 1M context",
      query: "models with 1 million token context window",
      expect: (r) => [
        { label: "min_input_tokens >= 1000000",   pass: (r.filters.min_input_tokens ?? 0) >= 1000000 },
        { label: "summary non-empty",             pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "min_output_tokens",
      query: "models with at least 16000 max output tokens",
      expect: (r) => [
        { label: "min_output_tokens set",         pass: r.filters.min_output_tokens != null },
        { label: "min_output_tokens >= 16000",    pass: (r.filters.min_output_tokens ?? 0) >= 16000 },
        { label: "showColumns includes maxOutput", pass: r.showColumns?.includes("maxOutput") },
        { label: "summary non-empty",             pass: r.summary?.length > 0 },
      ],
    },
  ],

  // ── 5. Pricing Filters ────────────────────────────────────────────────────
  Pricing: [
    {
      label: "max_input_cost_per_token: cheap ($1/M)",
      query: "cheap chat models",
      expect: (r) => [
        { label: "max_input_cost_per_token set",       pass: r.filters.pricing?.max_input_cost_per_token != null },
        { label: "price cap <= 0.000001 ($1/M)",       pass: (r.filters.pricing?.max_input_cost_per_token ?? Infinity) <= 0.000001 },
        { label: "showColumns includes inputCost",     pass: r.showColumns?.includes("inputCost") },
        { label: "summary non-empty",                  pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "max_input_cost_per_token: cheapest ($0.5/M)",
      query: "cheapest models available",
      expect: (r) => [
        { label: "max_input_cost_per_token set",       pass: r.filters.pricing?.max_input_cost_per_token != null },
        { label: "price cap <= 0.0000005 ($0.5/M)",    pass: (r.filters.pricing?.max_input_cost_per_token ?? Infinity) <= 0.0000005 },
        { label: "summary non-empty",                  pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "max_input_cost_per_token: affordable ($5/M)",
      query: "affordable mid-range chat models",
      expect: (r) => [
        { label: "max_input_cost_per_token set",       pass: r.filters.pricing?.max_input_cost_per_token != null },
        { label: "price cap <= 0.000005 ($5/M)",       pass: (r.filters.pricing?.max_input_cost_per_token ?? Infinity) <= 0.000005 },
        { label: "summary non-empty",                  pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "max_output_cost_per_token",
      query: "models with cheap output tokens under $5 per million output",
      expect: (r) => [
        { label: "max_output_cost_per_token set",      pass: r.filters.pricing?.max_output_cost_per_token != null },
        { label: "output price cap <= 0.000005",       pass: (r.filters.pricing?.max_output_cost_per_token ?? Infinity) <= 0.000005 },
        { label: "showColumns includes outputCost",    pass: r.showColumns?.includes("outputCost") },
        { label: "summary non-empty",                  pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "max_input_cost_per_audio_token",
      query: "cheap audio transcription models with low cost per audio token",
      expect: (r) => [
        {
          label: "audio pricing or audio mode set",
          pass:
            r.filters.pricing?.max_input_cost_per_audio_token != null ||
            r.filters.mode?.includes("audio_transcription"),
        },
        { label: "summary non-empty", pass: r.summary?.length > 0 },
      ],
    },
  ],

  // ── 6. ShowColumns Coverage ───────────────────────────────────────────────
  ShowColumns: [
    {
      label: "provider + inputCost",
      query: "compare input costs across providers",
      expect: (r) => [
        { label: "showColumns includes provider",        pass: r.showColumns?.includes("provider") },
        { label: "showColumns includes inputCost",       pass: r.showColumns?.includes("inputCost") },
        { label: "summary non-empty",                    pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "context + maxOutput",
      query: "models with large context and high max output tokens",
      expect: (r) => [
        { label: "showColumns includes context",         pass: r.showColumns?.includes("context") },
        { label: "summary non-empty",                    pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "mode column",
      query: "show me models grouped by mode",
      expect: (r) => [
        { label: "showColumns includes mode",            pass: r.showColumns?.includes("mode") },
        { label: "summary non-empty",                    pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "reasoning + webSearch columns",
      query: "models with reasoning and web search",
      expect: (r) => [
        { label: "showColumns includes reasoning",       pass: r.showColumns?.includes("reasoning") },
        { label: "showColumns includes webSearch",       pass: r.showColumns?.includes("webSearch") },
        { label: "supports.reasoning = true",           pass: r.filters.supports?.reasoning === true },
        { label: "supports.web_search = true",          pass: r.filters.supports?.web_search === true },
        { label: "summary non-empty",                    pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "promptCaching + functionCalling columns",
      query: "models that support caching and function calling",
      expect: (r) => [
        { label: "showColumns includes promptCaching",   pass: r.showColumns?.includes("promptCaching") },
        { label: "showColumns includes functionCalling", pass: r.showColumns?.includes("functionCalling") },
        { label: "summary non-empty",                    pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "audio column",
      query: "models with audio support",
      expect: (r) => [
        { label: "showColumns includes audio",           pass: r.showColumns?.includes("audio") },
        { label: "summary non-empty",                    pass: r.summary?.length > 0 },
      ],
    },
  ],

  // ── 7. Sort Intent Queries ────────────────────────────────────────────────
  SortIntent: [
    {
      label: "sort by cheapest input cost",
      query: "sort models by cheapest input cost",
      expect: (r) => [
        { label: "showColumns includes inputCost",  pass: r.showColumns?.includes("inputCost") },
        { label: "summary non-empty",               pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "sort by largest context window",
      query: "sort by largest context window first",
      expect: (r) => [
        { label: "showColumns includes context",    pass: r.showColumns?.includes("context") },
        { label: "summary non-empty",               pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "sort by output cost",
      query: "sort models by output cost cheapest first",
      expect: (r) => [
        { label: "showColumns includes outputCost", pass: r.showColumns?.includes("outputCost") },
        { label: "summary non-empty",               pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "sort by max output tokens",
      query: "which models have the highest max output tokens",
      expect: (r) => [
        { label: "showColumns includes maxOutput",  pass: r.showColumns?.includes("maxOutput") },
        { label: "summary non-empty",               pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "sort by provider name",
      query: "show all models sorted by provider name",
      expect: (r) => [
        { label: "showColumns includes provider",   pass: r.showColumns?.includes("provider") },
        { label: "summary non-empty",               pass: r.summary?.length > 0 },
      ],
    },
  ],

  // ── 8. Multi-Filter Combinations ─────────────────────────────────────────
  Combined: [
    {
      label: "Cheap Google vision models",
      query: "cheap vision models from google",
      expect: (r) => [
        { label: "provider ⊇ google",               pass: r.filters.provider?.some((p) => p.includes("google") || p.includes("vertex")) },
        { label: "supports.vision = true",           pass: r.filters.supports?.vision === true },
        { label: "price cap set",                    pass: r.filters.pricing?.max_input_cost_per_token != null },
        { label: "summary non-empty",                pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "Large context chat + reasoning",
      query: "large context chat models with reasoning",
      expect: (r) => [
        { label: 'mode includes "chat"',             pass: r.filters.mode?.includes("chat") },
        { label: "supports.reasoning = true",        pass: r.filters.supports?.reasoning === true },
        { label: "min_input_tokens >= 100000",       pass: (r.filters.min_input_tokens ?? 0) >= 100000 },
        { label: "summary non-empty",                pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "Cheapest function-calling models",
      query: "cheapest models with function calling",
      expect: (r) => [
        { label: "supports.function_calling = true", pass: r.filters.supports?.function_calling === true },
        { label: "price cap <= $0.5/M",              pass: (r.filters.pricing?.max_input_cost_per_token ?? Infinity) <= 0.0000005 },
        { label: "summary non-empty",                pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "OpenAI cheap chat + function calling",
      query: "cheap openai chat models with function calling",
      expect: (r) => [
        { label: "provider ⊇ openai",               pass: r.filters.provider?.some((p) => p.includes("openai")) },
        { label: "supports.function_calling = true", pass: r.filters.supports?.function_calling === true },
        { label: "price cap set",                    pass: r.filters.pricing?.max_input_cost_per_token != null },
        { label: "summary non-empty",                pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "Anthropic vision + prompt caching",
      query: "anthropic models with vision and prompt caching",
      expect: (r) => [
        { label: "provider ⊇ anthropic",            pass: r.filters.provider?.some((p) => p.includes("anthropic")) },
        { label: "supports.vision = true",           pass: r.filters.supports?.vision === true },
        { label: "supports.prompt_caching = true",  pass: r.filters.supports?.prompt_caching === true },
        { label: "summary non-empty",                pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "Embedding + huge context",
      query: "embedding models with huge context window",
      expect: (r) => [
        { label: 'mode includes "embedding"',        pass: r.filters.mode?.includes("embedding") },
        { label: "min_input_tokens >= 500000",       pass: (r.filters.min_input_tokens ?? 0) >= 500000 },
        { label: "summary non-empty",                pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "Cheap bedrock + reasoning + web search",
      query: "cheap bedrock chat models with reasoning and web search",
      expect: (r) => [
        { label: "provider ⊇ bedrock",              pass: r.filters.provider?.some((p) => p.includes("bedrock") || p.includes("amazon")) },
        { label: "supports.reasoning = true",        pass: r.filters.supports?.reasoning === true },
        { label: "supports.web_search = true",      pass: r.filters.supports?.web_search === true },
        { label: "price cap set",                    pass: r.filters.pricing?.max_input_cost_per_token != null },
        { label: "summary non-empty",                pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "Azure cheap chat + response schema + system messages",
      query: "cheap azure chat models with structured output and system message support",
      expect: (r) => [
        { label: "provider ⊇ azure",                pass: r.filters.provider?.some((p) => p.includes("azure")) },
        { label: "supports.response_schema = true", pass: r.filters.supports?.response_schema === true },
        { label: "supports.system_messages = true", pass: r.filters.supports?.system_messages === true },
        { label: "price cap set",                    pass: r.filters.pricing?.max_input_cost_per_token != null },
        { label: "summary non-empty",                pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "Mistral cheap chat + function calling + 1M context",
      query: "cheap mistral chat models with function calling and 1 million token context",
      expect: (r) => [
        { label: "provider ⊇ mistral",              pass: r.filters.provider?.some((p) => p.includes("mistral")) },
        { label: 'mode includes "chat"',             pass: r.filters.mode?.includes("chat") },
        { label: "supports.function_calling = true", pass: r.filters.supports?.function_calling === true },
        { label: "min_input_tokens >= 1000000",      pass: (r.filters.min_input_tokens ?? 0) >= 1000000 },
        { label: "price cap set",                    pass: r.filters.pricing?.max_input_cost_per_token != null },
        { label: "summary non-empty",                pass: r.summary?.length > 0 },
      ],
    },
  ],

  // ── 9. Precision (no spurious filters) ───────────────────────────────────
  Precision: [
    {
      label: "Only provider — no extra caps",
      query: "anthropic models",
      expect: (r) => [
        { label: "provider ⊇ anthropic",  pass: r.filters.provider?.some((p) => p.includes("anthropic")) },
        { label: "no spurious mode",       pass: !r.filters.mode?.length },
        { label: "no spurious supports",   pass: !r.filters.supports || Object.keys(r.filters.supports).length === 0 },
        { label: "no spurious pricing",    pass: !r.filters.pricing  || Object.keys(r.filters.pricing).length  === 0 },
        { label: "summary non-empty",      pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "Only mode — no extra caps",
      query: "show me embedding models",
      expect: (r) => [
        { label: 'mode includes "embedding"', pass: r.filters.mode?.includes("embedding") },
        { label: "no spurious supports",      pass: !r.filters.supports || Object.keys(r.filters.supports).length === 0 },
        { label: "no spurious pricing",       pass: !r.filters.pricing  || Object.keys(r.filters.pricing).length  === 0 },
        { label: "summary non-empty",         pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "Only capability — no spurious provider or pricing",
      query: "models with reasoning",
      expect: (r) => [
        { label: "supports.reasoning = true", pass: r.filters.supports?.reasoning === true },
        { label: "no spurious provider",      pass: !r.filters.provider?.length },
        { label: "no spurious pricing",       pass: !r.filters.pricing  || Object.keys(r.filters.pricing).length  === 0 },
        { label: "summary non-empty",         pass: r.summary?.length > 0 },
      ],
    },
    {
      label: "Only pricing — no spurious caps",
      query: "cheap models",
      expect: (r) => [
        { label: "price cap set",          pass: r.filters.pricing?.max_input_cost_per_token != null },
        { label: "no spurious mode",       pass: !r.filters.mode?.length },
        { label: "no spurious supports",   pass: !r.filters.supports || Object.keys(r.filters.supports).length === 0 },
        { label: "summary non-empty",      pass: r.summary?.length > 0 },
      ],
    },
  ],
}

// ─── Prompt builder (mirrors route.ts) ───────────────────────────────────────
function buildPrompt(query, metadata) {
  return `You are a STRICT filter generator for an LLM model catalog.

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
- "audio output / speech synthesis" → supports.audio_output = true
- "function calling" / "tools" → supports.function_calling = true
- "parallel function calling" → supports.parallel_function_calling = true
- "reasoning" → supports.reasoning = true
- "web search" → supports.web_search = true
- "prompt caching" / "caching" → supports.prompt_caching = true
- "response schema" / "structured output" → supports.response_schema = true
- "system messages" → supports.system_messages = true

PRICING RULES:
- "cheap" → max_input_cost_per_token = 0.000001 (=$1/M tokens)
- "very cheap" / "cheapest" → max_input_cost_per_token = 0.0000005 (=$0.5/M tokens)
- "affordable" / "mid-range" → max_input_cost_per_token = 0.000005 (=$5/M tokens)
- If mode=chat/completion/embedding, use token pricing
- If mode=audio*, use audio token pricing (max_input_cost_per_audio_token)
- For output cost filters, use max_output_cost_per_token

CONTEXT RULES:
- "large context" → min_input_tokens = 100000
- "very large context" / "huge context" → min_input_tokens = 500000
- "1M context" → min_input_tokens = 1000000

OUTPUT TOKEN RULES:
- If user specifies a minimum output token count, set min_output_tokens accordingly

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
Write a short sentence describing the applied filters.

EXAMPLES:

Query: "cheap vision models from google"
{"filters":{"provider":["google_ai_studio","vertex_ai-chat-models"],"supports":{"vision":true},"pricing":{"max_input_cost_per_token":0.000001}},"showColumns":["provider","inputCost","vision"],"summary":"Google models with vision under $1/M tokens"}

Query: "large context chat models with reasoning"
{"filters":{"mode":["chat"],"supports":{"reasoning":true},"min_input_tokens":100000},"showColumns":["provider","context","reasoning"],"summary":"Chat models with reasoning and large context"}

Query: "cheapest models with function calling"
{"filters":{"supports":{"function_calling":true},"pricing":{"max_input_cost_per_token":0.0000005}},"showColumns":["provider","inputCost","functionCalling"],"summary":"Low-cost models with function calling support"}

Return ONLY valid JSON matching the schema.`
}

// ─── Runner ───────────────────────────────────────────────────────────────────
async function runCase(tc) {
  const res = await fetch("https://ollama.com/api/chat", {
    method: "POST",
    headers: { Authorization: `Bearer ${OLLAMA_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gemma4:31b",
      messages: [{ role: "user", content: buildPrompt(tc.query, MOCK_METADATA) }],
      stream: false,
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const content = data.message?.content ?? ""
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`No JSON in response. Content: ${content.slice(0, 200)}`)
  return JSON.parse(jsonMatch[0])
}

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  pass: "\x1b[32m✓\x1b[0m",
  fail: "\x1b[31m✗\x1b[0m",
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim:  (s) => `\x1b[2m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const groups = argv.group
  ? Object.fromEntries(Object.entries(SUITE).filter(([k]) => k.toLowerCase() === argv.group.toLowerCase()))
  : SUITE

if (Object.keys(groups).length === 0) {
  console.error(`Group "${argv.group}" not found. Available: ${Object.keys(SUITE).join(", ")}`)
  process.exit(1)
}

let totalPassed = 0
let totalChecks = 0
let totalCases  = 0
let failedCases = 0
const results   = []

for (const [groupName, cases] of Object.entries(groups)) {
  console.log(`\n${C.bold(C.cyan(`── ${groupName} ${"─".repeat(Math.max(0, 54 - groupName.length))}`))}\n`)

  for (const tc of cases) {
    totalCases++
    process.stdout.write(`  ${C.dim(tc.label)}\n  ${C.dim("›")} "${tc.query}" … `)
    const start = Date.now()

    let result, parseError
    try {
      result = await runCase(tc)
    } catch (e) {
      parseError = e
    }

    const elapsed = Date.now() - start

    if (parseError) {
      failedCases++
      console.log(`${C.fail} ERROR (${elapsed}ms): ${parseError.message}\n`)
      results.push({ group: groupName, label: tc.label, passed: 0, total: 0, error: true })
      continue
    }

    const checks = tc.expect(result)
    const passed  = checks.filter((c) => c.pass).length
    totalPassed  += passed
    totalChecks  += checks.length
    if (passed < checks.length) failedCases++

    const allPass = passed === checks.length
    console.log(`${allPass ? C.pass : C.fail} ${passed}/${checks.length} (${elapsed}ms)`)

    for (const c of checks) {
      console.log(`      ${c.pass ? C.pass : C.fail} ${c.label}`)
    }

    if (argv.verbose || !allPass) {
      console.log(`      ${C.dim("summary:")}     "${result.summary}"`)
      console.log(`      ${C.dim("filters:")}     ${JSON.stringify(result.filters)}`)
      console.log(`      ${C.dim("showColumns:")} ${JSON.stringify(result.showColumns)}`)
    }
    console.log()

    results.push({ group: groupName, label: tc.label, passed, total: checks.length })
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────
const pct = totalChecks > 0 ? ((totalPassed / totalChecks) * 100).toFixed(1) : "0.0"
console.log(`\n${"═".repeat(60)}`)
console.log(C.bold(`  ${totalPassed}/${totalChecks} checks  (${pct}%)  |  ${totalCases - failedCases}/${totalCases} cases passed`))

const byGroup = {}
for (const r of results) {
  if (!byGroup[r.group]) byGroup[r.group] = { passed: 0, total: 0, cases: 0, ok: 0 }
  byGroup[r.group].passed += r.passed
  byGroup[r.group].total  += r.total
  byGroup[r.group].cases++
  if (!r.error && r.passed === r.total) byGroup[r.group].ok++
}

console.log()
for (const [g, s] of Object.entries(byGroup)) {
  const icon = s.passed === s.total ? C.pass : C.fail
  const pctG = s.total > 0 ? ((s.passed / s.total) * 100).toFixed(0) : "0"
  console.log(`  ${icon} ${g.padEnd(24)} ${String(s.passed).padStart(3)}/${s.total} checks  ${pctG}%  (${s.ok}/${s.cases} cases)`)
}
console.log(`${"═".repeat(60)}\n`)

process.exit(totalPassed === totalChecks ? 0 : 1)
