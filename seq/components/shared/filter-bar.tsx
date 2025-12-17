"use client"

import type * as React from "react"
import { useState } from "react"
import { cn } from "@/seq/lib/utils"
import { Search, Filter, ChevronDown, X } from "lucide-react"
import { Button } from "@/seq/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/seq/components/ui/dropdown-menu"

interface FilterOption {
  label: string
  value: string
}

interface FilterBarProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filters?: {
    label: string
    options: FilterOption[]
    value?: string
    onChange?: (value: string) => void
  }[]
  sortOptions?: FilterOption[]
  sortValue?: string
  onSortChange?: (value: string) => void
  activeFilterCount?: number
  viewOptions?: React.ReactNode
  className?: string
}

export function FilterBar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  sortOptions = [],
  sortValue,
  onSortChange,
  activeFilterCount = 0,
  viewOptions,
  className,
}: FilterBarProps) {
  const [localSearch, setLocalSearch] = useState(searchValue)

  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
    onSearchChange?.(value)
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full h-9 pl-9 pr-3 bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg text-sm text-accent-text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-primary)]/50 transition-colors"
        />
        {localSearch && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-[var(--hover-overlay)] rounded transition-colors"
          >
            <X className="h-3 w-3 text-neutral-500" />
          </button>
        )}
      </div>

      {/* Filters */}
      {filters.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 bg-[var(--surface-2)] border-[var(--border-default)] hover:bg-[var(--hover-overlay)] hover:border-[var(--border-emphasis)]"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent-primary)] px-1.5 text-[10px] font-medium text-accent-text-white">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className="h-3 w-3 text-neutral-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-[var(--surface-2)] border-[var(--border-default)]">
            {filters.map((filter, index) => (
              <div key={index} className="px-2 py-1.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                  {filter.label}
                </span>
                <div className="mt-1 flex flex-col gap-0.5">
                  {filter.options.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => filter.onChange?.(option.value)}
                      className={cn(
                        "text-sm cursor-pointer",
                        filter.value === option.value && "text-[var(--accent-text)] bg-[var(--accent-bg-subtle)]",
                      )}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </div>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Sort */}
      {sortOptions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 bg-[var(--surface-2)] border-[var(--border-default)] hover:bg-[var(--hover-overlay)] hover:border-[var(--border-emphasis)]"
            >
              <span>{sortOptions.find((o) => o.value === sortValue)?.label || "Sort"}</span>
              <ChevronDown className="h-3 w-3 text-neutral-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 bg-[var(--surface-2)] border-[var(--border-default)]">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onSortChange?.(option.value)}
                className={cn(
                  "text-sm cursor-pointer",
                  sortValue === option.value && "text-[var(--accent-text)] bg-[var(--accent-bg-subtle)]",
                )}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* View options */}
      {viewOptions}
    </div>
  )
}

export default FilterBar
