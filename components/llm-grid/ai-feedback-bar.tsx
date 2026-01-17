"use client"

interface AIFeedbackBarProps {
  summary: string
  appliedFilters: string[]
  onClear: () => void
}

export function AIFeedbackBar({ summary, appliedFilters, onClear }: AIFeedbackBarProps) {
  const getTagClass = (filter: string) => {
    if (filter.startsWith("Provider")) return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
    if (
      filter.startsWith("Vision") ||
      filter.startsWith("Audio") ||
      filter.startsWith("Functions") ||
      filter.startsWith("Reasoning") ||
      filter.startsWith("Web") ||
      filter.startsWith("Caching")
    )
      return "bg-blue-500/20 text-blue-600 dark:text-blue-400"
    if (filter.startsWith("Max Cost")) return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
    if (filter.startsWith("Min Context")) return "bg-violet-500/20 text-violet-600 dark:text-violet-400"
    if (filter.startsWith("Mode")) return "bg-pink-500/20 text-pink-600 dark:text-pink-400"
    return "bg-muted text-muted-foreground"
  }

  return (
    <div className="bg-accent border-b border-border px-6 py-2 flex items-center gap-3 overflow-x-auto text-xs animate-fade-in">
      <div className="flex items-center gap-1 text-primary font-bold shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <span className="hidden sm:inline">{summary}</span>
        <span className="sm:hidden">Filtered</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {appliedFilters.map((filter, i) => (
          <span
            key={i}
            className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getTagClass(filter)}`}
          >
            {filter}
          </span>
        ))}
      </div>
      <button onClick={onClear} className="ml-auto text-muted-foreground hover:text-foreground shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
