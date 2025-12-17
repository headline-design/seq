"use client"

import type * as React from "react"
import { cn } from "@/seq/lib/utils"

interface ToggleOption {
  label: string
  value: string
  icon?: React.ReactNode
}

interface ToggleGroupProps {
  options: ToggleOption[]
  value: string
  onChange: (value: string) => void
  size?: "sm" | "md"
  className?: string
}

export function ToggleGroup({ options, value, onChange, size = "md", className }: ToggleGroupProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg bg-[var(--surface-2)] p-1 border border-[var(--border-default)]",
        className,
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-md font-medium transition-all",
              size === "sm" && "px-2.5 py-1 text-xs",
              size === "md" && "px-3 py-1.5 text-sm",
              isActive
                ? "bg-accent-gradient text-accent-text-white shadow-sm shadow-[var(--accent-shadow)]"
                : "text-neutral-400 hover:text-white",
            )}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default ToggleGroup
