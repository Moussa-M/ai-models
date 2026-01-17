export interface Model {
  id: string
  litellm_provider: string
  mode?: string
  max_input_tokens?: number
  max_output_tokens?: number
  input_cost_per_token?: number
  output_cost_per_token?: number
  supports_vision?: boolean
  supports_audio_input?: boolean
  supports_audio_output?: boolean
  supports_function_calling?: boolean
  supports_parallel_function_calling?: boolean
  supports_response_schema?: boolean
  supports_system_messages?: boolean
  supports_tool_choice?: boolean
  supports_reasoning?: boolean
  supports_web_search?: boolean
  supports_prompt_caching?: boolean
  input_cost_per_audio_token?: number
  output_cost_per_reasoning_token?: number
  deprecation_date?: string
  source?: string
}

export async function fetchModels(): Promise<Model[]> {
  const response = await fetch("/api/models")
  if (!response.ok) {
    throw new Error("Failed to fetch models")
  }
  return response.json()
}

export const modelsData: Model[] = []
