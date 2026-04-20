"use client"

import type React from "react"
import { useState } from "react"
import type { ColumnConfig } from "./column-visibility"
import { ColumnVisibility } from "./column-visibility"

interface SearchBarProps {
  onSearch: (query: string) => void
  columns: ColumnConfig[]
  setColumns: (columns: ColumnConfig[]) => void
  isLoading: boolean
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function SearchBar({
  onSearch,
  columns,
  setColumns,
  isLoading,
  hasActiveFilters,
  onClearFilters,
}: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState("")

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && localQuery.trim()) {
      onSearch(localQuery)
    }
  }

  const handleGenerate = () => {
    if (localQuery.trim()) {
      onSearch(localQuery)
    }
  }

  return (
    <div className="bg-card border-b border-border p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shrink-0 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] z-20">
      <div className="relative w-full md:w-3/5 group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
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
            disabled={isLoading}
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
            onClick={onClearFilters}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Filters
          </button>
        )}
        <ColumnVisibility columns={columns} onColumnChange={setColumns} />
      </div>
    </div>
  )
}
