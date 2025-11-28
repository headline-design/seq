"use client"

import { useState } from "react"
import { DEFAULT_ASPECT_RATIOS, ALL_ASPECT_RATIOS } from "../constants"
import type { AspectRatioOption } from "../types"

export function useAspectRatio() {
  const [aspectRatio, setAspectRatio] = useState("square")
  const [availableAspectRatios, setAvailableAspectRatios] = useState<AspectRatioOption[]>(DEFAULT_ASPECT_RATIOS)

  const detectAspectRatio = (width: number, height: number): string => {
    const ratio = width / height
    const defaultOptions = ["square", "portrait", "landscape", "wide"]

    let closestMatch = ALL_ASPECT_RATIOS[0]
    let smallestDiff = Math.abs(ratio - closestMatch.ratio)

    for (const option of ALL_ASPECT_RATIOS) {
      const diff = Math.abs(ratio - option.ratio)
      if (diff < smallestDiff) {
        smallestDiff = diff
        closestMatch = option
      }
    }

    if (!defaultOptions.includes(closestMatch.value)) {
      setAvailableAspectRatios((prev) => {
        const exists = prev.some((r) => r.value === closestMatch.value)
        if (!exists) {
          return [...prev, closestMatch].sort((a, b) => a.ratio - b.ratio)
        }
        return prev
      })
    }

    return closestMatch.value
  }

  return {
    aspectRatio,
    setAspectRatio,
    availableAspectRatios,
    detectAspectRatio,
  }
}
