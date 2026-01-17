"use client"

import Link from "next/link"
import { Moon, Sun, RefreshCw } from "lucide-react"

interface HeaderProps {
  isDarkMode: boolean
  toggleDarkMode: () => void
  lastUpdated?: number | null
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function Header({ isDarkMode, toggleDarkMode, lastUpdated, onRefresh, isRefreshing }: HeaderProps) {
  const formatLastUpdated = (timestamp: number | null | undefined) => {
    if (!timestamp) return null
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return "just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6 shrink-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-lg shadow-primary/30">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <h1 className="font-bold text-foreground text-lg tracking-tight">
          AI <span className="text-primary">Models</span>
        </h1>
      </div>
      <div className="flex items-center gap-4 text-sm">
        {lastUpdated && (
          <div className="hidden md:flex items-center gap-2 text-muted-foreground text-xs">
            <span>Updated {formatLastUpdated(lastUpdated)}</span>
          </div>
        )}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        )}
        <div className="h-4 w-[1px] bg-border" />
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <Link
          href="https://raw.githubusercontent.com/BerriAI/litellm/refs/heads/main/model_prices_and_context_window.json"
          target="_blank"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
          <span>Source</span>
        </Link>
      </div>
    </header>
  )
}
