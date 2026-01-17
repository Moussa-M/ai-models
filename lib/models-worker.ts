// Web Worker for background model fetching and processing

const LITELLM_URL =
  "https://raw.githubusercontent.com/BerriAI/litellm/refs/heads/main/model_prices_and_context_window.json"

const CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes

let lastHash: string | null = null

function extractProvider(modelId: string): string {
  if (modelId.startsWith("gpt-") || modelId.startsWith("o1") || modelId.startsWith("o3")) return "openai"
  if (modelId.startsWith("claude-")) return "anthropic"
  if (modelId.startsWith("gemini")) return "vertex_ai-language-models"
  if (modelId.includes("mistral") || modelId.includes("mixtral")) return "mistral"
  if (modelId.includes("llama")) return "meta"
  if (modelId.includes("deepseek")) return "deepseek"
  return "unknown"
}

function generateHash(data: any): string {
  const str = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return hash.toString(36)
}

async function fetchAndProcessModels() {
  try {
    const response = await fetch(LITELLM_URL)
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`)
    }

    const rawData = await response.json()
    const newHash = generateHash(rawData)

    // Skip if data hasn't changed
    if (newHash === lastHash) {
      self.postMessage({ type: "no-change" })
      return
    }

    lastHash = newHash

    const models = Object.entries(rawData)
      .filter(([key]) => key !== "sample_spec")
      .map(([id, data]: [string, any]) => ({
        id,
        litellm_provider: data.litellm_provider || extractProvider(id),
        mode: data.mode || "chat",
        max_input_tokens: data.max_input_tokens || data.max_tokens,
        max_output_tokens: data.max_output_tokens,
        input_cost_per_token: data.input_cost_per_token,
        output_cost_per_token: data.output_cost_per_token,
        supports_vision: data.supports_vision || false,
        supports_audio_input: data.supports_audio_input || false,
        supports_audio_output: data.supports_audio_output || false,
        supports_function_calling: data.supports_function_calling || false,
        supports_parallel_function_calling: data.supports_parallel_function_calling || false,
        supports_response_schema: data.supports_response_schema || false,
        supports_system_messages: data.supports_system_messages,
        supports_tool_choice: data.supports_tool_choice || false,
        supports_reasoning: data.supports_reasoning || false,
        supports_web_search: data.supports_web_search || false,
        supports_prompt_caching: data.supports_prompt_caching || false,
        input_cost_per_audio_token: data.input_cost_per_audio_token,
        output_cost_per_reasoning_token: data.output_cost_per_reasoning_token,
        deprecation_date: data.deprecation_date,
        source: data.source,
      }))
      .filter((model) => {
        if (model.mode === "embedding" || model.mode === "image_generation") {
          return false
        }
        if (model.deprecation_date) {
          const deprecationDate = new Date(model.deprecation_date)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          if (deprecationDate < today) {
            return false
          }
        }
        return true
      })

    self.postMessage({
      type: "models-updated",
      models,
      hash: newHash,
      count: models.length,
    })
  } catch (error) {
    self.postMessage({
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// Listen for messages from main thread
self.onmessage = (event) => {
  const { type, hash } = event.data

  if (type === "init") {
    lastHash = hash
    // Fetch immediately on init
    fetchAndProcessModels()
  } else if (type === "check") {
    fetchAndProcessModels()
  }
}

// Auto-check periodically
setInterval(() => {
  fetchAndProcessModels()
}, CHECK_INTERVAL)
