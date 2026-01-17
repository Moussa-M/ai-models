"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"

interface ColumnFilterProps {
  column: string
  values: string[]
  selectedValues: string[]
  onFilterChange: (column: string, values: string[]) => void
  children: React.ReactNode
  filterType?: "list" | "boolean"
}

export function ColumnFilter({
  column,
  values,
  selectedValues,
  onFilterChange,
  children,
  filterType = "list",
}: ColumnFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredValues = values.filter((v) => v.toLowerCase().includes(search.toLowerCase()))

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onFilterChange(
        column,
        selectedValues.filter((v) => v !== value),
      )
    } else {
      onFilterChange(column, [...selectedValues, value])
    }
  }

  const selectAll = () => onFilterChange(column, [])
  const clearAll = () => onFilterChange(column, values)

  if (filterType === "boolean") {
    return (
      <div ref={ref} className="relative">
        <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
          {children}
          {selectedValues.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />}
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-40 bg-card rounded-lg shadow-xl border border-border z-50 animate-fade-in">
            <div className="p-2 flex flex-col gap-1">
              <button
                onClick={() => onFilterChange(column, [])}
                className={`text-xs px-2 py-1.5 rounded text-left hover:bg-accent ${selectedValues.length === 0 ? "bg-primary/20 text-primary" : ""}`}
              >
                Show All
              </button>
              <button
                onClick={() => onFilterChange(column, ["true"])}
                className={`text-xs px-2 py-1.5 rounded text-left hover:bg-accent ${selectedValues.includes("true") ? "bg-primary/20 text-primary" : ""}`}
              >
                Only Yes
              </button>
              <button
                onClick={() => onFilterChange(column, ["false"])}
                className={`text-xs px-2 py-1.5 rounded text-left hover:bg-accent ${selectedValues.includes("false") ? "bg-primary/20 text-primary" : ""}`}
              >
                Only No
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {children}
        {selectedValues.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-card rounded-lg shadow-xl border border-border z-50 animate-fade-in">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="p-2 border-b border-border flex gap-2">
            <button onClick={selectAll} className="text-xs text-primary hover:underline">
              Show All
            </button>
            <button onClick={clearAll} className="text-xs text-muted-foreground hover:underline">
              Clear
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto custom-scroll">
            {filteredValues.slice(0, 50).map((value) => (
              <label key={value} className="flex items-center gap-2 px-3 py-1.5 hover:bg-accent cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={selectedValues.length === 0 || !selectedValues.includes(value)}
                  onChange={() => toggleValue(value)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="truncate">{value}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
