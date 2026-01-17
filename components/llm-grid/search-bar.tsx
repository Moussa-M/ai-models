"use client"

import type React from "react"
import { useState } from "react"
import type { ViewMode } from "../llm-intelligence-grid"
import type { ColumnConfig } from "./column-visibility"
import { ColumnVisibility } from "./column-visibility"

interface SearchBarProps {
  setSearchQuery: (q: string) => void
  onAISearch: () => void
  isSearching: boolean
  viewMode: ViewMode
  setViewMode: (v: ViewMode) => void
  columns: ColumnConfig[]
  onColumnChange: (columns: ColumnConfig[]) => void
  onClearAllFilters: () => void
  hasActiveFilters: boolean
}

export function SearchBar({
  setSearchQuery,
  onAISearch,
  isSearching,
  viewMode,
  setViewMode,
  columns,
  onColumnChange,
  onClearAllFilters,
  hasActiveFilters,
}: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState("")

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && localQuery.trim()) {
      setSearchQuery(localQuery)
      onAISearch()
    }
  }

  const handleGenerate = () => {
    if (localQuery.trim()) {
      setSearchQuery(localQuery)
      onAISearch()
    }
  }

  return (
    <div className="bg-card border-b border-border p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shrink-0 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] z-20">
      <div className="relative w-full md:w-3/5 group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isSearching ? (
            <svg className="w-5 h-5 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="block w-full pl-10 pr-24 py-3 border border-border rounded-xl leading-5 bg-secondary text-foreground placeholder-muted-foreground focus:outline-none focus:bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          placeholder="Describe what you need... e.g. 'I need a cheap vision model from google'"
        />
        <div className="absolute inset-y-0 right-1 flex items-center gap-1">
          <button
            onClick={handleGenerate}
            disabled={isSearching}
            className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm h-8 mr-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        {hasActiveFilters && (
          <button
            onClick={onClearAllFilters}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Filters
          </button>
        )}
        <ColumnVisibility columns={columns} onColumnChange={onColumnChange} />
        <div className="flex items-center bg-secondary rounded-lg p-1 w-full md:w-auto">
          <button
            onClick={() => setViewMode("specs")}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === "specs" ? "shadow-sm bg-card text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Specs
          </button>
          <button
            onClick={() => setViewMode("calculator")}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
              viewMode === "calculator"
                ? "shadow-sm bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            Cost Proj.
          </button>
        </div>
      </div>
    </div>
  )
}
