"use client"

import type * as React from "react"
import { createContext, useContext, useEffect, useState } from "react"

export const ACCENT_COLORS = {
  neutral: {
    id: "neutral",
    name: "Neutral",
    primary: "#ffffff",
    hover: "#e5e5e5",
    muted: "rgba(255, 255, 255, 0.1)",
    secondary: "#a1a1aa",
    gradient: "#ffffff",
    ring: "rgba(255, 255, 255, 0.25)",
    text: "#ffffff",
    textMuted: "#a1a1aa",
    textWhite: "#000",
    border: "rgba(255, 255, 255, 0.15)",
    bgSubtle: "rgba(255, 255, 255, 0.05)",
    bgEmphasis: "rgba(255, 255, 255, 0.1)",
    shadow: "rgba(0, 0, 0, 0.25)",
    tailwind: "neutral",
  },
  pink: {
    id: "pink",
    name: "Rose",
    primary: "#ec4899",
    hover: "#f472b6",
    muted: "rgba(236, 72, 153, 0.15)",
    secondary: "#f43f5e",
    gradient: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
    ring: "rgba(236, 72, 153, 0.5)",
    text: "#f472b6",
    textWhite: "#fff",
    textMuted: "#ec4899",
    border: "rgba(236, 72, 153, 0.3)",
    bgSubtle: "rgba(236, 72, 153, 0.1)",
    bgEmphasis: "rgba(236, 72, 153, 0.2)",
    shadow: "rgba(236, 72, 153, 0.25)",
    tailwind: "pink",
  },
  indigo: {
    id: "indigo",
    name: "Indigo",
    primary: "#6366f1",
    hover: "#818cf8",
    muted: "rgba(99, 102, 241, 0.15)",
    secondary: "#4f46e5",
    gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    ring: "rgba(99, 102, 241, 0.5)",
    text: "#818cf8",
    textWhite: "#fff",
    textMuted: "#6366f1",
    border: "rgba(99, 102, 241, 0.3)",
    bgSubtle: "rgba(99, 102, 241, 0.1)",
    bgEmphasis: "rgba(99, 102, 241, 0.2)",
    shadow: "rgba(99, 102, 241, 0.25)",
    tailwind: "indigo",
  },
  violet: {
    id: "violet",
    name: "Violet",
    primary: "#8b5cf6",
    hover: "#a78bfa",
    muted: "rgba(139, 92, 246, 0.15)",
    secondary: "#7c3aed",
    textWhite: "#fff",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    ring: "rgba(139, 92, 246, 0.5)",
    text: "#a78bfa",
    textMuted: "#8b5cf6",
    border: "rgba(139, 92, 246, 0.3)",
    bgSubtle: "rgba(139, 92, 246, 0.1)",
    bgEmphasis: "rgba(139, 92, 246, 0.2)",
    shadow: "rgba(139, 92, 246, 0.25)",
    tailwind: "violet",
  },
  cyan: {
    id: "cyan",
    name: "Cyan",
    primary: "#06b6d4",
    hover: "#22d3ee",
    muted: "rgba(6, 182, 212, 0.15)",
    secondary: "#0891b2",
    gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
    ring: "rgba(6, 182, 212, 0.5)",
    textWhite: "#fff",
    text: "#22d3ee",
    textMuted: "#06b6d4",
    border: "rgba(6, 182, 212, 0.3)",
    bgSubtle: "rgba(6, 182, 212, 0.1)",
    bgEmphasis: "rgba(6, 182, 212, 0.2)",
    shadow: "rgba(6, 182, 212, 0.25)",
    tailwind: "cyan",
  },
  emerald: {
    id: "emerald",
    name: "Emerald",
    primary: "#10b981",
    hover: "#34d399",
    muted: "rgba(16, 185, 129, 0.15)",
    secondary: "#059669",
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    ring: "rgba(16, 185, 129, 0.5)",
    textWhite: "#fff",
    text: "#34d399",
    textMuted: "#10b981",
    border: "rgba(16, 185, 129, 0.3)",
    bgSubtle: "rgba(16, 185, 129, 0.1)",
    bgEmphasis: "rgba(16, 185, 129, 0.2)",
    shadow: "rgba(16, 185, 129, 0.25)",
    tailwind: "emerald",
  },
  orange: {
    id: "orange",
    name: "Orange",
    primary: "#f97316",
    hover: "#fb923c",
    muted: "rgba(249, 115, 22, 0.15)",
    secondary: "#ea580c",
    gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
    ring: "rgba(249, 115, 22, 0.5)",
    text: "#fb923c",
    textWhite: "#fff",
    textMuted: "#f97316",
    border: "rgba(249, 115, 22, 0.3)",
    bgSubtle: "rgba(249, 115, 22, 0.1)",
    bgEmphasis: "rgba(249, 115, 22, 0.2)",
    shadow: "rgba(249, 115, 22, 0.25)",
    tailwind: "orange",
  },
  blue: {
    id: "blue",
    name: "Blue",
    primary: "#3b82f6",
    hover: "#60a5fa",
    muted: "rgba(59, 130, 246, 0.15)",
    secondary: "#2563eb",
    textWhite: "#fff",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    ring: "rgba(59, 130, 246, 0.5)",
    text: "#60a5fa",
    textMuted: "#3b82f6",
    border: "rgba(59, 130, 246, 0.3)",
    bgSubtle: "rgba(59, 130, 246, 0.1)",
    bgEmphasis: "rgba(59, 130, 246, 0.2)",
    shadow: "rgba(59, 130, 246, 0.25)",
    tailwind: "blue",
  },
} as const

export type AccentColorId = keyof typeof ACCENT_COLORS
export type AccentColor = (typeof ACCENT_COLORS)[AccentColorId]

interface AccentColorContextValue {
  accentColor: AccentColorId
  setAccentColor: (color: AccentColorId) => void
  colors: AccentColor
}

const AccentColorContext = createContext<AccentColorContextValue | undefined>(undefined)

const STORAGE_KEY = "seq-accent-color"

function applyAccentColor(color: AccentColor) {
  const root = document.documentElement
  root.style.setProperty("--accent-primary", color.primary)
  root.style.setProperty("--accent-hover", color.hover)
  root.style.setProperty("--accent-muted", color.muted)
  root.style.setProperty("--accent-secondary", color.secondary)
  root.style.setProperty("--accent-gradient", color.gradient)
  root.style.setProperty("--accent-ring", color.ring)
  root.style.setProperty("--accent-text-white", color.textWhite)
  root.style.setProperty("--accent-text", color.text)
  root.style.setProperty("--accent-text-muted", color.textMuted)
  root.style.setProperty("--accent-border", color.border)
  root.style.setProperty("--accent-bg-subtle", color.bgSubtle)
  root.style.setProperty("--accent-bg-emphasis", color.bgEmphasis)
  root.style.setProperty("--accent-shadow", color.shadow)
  // Also update ring and sidebar colors for consistency
  root.style.setProperty("--ring", color.primary)
  root.style.setProperty("--sidebar-primary", color.primary)
  root.style.setProperty("--sidebar-ring", color.primary)
  root.style.setProperty("--focus-ring", color.ring)
}

export function AccentColorProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentColorState] = useState<AccentColorId>("neutral")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(STORAGE_KEY) as AccentColorId | null
    if (stored && ACCENT_COLORS[stored]) {
      setAccentColorState(stored)
      applyAccentColor(ACCENT_COLORS[stored])
    } else {
      applyAccentColor(ACCENT_COLORS.neutral)
    }
  }, [])

  const setAccentColor = (color: AccentColorId) => {
    setAccentColorState(color)
    localStorage.setItem(STORAGE_KEY, color)
    applyAccentColor(ACCENT_COLORS[color])
  }

  // Apply colors on mount and when color changes
  useEffect(() => {
    if (mounted) {
      applyAccentColor(ACCENT_COLORS[accentColor])
    }
  }, [accentColor, mounted])

  return (
    <AccentColorContext.Provider
      value={{
        accentColor,
        setAccentColor,
        colors: ACCENT_COLORS[accentColor],
      }}
    >
      {children}
    </AccentColorContext.Provider>
  )
}

export function useAccentColor() {
  const context = useContext(AccentColorContext)
  if (!context) {
    throw new Error("useAccentColor must be used within AccentColorProvider")
  }
  return context
}

// Helper hook to get the current accent's Tailwind class prefix
export function useAccentClasses() {
  const { colors } = useAccentColor()
  return {
    text: `text-${colors.tailwind}-400`,
    textHover: `text-${colors.tailwind}-300`,
    bg: `bg-${colors.tailwind}-500`,
    bgMuted: `bg-${colors.tailwind}-500/15`,
    bgHover: `bg-${colors.tailwind}-600`,
    border: `border-${colors.tailwind}-500`,
    borderMuted: `border-${colors.tailwind}-500/30`,
    ring: `ring-${colors.tailwind}-500`,
    shadow: `shadow-${colors.tailwind}-500/25`,
  }
}
