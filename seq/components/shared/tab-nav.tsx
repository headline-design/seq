"use client"

import type * as React from "react"
import { cn } from "@/seq/lib/utils"

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  count?: number
}

interface TabNavProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
  variant?: "underline" | "pills"
  size?: "sm" | "md"
  className?: string
}

export function TabNav({ tabs, activeTab, onChange, variant = "underline", size = "md", className }: TabNavProps) {
  return (
    <nav
      className={cn(
        "flex items-center",
        variant === "underline" && "gap-6 border-b border-[var(--border-default)]",
        variant === "pills" && "gap-1 p-1 rounded-lg bg-[var(--surface-2)]",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-1.5 font-medium transition-all relative",
              size === "sm" && "text-xs",
              size === "md" && "text-sm",
              variant === "underline" && [
                "pb-3 border-b-2 -mb-px",
                isActive
                  ? "border-[var(--accent-primary)] text-accent-text-white"
                  : "border-transparent text-neutral-500 hover:text-accent-text-white",
              ],
              variant === "pills" && [
                "px-3 py-1.5 rounded-md",
                isActive
                  ? "bg-[var(--active-overlay)] text-accent-text-white"
                  : "text-neutral-500 hover:text-accent-text-white hover:bg-[var(--hover-overlay)]",
              ],
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={cn(
                  "ml-1 min-w-5 px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                  isActive
                    ? "bg-[var(--accent-muted)] text-[var(--accent-text)]"
                    : "bg-[var(--hover-overlay)] text-neutral-500",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}

export default TabNav
