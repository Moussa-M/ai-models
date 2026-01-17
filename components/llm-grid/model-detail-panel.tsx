"use client"

import type { Model } from "@/lib/models-data"

interface ModelDetailPanelProps {
  model: Model
  onClose: () => void
}

export function ModelDetailPanel({ model, onClose }: ModelDetailPanelProps) {
  const formatCost = (cost?: number) => {
    if (!cost) return "-"
    const perMillion = cost * 1000000
    return `$${perMillion.toFixed(2)}`
  }

  const formatTokens = (n?: number) => {
    if (!n) return "N/A"
    return n.toLocaleString()
  }

  return (
    <div className="w-[400px] bg-card border-l border-border overflow-y-auto animate-fade-in shrink-0">
      <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
        <h2 className="font-bold text-foreground truncate pr-4">{model.id}</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 space-y-6">
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Provider</h3>
          <p className="text-sm font-medium text-foreground">{model.litellm_provider}</p>
        </div>

        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Capabilities</h3>
          <div className="flex flex-wrap gap-2">
            {model.supports_vision && (
              <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                Vision
              </span>
            )}
            {model.supports_audio_input && (
              <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-600 dark:text-red-400">
                Audio Input
              </span>
            )}
            {model.supports_audio_output && (
              <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-600 dark:text-red-400">
                Audio Output
              </span>
            )}
            {model.supports_function_calling && (
              <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-600 dark:text-blue-400">
                Function Calling
              </span>
            )}
            {model.supports_parallel_function_calling && (
              <span className="px-2 py-1 rounded-full text-xs font-bold bg-violet-500/20 text-violet-600 dark:text-violet-400">
                Parallel Functions
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Max Input</h3>
            <p className="font-mono text-sm text-foreground">{formatTokens(model.max_input_tokens)}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Max Output</h3>
            <p className="font-mono text-sm text-foreground">{formatTokens(model.max_output_tokens)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Input Cost</h3>
            <p className="font-mono text-sm text-foreground">{formatCost(model.input_cost_per_token)}/1M</p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Output Cost</h3>
            <p className="font-mono text-sm text-foreground">{formatCost(model.output_cost_per_token)}/1M</p>
          </div>
        </div>

        {model.mode && (
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Mode</h3>
            <p className="text-sm text-foreground capitalize">{model.mode}</p>
          </div>
        )}
      </div>
    </div>
  )
}
