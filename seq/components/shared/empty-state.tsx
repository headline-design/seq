"use client"

import type * as React from "react"
import { cn } from "@/seq/lib/utils"
import { Button } from "@/seq/components/ui/button"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--hover-overlay)] mb-4">
          <span className="text-neutral-500">{icon}</span>
        </div>
      )}
      <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-neutral-400 max-w-sm">{description}</p>}
      {action && (
        <Button onClick={action.onClick} className="mt-6 bg-accent-gradient hover:opacity-90 text-accent-text-white border-0">
          {action.label}
        </Button>
      )}
    </div>
  )
}

export default EmptyState
