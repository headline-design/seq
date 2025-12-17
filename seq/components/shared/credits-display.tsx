"use client"

import { cn } from "@/seq/lib/utils"
import { Sparkles } from "lucide-react"

interface CreditsDisplayProps {
  credits: number | "unlimited"
  variant?: "compact" | "full"
  className?: string
}

export function CreditsDisplay({ credits, variant = "compact", className }: CreditsDisplayProps) {
  const displayValue = credits === "unlimited" ? "∞" : credits.toLocaleString()

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-1.5 text-sm", className)}>
        <Sparkles className="h-4 w-4 text-pink-400" />
        <span className="font-medium text-white">{displayValue}</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--border-default)]",
        className,
      )}
    >
      <Sparkles className="h-4 w-4 text-pink-400" />
      <span className="text-sm font-medium text-white">{displayValue}</span>
      <span className="text-xs text-neutral-500">Credits</span>
    </div>
  )
}

export default CreditsDisplay
