"use client"

import { useState, useRef, useEffect } from "react"
import { Columns3, Check } from "lucide-react"

export interface ColumnConfig {
  key: string
  label: string
  visible: boolean
  required?: boolean
}

interface ColumnVisibilityProps {
  columns: ColumnConfig[]
  onColumnChange: (columns: ColumnConfig[]) => void
}

export function ColumnVisibility({ columns, onColumnChange }: ColumnVisibilityProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleColumn = (key: string) => {
    const updated = columns.map((col) => (col.key === key && !col.required ? { ...col, visible: !col.visible } : col))
    onColumnChange(updated)
  }

  const showAll = () => {
    const updated = columns.map((col) => ({ ...col, visible: true }))
    onColumnChange(updated)
  }

  const hideOptional = () => {
    const updated = columns.map((col) => ({ ...col, visible: col.required ? true : false }))
    onColumnChange(updated)
  }

  const visibleCount = columns.filter((c) => c.visible).length

  const coreColumns = columns.filter((c) =>
    ["model", "provider", "context", "maxOutput", "inputCost", "outputCost", "mode"].includes(c.key),
  )
  const capabilityColumns = columns.filter((c) =>
    ["vision", "audio", "functionCalling", "reasoning", "webSearch", "promptCaching"].includes(c.key),
  )

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors border border-border"
      >
        <Columns3 className="w-4 h-4" />
        <span className="hidden sm:inline">Columns</span>
        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
          {visibleCount}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-xl z-50 animate-fade-in">
          <div className="p-2 border-b border-border flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Toggle Columns</p>
            <div className="flex gap-1">
              <button
                onClick={showAll}
                className="text-[10px] px-2 py-1 rounded bg-accent hover:bg-accent/80 text-foreground"
              >
                All
              </button>
              <button
                onClick={hideOptional}
                className="text-[10px] px-2 py-1 rounded bg-accent hover:bg-accent/80 text-foreground"
              >
                Min
              </button>
            </div>
          </div>
          <div className="p-1 max-h-80 overflow-auto custom-scroll">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Core</p>
            {coreColumns.map((col) => (
              <button
                key={col.key}
                onClick={() => toggleColumn(col.key)}
                disabled={col.required}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                  col.required ? "opacity-50 cursor-not-allowed" : "hover:bg-accent cursor-pointer"
                } ${col.visible ? "text-foreground" : "text-muted-foreground"}`}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                    col.visible ? "bg-primary border-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  {col.visible && <Check className="w-3 h-3" />}
                </div>
                <span>{col.label}</span>
                {col.required && <span className="text-[10px] text-muted-foreground ml-auto">Required</span>}
              </button>
            ))}
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 mt-2 border-t border-border">
              Capabilities
            </p>
            {capabilityColumns.map((col) => (
              <button
                key={col.key}
                onClick={() => toggleColumn(col.key)}
                disabled={col.required}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                  col.required ? "opacity-50 cursor-not-allowed" : "hover:bg-accent cursor-pointer"
                } ${col.visible ? "text-foreground" : "text-muted-foreground"}`}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                    col.visible ? "bg-primary border-primary text-primary-foreground" : "border-border"
                  }`}
                >
                  {col.visible && <Check className="w-3 h-3" />}
                </div>
                <span>{col.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
