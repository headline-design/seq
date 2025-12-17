"use client"
import { Check } from "lucide-react"
import { cn } from "@/seq/lib/utils"
import { ACCENT_COLORS, useAccentColor, type AccentColorId } from "./accent-color-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/seq/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/seq/components/ui/tooltip"

interface ThemeColorSelectorProps {
  variant?: "icon" | "button" | "inline"
  className?: string
}

function getSwatchStyle(color: (typeof ACCENT_COLORS)[keyof typeof ACCENT_COLORS]) {
  if (color.id === "neutral") {
    // Use a subtle gray gradient for neutral since white-to-gray is hard to see
    return { background: "linear-gradient(135deg, #71717a 0%, #3f3f46 100%)" }
  }
  return { background: color.gradient }
}

export function ThemeColorSelector({ variant = "icon", className }: ThemeColorSelectorProps) {
  const { accentColor, setAccentColor, colors } = useAccentColor()

  if (variant === "inline") {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {Object.entries(ACCENT_COLORS).map(([id, color]) => (
          <button
            key={id}
            onClick={() => setAccentColor(id as AccentColorId)}
            className={cn(
              "relative w-8 h-8 rounded-full transition-all duration-200",
              "hover:scale-110 hover:ring-2 hover:ring-offset-2 hover:ring-offset-[var(--surface-0)]",
              accentColor === id && "ring-2 ring-offset-2 ring-offset-[var(--surface-0)]",
            )}
            style={{
              ...getSwatchStyle(color),
              //@ts-ignore
              ringColor: color.primary,
            }}
            title={color.name}
          >
            {accentColor === id && <Check className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow-md" />}
          </button>
        ))}
      </div>
    )
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center justify-center transition-all",
                variant === "icon"
                  ? "h-8 w-8 rounded-lg hover:bg-[var(--hover-overlay)]"
                  : "h-9 px-3 gap-2 rounded-lg border border-[var(--border-default)] hover:bg-[var(--hover-overlay)]",
                className,
              )}
            >
              <div className="w-4 h-4 rounded-full" style={getSwatchStyle(colors)} />
              {variant === "button" && <span className="text-sm text-neutral-300">{colors.name}</span>}
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          <p className="text-sm">Theme Color</p>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-48 bg-[var(--surface-1)] border-[var(--border-default)]">
        <DropdownMenuLabel className="text-xs text-neutral-400 font-normal">Accent Color</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[var(--border-default)]" />
        {Object.entries(ACCENT_COLORS).map(([id, color]) => (
          <DropdownMenuItem
            key={id}
            onClick={() => setAccentColor(id as AccentColorId)}
            className={cn("flex items-center gap-3 cursor-pointer", accentColor === id && "bg-[var(--hover-overlay)]")}
          >
            <div className="w-5 h-5 rounded-full shrink-0" style={getSwatchStyle(color)} />
            <span className="flex-1 text-sm text-neutral-200">{color.name}</span>
            {accentColor === id && (
              <Check className="w-4 h-4" style={{ color: color.id === "neutral" ? "#ffffff" : color.primary }} />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
