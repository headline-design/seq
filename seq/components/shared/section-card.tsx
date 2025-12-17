"use client"

import type * as React from "react"
import { useState } from "react"
import { cn } from "@/seq/lib/utils"
import { ChevronDown } from "lucide-react"

interface SectionCardProps {
  title: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  defaultOpen?: boolean
  collapsible?: boolean
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

export function SectionCard({
  title,
  icon,
  actions,
  defaultOpen = true,
  collapsible = true,
  children,
  className,
  contentClassName,
}: SectionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={cn("rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)]", className)}>
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3",
          collapsible && "cursor-pointer hover:bg-[var(--hover-overlay)] transition-colors",
          isOpen && "border-b border-[var(--border-default)]",
        )}
        onClick={() => collapsible && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {collapsible && (
            <ChevronDown className={cn("h-4 w-4 text-neutral-500 transition-transform", !isOpen && "-rotate-90")} />
          )}
          {icon && <span className="text-neutral-400">{icon}</span>}
          <span className="text-sm font-medium text-accent-text-white">{title}</span>
        </div>
        {actions && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>

      {/* Content */}
      {isOpen && <div className={cn("p-4", contentClassName)}>{children}</div>}
    </div>
  )
}

export default SectionCard
