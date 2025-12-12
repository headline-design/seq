"use client"

import { useEffect, useState } from "react"

export interface AccessibilityPreferences {
  reducedMotion: boolean
  highContrast: boolean
}

export function useAccessibility(): AccessibilityPreferences {
  const [prefs, setPrefs] = useState<AccessibilityPreferences>({
    reducedMotion: false,
    highContrast: false,
  })

  useEffect(() => {
    // Check for reduced motion preference
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const highContrastQuery = window.matchMedia("(prefers-contrast: high)")

    const updatePrefs = () => {
      setPrefs({
        reducedMotion: reducedMotionQuery.matches,
        highContrast: highContrastQuery.matches,
      })
    }

    // Initial check
    updatePrefs()

    // Listen for changes
    reducedMotionQuery.addEventListener("change", updatePrefs)
    highContrastQuery.addEventListener("change", updatePrefs)

    return () => {
      reducedMotionQuery.removeEventListener("change", updatePrefs)
      highContrastQuery.removeEventListener("change", updatePrefs)
    }
  }, [])

  return prefs
}
