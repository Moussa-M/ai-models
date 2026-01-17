"use client"

import type { Model } from "@/lib/models-data"
import type { ViewMode, SortKey, SortConfig } from "../llm-intelligence-grid"
import type { ColumnConfig } from "./column-visibility"
import { ProviderLogo } from "./provider-logo"
import { ColumnFilter } from "./column-filter"
import { Check, X, ChevronUp, ChevronDown } from "lucide-react"

interface ModelTableProps {
  models: Model[]
  viewMode: ViewMode
  inputTokens: number
  outputTokens: number
  onSort: (key: SortKey, addToExisting: boolean) => void
  sortConfigs: SortConfig[]
  selectedModel?: Model | null
  onSelectModel: (m: Model) => void
  columnFilters: Record<string, string[]>
  onColumnFilterChange: (column: string, values: string[]) => void
  visibleColumns: ColumnConfig[]
  uniqueProviders: string[]
}

export function ModelTable({
  models,
  viewMode,
  inputTokens,
  outputTokens,
  onSort,
  sortConfigs,
  selectedModel,
  onSelectModel,
  columnFilters,
  onColumnFilterChange,
  visibleColumns,
  uniqueProviders,
}: ModelTableProps) {
  const safeModels = models || []
  const safeSortConfigs = sortConfigs || []
  const safeVisibleColumns = visibleColumns || []

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

  const calculateProjectedCost = (model: Model) => {
    const inCost = (model.input_cost_per_token || 0) * inputTokens
    const outCost = (model.output_cost_per_token || 0) * outputTokens
    return inCost + outCost
  }

  const getProviderClass = (provider: string) => {
    const p = provider.toLowerCase()
    if (p.includes("openai")) return "bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30"
    if (p.includes("anthropic"))
      return "bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-500/30"
    if (p.includes("google") || p.includes("vertex") || p.includes("gemini"))
      return "bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30"
    if (p.includes("mistral")) return "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30"
    if (p.includes("cohere")) return "bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30"
    if (p.includes("together"))
      return "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30"
    if (p.includes("bedrock") || p.includes("amazon"))
      return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-500/30"
    if (p.includes("deepseek")) return "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30"
    if (p.includes("dashscope") || p.includes("qwen"))
      return "bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30"
    if (p.includes("yi")) return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
    if (p.includes("xai") || p.includes("grok"))
      return "bg-zinc-500/20 text-zinc-700 dark:text-zinc-300 border border-zinc-500/30"
    return "bg-secondary text-secondary-foreground"
  }

  const getSortInfo = (key: SortKey) => {
    if (safeSortConfigs.length === 0) return null
    const index = safeSortConfigs.findIndex((s) => s.key === key)
    if (index === -1) return null
    return { index: index + 1, direction: safeSortConfigs[index].direction }
  }

  const SortIcon = ({ sortKey }: { sortKey: SortKey }) => {
    const sortInfo = getSortInfo(sortKey)

    if (!sortInfo) {
      return (
        <svg
          className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      )
    }

    return (
      <span className="flex items-center gap-0.5">
        {sortInfo.direction === "asc" ? (
          <ChevronUp className="w-4 h-4 text-primary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-primary" />
        )}
        {safeSortConfigs.length > 1 && (
          <span className="text-[10px] font-bold text-primary bg-primary/20 rounded-full w-4 h-4 flex items-center justify-center">
            {sortInfo.index}
          </span>
        )}
      </span>
    )
  }

  const uniqueContextSizes = [...new Set(safeModels.map((m) => formatTokens(m.max_input_tokens)))].sort()
  const uniqueMaxOutputSizes = [...new Set(safeModels.map((m) => formatTokens(m.max_output_tokens)))].sort()
  const uniqueInputCosts = [...new Set(safeModels.map((m) => formatCost(m.input_cost_per_token)))].sort()
  const uniqueOutputCosts = [...new Set(safeModels.map((m) => formatCost(m.output_cost_per_token)))].sort()
  const uniqueModes = [...new Set(safeModels.map((m) => m.mode || "-"))].sort()

  const FilterIcon = ({ active }: { active?: boolean }) => (
    <svg
      className={`w-3 h-3 ${active ? "text-primary" : "text-muted-foreground/50"} group-hover:text-muted-foreground`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
    </svg>
  )

  const isColumnVisible = (key: string) => {
    const col = safeVisibleColumns.find((c) => c.key === key)
    return col ? col.visible : false
  }

  const BooleanCell = ({ value }: { value?: boolean }) => (
    <td className="px-4 py-3 text-center">
      {value ? (
        <Check className="w-4 h-4 text-emerald-500 mx-auto" />
      ) : (
        <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />
      )}
    </td>
  )

  const FilterableHeader = ({
    column,
    label,
    values,
    sortKeyProp,
    filterType = "list",
    center = false,
  }: {
    column: string
    label: string
    values: string[]
    sortKeyProp?: SortKey
    filterType?: "list" | "boolean"
    center?: boolean
  }) => (
    <th className="p-0 min-w-[70px]">
      <div
        className={`px-4 py-3 flex items-center ${center ? "justify-center" : "justify-between"} group sticky top-0 bg-secondary/95 backdrop-blur-sm border-b border-border`}
      >
        <ColumnFilter
          column={column}
          values={values}
          selectedValues={columnFilters[column] || []}
          onFilterChange={onColumnFilterChange}
          filterType={filterType}
        >
          <span className="hover:bg-accent cursor-pointer flex items-center gap-1 relative pr-4 px-1 py-0.5 rounded">
            {label}
            <FilterIcon active={(columnFilters[column] || []).length > 0} />
          </span>
        </ColumnFilter>
        {sortKeyProp && (
          <span
            onClick={(e) => onSort(sortKeyProp, e.shiftKey)}
            className="cursor-pointer"
            title="Click to sort, Shift+Click to add secondary sort"
          >
            <SortIcon sortKey={sortKeyProp} />
          </span>
        )}
      </div>
    </th>
  )

  return (
    <div className="flex-1 overflow-auto bg-card relative z-10 custom-scroll select-none">
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead>
          <tr className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            <th className="p-0 min-w-[300px]">
              <div className="px-6 py-3 flex items-center justify-between group sticky top-0 bg-secondary/95 backdrop-blur-sm border-b border-border">
                <span
                  onClick={(e) => onSort("id", e.shiftKey)}
                  className="hover:bg-accent cursor-pointer flex items-center gap-1 px-1 py-0.5 rounded"
                  title="Click to sort, Shift+Click to add secondary sort"
                >
                  Model <SortIcon sortKey="id" />
                </span>
              </div>
            </th>
            {isColumnVisible("provider") && (
              <FilterableHeader
                column="provider"
                label="Provider"
                values={uniqueProviders || []}
                sortKeyProp="litellm_provider"
              />
            )}
            {isColumnVisible("context") && (
              <FilterableHeader
                column="context"
                label="Context"
                values={uniqueContextSizes}
                sortKeyProp="max_input_tokens"
              />
            )}
            {isColumnVisible("maxOutput") && (
              <FilterableHeader
                column="maxOutput"
                label="Max Out"
                values={uniqueMaxOutputSizes}
                sortKeyProp="max_output_tokens"
              />
            )}
            {viewMode === "specs" && (
              <>
                {isColumnVisible("inputCost") && (
                  <FilterableHeader
                    column="inputCost"
                    label="In $/1M"
                    values={uniqueInputCosts}
                    sortKeyProp="input_cost_per_token"
                  />
                )}
                {isColumnVisible("outputCost") && (
                  <FilterableHeader
                    column="outputCost"
                    label="Out $/1M"
                    values={uniqueOutputCosts}
                    sortKeyProp="output_cost_per_token"
                  />
                )}
              </>
            )}
            {viewMode === "calculator" && (
              <th onClick={(e) => onSort("projected_cost", e.shiftKey)} className="p-0 min-w-[150px]">
                <div className="px-4 py-3 hover:bg-primary/20 cursor-pointer flex items-center justify-between group sticky top-0 bg-primary/10 backdrop-blur-sm border-b border-primary/20 text-primary">
                  Est. Cost <SortIcon sortKey="projected_cost" />
                </div>
              </th>
            )}
            {isColumnVisible("vision") && (
              <FilterableHeader column="vision" label="Vision" values={["true", "false"]} filterType="boolean" center />
            )}
            {isColumnVisible("audio") && (
              <FilterableHeader column="audio" label="Audio" values={["true", "false"]} filterType="boolean" center />
            )}
            {isColumnVisible("functionCalling") && (
              <FilterableHeader
                column="functionCalling"
                label="Funcs"
                values={["true", "false"]}
                filterType="boolean"
                center
              />
            )}
            {isColumnVisible("reasoning") && (
              <FilterableHeader
                column="reasoning"
                label="Reason"
                values={["true", "false"]}
                filterType="boolean"
                center
              />
            )}
            {isColumnVisible("webSearch") && (
              <FilterableHeader column="webSearch" label="Web" values={["true", "false"]} filterType="boolean" center />
            )}
            {isColumnVisible("promptCaching") && (
              <FilterableHeader
                column="promptCaching"
                label="Cache"
                values={["true", "false"]}
                filterType="boolean"
                center
              />
            )}
            {isColumnVisible("mode") && <FilterableHeader column="mode" label="Mode" values={uniqueModes} />}
          </tr>
        </thead>
        <tbody className="text-sm text-foreground divide-y divide-border">
          {safeModels.map((model) => (
            <tr
              key={model.id}
              onClick={() => onSelectModel(model)}
              className={`group hover:bg-accent/50 transition-colors cursor-pointer h-[50px] ${
                selectedModel?.id === model.id ? "bg-primary/10 border-l-[3px] border-l-primary" : ""
              }`}
            >
              <td className="px-6 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className="font-medium text-foreground truncate max-w-[280px] font-mono text-xs"
                    title={model.id}
                  >
                    {model.id}
                  </div>
                </div>
              </td>
              {isColumnVisible("provider") && (
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getProviderClass(model.litellm_provider)}`}
                  >
                    <ProviderLogo provider={model.litellm_provider} className="w-3.5 h-3.5" />
                    {model.litellm_provider.split("/")[0].split("-")[0]}
                  </span>
                </td>
              )}
              {isColumnVisible("context") && (
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {formatTokens(model.max_input_tokens)}
                </td>
              )}
              {isColumnVisible("maxOutput") && (
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {formatTokens(model.max_output_tokens)}
                </td>
              )}
              {viewMode === "specs" && (
                <>
                  {isColumnVisible("inputCost") && (
                    <td className="px-4 py-3 font-mono text-xs">{formatCost(model.input_cost_per_token)}</td>
                  )}
                  {isColumnVisible("outputCost") && (
                    <td className="px-4 py-3 font-mono text-xs">{formatCost(model.output_cost_per_token)}</td>
                  )}
                </>
              )}
              {viewMode === "calculator" && (
                <td className="px-4 py-3 font-mono text-xs font-bold text-primary bg-primary/5">
                  ${calculateProjectedCost(model).toFixed(2)}
                </td>
              )}
              {isColumnVisible("vision") && <BooleanCell value={model.supports_vision} />}
              {isColumnVisible("audio") && (
                <BooleanCell value={model.supports_audio_input || model.supports_audio_output} />
              )}
              {isColumnVisible("functionCalling") && <BooleanCell value={model.supports_function_calling} />}
              {isColumnVisible("reasoning") && <BooleanCell value={model.supports_reasoning} />}
              {isColumnVisible("webSearch") && <BooleanCell value={model.supports_web_search} />}
              {isColumnVisible("promptCaching") && <BooleanCell value={model.supports_prompt_caching} />}
              {isColumnVisible("mode") && (
                <td className="px-4 py-3 text-xs text-muted-foreground capitalize">{model.mode || "-"}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
