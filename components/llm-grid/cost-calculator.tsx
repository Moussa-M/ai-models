"use client"

interface CostCalculatorProps {
  inputTokens: number
  setInputTokens: (n: number) => void
  outputTokens: number
  setOutputTokens: (n: number) => void
}

export function CostCalculator({ inputTokens, setInputTokens, outputTokens, setOutputTokens }: CostCalculatorProps) {
  return (
    <div className="bg-secondary border-b border-border p-4 shrink-0 animate-fade-in">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
            Input Volume
          </label>
          <div className="relative">
            <input
              type="number"
              value={inputTokens}
              onChange={(e) => setInputTokens(Number(e.target.value))}
              className="w-full pl-3 pr-12 py-2 rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary outline-none font-mono text-sm"
            />
            <span className="absolute right-3 top-2 text-xs text-muted-foreground font-medium">Tok</span>
          </div>
        </div>
        <div className="flex items-center text-muted-foreground/50">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">
            Output Volume
          </label>
          <div className="relative">
            <input
              type="number"
              value={outputTokens}
              onChange={(e) => setOutputTokens(Number(e.target.value))}
              className="w-full pl-3 pr-12 py-2 rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary outline-none font-mono text-sm"
            />
            <span className="absolute right-3 top-2 text-xs text-muted-foreground font-medium">Tok</span>
          </div>
        </div>
      </div>
    </div>
  )
}
