"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { Header } from "./llm-grid/header"
import { SearchBar } from "./llm-grid/search-bar"
import { AIFeedbackBar } from "./llm-grid/ai-feedback-bar"
import { CostCalculator } from "./llm-grid/cost-calculator"
import { ModelTable } from "./llm-grid/model-table"
import { ModelDetailPanel } from "./llm-grid/model-detail-panel"
import type { Model } from "@/lib/models-data"
import type { ColumnConfig } from "./llm-grid/column-visibility"
import { getCachedModels, cacheModels, generateDataHash } from "@/lib/indexed-db"

export type ViewMode = "specs" | "calculator"
export type SortKey = keyof Model | "projected_cost"
export type SortDirection = "asc" | "desc"

export interface SortConfig {
  key: SortKey
  direction: SortDirection
}

export interface AIFilterSummary {
  summary: string
  appliedFilters: string[]
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "model", label: "Model", visible: true, required: true },
  { key: "provider", label: "Provider", visible: true },
  { key: "context", label: "Context", visible: true },
  { key: "maxOutput", label: "Max Output", visible: false },
  { key: "inputCost", label: "Input Cost", visible: true },
  { key: "outputCost", label: "Output Cost", visible: true },
  { key: "vision", label: "Vision", visible: false },
  { key: "audio", label: "Audio", visible: false },
  { key: "functionCalling", label: "Functions", visible: false },
  { key: "reasoning", label: "Reasoning", visible: false },
  { key: "webSearch", label: "Web Search", visible: false },
  { key: "promptCaching", label: "Caching", visible: false },
  { key: "mode", label: "Mode", visible: false },
]

const STORAGE_KEYS = {
  columns: "ai-models-columns",
  columnFilters: "ai-models-column-filters",
  sortConfigs: "ai-models-sort-configs",
  viewMode: "ai-models-view-mode",
  darkMode: "ai-models-dark-mode",
}

function getStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

function mergeColumnsWithDefaults(stored: ColumnConfig[] | null, defaults: ColumnConfig[]): ColumnConfig[] {
  if (!stored || stored.length === 0) return defaults
  const storedVisibility = new Map(stored.map((c) => [c.key, c.visible]))
  return defaults.map((col) => ({
    ...col,
    visible: storedVisibility.has(col.key) ? storedVisibility.get(col.key)! : col.visible,
  }))
}

export function LLMIntelligenceGrid() {
  const [models, setModels] = useState<Model[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [viewMode, setViewMode] = useState<ViewMode>("specs")
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ key: "id", direction: "asc" }])
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [inputTokens, setInputTokens] = useState(1000000)
  const [outputTokens, setOutputTokens] = useState(200000)
  const [isSearching, setIsSearching] = useState(false)
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({})
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [aiFilterSummary, setAiFilterSummary] = useState<AIFilterSummary | null>(null)
  const [maxInputCostFilter, setMaxInputCostFilter] = useState<number | null>(null)
  const [minContextFilter, setMinContextFilter] = useState<number | null>(null)

  useEffect(() => {
    // Load stored values from localStorage
    const storedColumns = getStoredValue<ColumnConfig[] | null>(STORAGE_KEYS.columns, null)
    setColumns(mergeColumnsWithDefaults(storedColumns, DEFAULT_COLUMNS))

    const storedFilters = getStoredValue<Record<string, string[]>>(STORAGE_KEYS.columnFilters, {})
    setColumnFilters(storedFilters)

    const storedSort = getStoredValue<SortConfig[]>(STORAGE_KEYS.sortConfigs, [{ key: "id", direction: "asc" }])
    setSortConfigs(storedSort)

    const storedViewMode = getStoredValue<ViewMode>(STORAGE_KEYS.viewMode, "specs")
    setViewMode(storedViewMode)

    const storedDarkMode = getStoredValue<boolean>(STORAGE_KEYS.darkMode, false)
    setIsDarkMode(storedDarkMode)
    if (storedDarkMode) {
      document.documentElement.classList.add("dark")
    }

    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEYS.columns, JSON.stringify(columns))
    }
  }, [columns, isHydrated])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEYS.columnFilters, JSON.stringify(columnFilters))
    }
  }, [columnFilters, isHydrated])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEYS.sortConfigs, JSON.stringify(sortConfigs))
    }
  }, [sortConfigs, isHydrated])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEYS.viewMode, JSON.stringify(viewMode))
    }
  }, [viewMode, isHydrated])

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEYS.darkMode, JSON.stringify(isDarkMode))
    }
  }, [isDarkMode, isHydrated])

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const newValue = !prev
      if (newValue) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
      return newValue
    })
  }, [])

  const fetchModels = useCallback(async (cachedHash?: string) => {
    try {
      const response = await fetch("/api/models")
      if (!response.ok) throw new Error("Failed to fetch models")

      const newModels = await response.json()
      const newHash = generateDataHash(newModels)

      // Skip update if data hasn't changed
      if (cachedHash && newHash === cachedHash) {
        return { changed: false }
      }

      setModels(newModels)
      setLastUpdated(Date.now())
      await cacheModels(newModels, newHash)
      return { changed: true, hash: newHash }
    } catch (err) {
      throw err
    }
  }, [])

  const initializeData = useCallback(async () => {
    try {
      // Load from IndexedDB cache first for instant display
      const cached = await getCachedModels()

      if (cached.models.length > 0) {
        setModels(cached.models)
        setLastUpdated(cached.lastUpdated)
        setIsLoading(false)
      }

      // Fetch fresh data
      await fetchModels(cached.dataHash)
      setIsLoading(false)
      setError(null)

      // Set up auto-refresh every 5 minutes
      refreshIntervalRef.current = setInterval(
        async () => {
          try {
            const currentCached = await getCachedModels()
            await fetchModels(currentCached.dataHash)
          } catch (err) {
            console.error("[v0] Auto-refresh error:", err)
          }
        },
        5 * 60 * 1000,
      )
    } catch (err) {
      console.error("[v0] Initialization error:", err)
      setError(err instanceof Error ? err.message : "Failed to load models")
      setIsLoading(false)
    }
  }, [fetchModels])

  useEffect(() => {
    initializeData()

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [initializeData])

  const [forceRefreshTrigger, setForceRefreshTrigger] = useState(false)

  const forceRefresh = useCallback(async () => {
    setIsLoading(true)
    try {
      await fetchModels()
    } catch (err) {
      console.error("[v0] Refresh error:", err)
    }
    setIsLoading(false)
    setForceRefreshTrigger(!forceRefreshTrigger)
  }, [fetchModels])

  const formatTokens = (n?: number) => {
    if (!n) return "-"
    if (n >= 1000000) return `${(n / 1000000).toFixed(0)}M`
    return `${Math.round(n / 1000)}k`
  }

  const formatCost = (cost?: number) => {
    if (!cost) return "-"
    const perMillion = cost * 1000000
    return `$${perMillion.toFixed(2)}`
  }

  const filteredAndSortedModels = useMemo(() => {
    let filtered = models

    if (maxInputCostFilter !== null) {
      filtered = filtered.filter((m) => {
        const costPerMillion = (m.input_cost_per_token || 0) * 1000000
        return costPerMillion <= maxInputCostFilter
      })
    }

    if (minContextFilter !== null) {
      filtered = filtered.filter((m) => (m.max_input_tokens || 0) >= minContextFilter)
    }

    if (columnFilters.provider && columnFilters.provider.length > 0) {
      if ((columnFilters as any)._providerIncludeMode) {
        filtered = filtered.filter((m) =>
          columnFilters.provider.some((p) => m.litellm_provider.toLowerCase().includes(p.toLowerCase())),
        )
      } else {
        filtered = filtered.filter((m) => !columnFilters.provider.includes(m.litellm_provider))
      }
    }
    if (columnFilters.context && columnFilters.context.length > 0) {
      filtered = filtered.filter((m) => !columnFilters.context.includes(formatTokens(m.max_input_tokens)))
    }
    if (columnFilters.maxOutput && columnFilters.maxOutput.length > 0) {
      filtered = filtered.filter((m) => !columnFilters.maxOutput.includes(formatTokens(m.max_output_tokens)))
    }
    if (columnFilters.inputCost && columnFilters.inputCost.length > 0) {
      filtered = filtered.filter((m) => !columnFilters.inputCost.includes(formatCost(m.input_cost_per_token)))
    }
    if (columnFilters.outputCost && columnFilters.outputCost.length > 0) {
      filtered = filtered.filter((m) => !columnFilters.outputCost.includes(formatCost(m.output_cost_per_token)))
    }
    if (columnFilters.mode && columnFilters.mode.length > 0) {
      if ((columnFilters as any)._modeIncludeMode) {
        filtered = filtered.filter((m) => columnFilters.mode.includes(m.mode || ""))
      } else {
        filtered = filtered.filter((m) => !columnFilters.mode.includes(m.mode || "-"))
      }
    }
    if (columnFilters.vision && columnFilters.vision.length > 0) {
      if (columnFilters.vision.includes("true")) {
        filtered = filtered.filter((m) => m.supports_vision === true)
      } else if (columnFilters.vision.includes("false")) {
        filtered = filtered.filter((m) => !m.supports_vision)
      }
    }
    if (columnFilters.audio && columnFilters.audio.length > 0) {
      if (columnFilters.audio.includes("true")) {
        filtered = filtered.filter((m) => m.supports_audio_input || m.supports_audio_output)
      } else if (columnFilters.audio.includes("false")) {
        filtered = filtered.filter((m) => !m.supports_audio_input && !m.supports_audio_output)
      }
    }
    if (columnFilters.functionCalling && columnFilters.functionCalling.length > 0) {
      if (columnFilters.functionCalling.includes("true")) {
        filtered = filtered.filter((m) => m.supports_function_calling === true)
      } else if (columnFilters.functionCalling.includes("false")) {
        filtered = filtered.filter((m) => !m.supports_function_calling)
      }
    }
    if (columnFilters.reasoning && columnFilters.reasoning.length > 0) {
      if (columnFilters.reasoning.includes("true")) {
        filtered = filtered.filter((m) => m.supports_reasoning === true)
      } else if (columnFilters.reasoning.includes("false")) {
        filtered = filtered.filter((m) => !m.supports_reasoning)
      }
    }
    if (columnFilters.webSearch && columnFilters.webSearch.length > 0) {
      if (columnFilters.webSearch.includes("true")) {
        filtered = filtered.filter((m) => m.supports_web_search === true)
      } else if (columnFilters.webSearch.includes("false")) {
        filtered = filtered.filter((m) => !m.supports_web_search)
      }
    }
    if (columnFilters.promptCaching && columnFilters.promptCaching.length > 0) {
      if (columnFilters.promptCaching.includes("true")) {
        filtered = filtered.filter((m) => m.supports_prompt_caching === true)
      } else if (columnFilters.promptCaching.includes("false")) {
        filtered = filtered.filter((m) => !m.supports_prompt_caching)
      }
    }

    filtered.sort((a, b) => {
      for (const { key, direction } of sortConfigs) {
        let aVal: number | string | boolean
        let bVal: number | string | boolean

        if (key === "projected_cost") {
          const aCost = (a.input_cost_per_token || 0) * inputTokens + (a.output_cost_per_token || 0) * outputTokens
          const bCost = (b.input_cost_per_token || 0) * inputTokens + (b.output_cost_per_token || 0) * outputTokens
          aVal = aCost
          bVal = bCost
        } else {
          aVal = a[key] ?? ""
          bVal = b[key] ?? ""
        }

        let comparison = 0
        if (typeof aVal === "string" && typeof bVal === "string") {
          comparison = aVal.localeCompare(bVal)
        } else if (typeof aVal === "number" && typeof bVal === "number") {
          comparison = aVal - bVal
        } else if (typeof aVal === "boolean" && typeof bVal === "boolean") {
          comparison = (aVal ? 1 : 0) - (bVal ? 1 : 0)
        }

        if (comparison !== 0) {
          return direction === "asc" ? comparison : -comparison
        }
      }
      return 0
    })

    return filtered
  }, [models, sortConfigs, inputTokens, outputTokens, columnFilters, maxInputCostFilter, minContextFilter])

  const handleSort = (key: SortKey, addToExisting: boolean) => {
    setSortConfigs((prev) => {
      const existingIndex = prev.findIndex((s) => s.key === key)

      if (addToExisting) {
        if (existingIndex >= 0) {
          const currentDirection = prev[existingIndex].direction
          if (currentDirection === "desc") {
            // Third click: remove this sort
            return prev.filter((s) => s.key !== key)
          } else {
            // Second click: toggle to desc
            const newConfigs = [...prev]
            newConfigs[existingIndex] = {
              ...newConfigs[existingIndex],
              direction: "desc",
            }
            return newConfigs
          }
        } else {
          // First click: add with asc
          return [...prev, { key, direction: "asc" }]
        }
      } else {
        if (existingIndex >= 0 && prev.length === 1) {
          // This is the only sort config
          const currentDirection = prev[existingIndex].direction
          if (currentDirection === "desc") {
            // Third click: remove sort (go back to no sort)
            return []
          } else {
            // Second click: toggle to desc
            return [{ key, direction: "desc" }]
          }
        } else {
          // First click or different column: set as only sort with asc
          return [{ key, direction: "asc" }]
        }
      }
    })
  }

  const handleColumnFilterChange = (column: string, values: string[]) => {
    setColumnFilters((prev) => {
      const newFilters = { ...prev, [column]: values }
      delete (newFilters as any)._providerIncludeMode
      delete (newFilters as any)._modeIncludeMode
      return newFilters
    })
  }

  const handleAISearch = async (query: string) => {
    if (!query.trim()) return
    setIsSearching(true)

    try {
      const uniqueProviders = [...new Set(models.map((m) => m.litellm_provider))]
      const uniqueModes = [...new Set(models.map((m) => m.mode).filter(Boolean))]

      const inputCosts = models.map((m) => (m.input_cost_per_token || 0) * 1000000).filter((c) => c > 0)
      const outputCosts = models.map((m) => (m.output_cost_per_token || 0) * 1000000).filter((c) => c > 0)
      const contextSizes = models.map((m) => m.max_input_tokens || 0).filter((c) => c > 0)

      const metadata = {
        providers: uniqueProviders,
        modes: uniqueModes,
        contextRange: {
          min: Math.min(...contextSizes),
          max: Math.max(...contextSizes),
        },
        costRange: {
          minInput: Math.min(...inputCosts),
          maxInput: Math.max(...inputCosts),
          minOutput: Math.min(...outputCosts),
          maxOutput: Math.max(...outputCosts),
        },
        capabilityCounts: {
          vision: models.filter((m) => m.supports_vision).length,
          audio: models.filter((m) => m.supports_audio_input || m.supports_audio_output).length,
          functionCalling: models.filter((m) => m.supports_function_calling).length,
          reasoning: models.filter((m) => m.supports_reasoning).length,
          webSearch: models.filter((m) => m.supports_web_search).length,
          promptCaching: models.filter((m) => m.supports_prompt_caching).length,
        },
      }

      const response = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, metadata }),
      })

      if (!response.ok) throw new Error("AI search failed")

      const data = await response.json()
      const { filters, showColumns, summary } = data

      const newColumnFilters: Record<string, string[]> & {
        _providerIncludeMode?: boolean
        _modeIncludeMode?: boolean
      } = {}
      const appliedFilters: string[] = []

      if (filters.provider && filters.provider.length > 0) {
        newColumnFilters.provider = filters.provider
        newColumnFilters._providerIncludeMode = true
        appliedFilters.push(`Provider: ${filters.provider.join(", ")}`)
      }

      if (filters.mode && filters.mode.length > 0) {
        newColumnFilters.mode = filters.mode
        newColumnFilters._modeIncludeMode = true
        appliedFilters.push(`Mode: ${filters.mode.join(", ")}`)
      }

      if (filters.vision === true) {
        newColumnFilters.vision = ["true"]
        appliedFilters.push("Vision: Yes")
      }
      if (filters.audio === true) {
        newColumnFilters.audio = ["true"]
        appliedFilters.push("Audio: Yes")
      }
      if (filters.functionCalling === true) {
        newColumnFilters.functionCalling = ["true"]
        appliedFilters.push("Functions: Yes")
      }
      if (filters.reasoning === true) {
        newColumnFilters.reasoning = ["true"]
        appliedFilters.push("Reasoning: Yes")
      }
      if (filters.webSearch === true) {
        newColumnFilters.webSearch = ["true"]
        appliedFilters.push("Web Search: Yes")
      }
      if (filters.promptCaching === true) {
        newColumnFilters.promptCaching = ["true"]
        appliedFilters.push("Caching: Yes")
      }

      if (filters.maxInputCost) {
        setMaxInputCostFilter(filters.maxInputCost)
        appliedFilters.push(`Max Cost: $${filters.maxInputCost}/M`)
      } else {
        setMaxInputCostFilter(null)
      }

      if (filters.minContext) {
        setMinContextFilter(filters.minContext)
        appliedFilters.push(`Min Context: ${formatTokens(filters.minContext)}`)
      } else {
        setMinContextFilter(null)
      }

      setColumnFilters(newColumnFilters)

      if (showColumns && showColumns.length > 0) {
        setColumns((prev) =>
          prev.map((col) => {
            if (col.required) return { ...col, visible: true }
            if (showColumns.includes(col.key)) return { ...col, visible: true }
            return col
          }),
        )
      }

      setAiFilterSummary({
        summary: summary || "Filters applied",
        appliedFilters,
      })
    } catch (err) {
      console.error("AI search error:", err)
      const q = query.toLowerCase()
      const newColumnFilters: Record<string, string[]> & { _providerIncludeMode?: boolean } = {}
      const appliedFilters: string[] = []

      if (q.includes("google") || q.includes("gemini")) {
        newColumnFilters.provider = ["google"]
        newColumnFilters._providerIncludeMode = true
        appliedFilters.push("Provider: Google")
      } else if (q.includes("openai") || q.includes("gpt")) {
        newColumnFilters.provider = ["openai"]
        newColumnFilters._providerIncludeMode = true
        appliedFilters.push("Provider: OpenAI")
      } else if (q.includes("anthropic") || q.includes("claude")) {
        newColumnFilters.provider = ["anthropic"]
        newColumnFilters._providerIncludeMode = true
        appliedFilters.push("Provider: Anthropic")
      }

      if (q.includes("vision")) {
        newColumnFilters.vision = ["true"]
        appliedFilters.push("Vision: Yes")
      }
      if (q.includes("cheap") || q.includes("budget")) {
        setMaxInputCostFilter(1)
        appliedFilters.push("Max Cost: $1/M")
      }

      setColumnFilters(newColumnFilters)
      setAiFilterSummary({
        summary: "Filters applied (fallback)",
        appliedFilters,
      })
    } finally {
      setIsSearching(false)
    }
  }

  const clearAllFilters = () => {
    setColumnFilters({})
    setAiFilterSummary(null)
    setMaxInputCostFilter(null)
    setMinContextFilter(null)
  }

  const hasActiveFilters = useMemo(() => {
    const hasColumnFilters = Object.values(columnFilters).some((arr) => arr.length > 0)
    return hasColumnFilters || aiFilterSummary !== null || maxInputCostFilter !== null || minContextFilter !== null
  }, [columnFilters, aiFilterSummary, maxInputCostFilter, minContextFilter])

  const clearAIFilters = () => {
    setAiFilterSummary(null)
    setMaxInputCostFilter(null)
    setMinContextFilter(null)
    setColumnFilters({})
  }

  const uniqueProviders = [...new Set(models.map((m) => m.litellm_provider))]

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (isLoading && models.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading models...</p>
        </div>
      </div>
    )
  }

  if (error && models.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Error: {error}</p>
          <button
            onClick={forceRefresh}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        lastUpdated={lastUpdated}
        onRefresh={forceRefresh}
        isRefreshing={isLoading}
      />
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SearchBar
          onSearch={handleAISearch}
          viewMode={viewMode}
          setViewMode={setViewMode}
          columns={columns}
          setColumns={setColumns}
          isLoading={isSearching}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearAllFilters}
        />
        {aiFilterSummary && (
          <AIFeedbackBar
            summary={aiFilterSummary.summary}
            appliedFilters={aiFilterSummary.appliedFilters}
            onClear={clearAIFilters}
          />
        )}
        {viewMode === "calculator" && (
          <CostCalculator
            inputTokens={inputTokens}
            outputTokens={outputTokens}
            setInputTokens={setInputTokens}
            setOutputTokens={setOutputTokens}
          />
        )}
        <ModelTable
          models={filteredAndSortedModels}
          viewMode={viewMode}
          sortConfigs={sortConfigs}
          onSort={handleSort}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          inputTokens={inputTokens}
          outputTokens={outputTokens}
          columnFilters={columnFilters}
          onColumnFilterChange={handleColumnFilterChange}
          uniqueProviders={uniqueProviders}
          visibleColumns={columns}
        />
        {selectedModel && <ModelDetailPanel model={selectedModel} onClose={() => setSelectedModel(null)} />}
      </main>
    </div>
  )
}
