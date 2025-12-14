import type { VideoConfig } from "@/seq/components/storyboard/types"

export interface AutomatorSession {
  step: "prompt" | "transition" | "process" | "selection" | "result"
  masterData?: {
    url: string
    prompt: string
    panelCount: number
  }
  processedPanels?: string[]
  finalPanels?: string[]
  linkedPanelData?: Record<number, string>
  transitionPanels?: string[]
  prompts?: Record<number, string>
  durations?: Record<number, number>
  videoUrls?: Record<number, string>
  masterDescription?: string
  videoConfig?: VideoConfig
  timestamp: number
}

const SESSION_KEY = "nano-banana-automator-session"

export function saveSession(session: Partial<AutomatorSession>) {
  if (typeof window === "undefined") return

  try {
    const existing = loadSession()
    const updated: AutomatorSession = {
      ...existing,
      ...session,
      step: session.step ?? existing?.step ?? "prompt", // Ensure 'step' is always defined
      timestamp: Date.now(),
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error("Failed to save session:", error)
  }
}

export function loadSession(): AutomatorSession | null {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) return null

    const session: AutomatorSession = JSON.parse(stored)

    // Expire sessions older than 24 hours
    const age = Date.now() - session.timestamp
    if (age > 24 * 60 * 60 * 1000) {
      clearSession()
      return null
    }

    return session
  } catch (error) {
    console.error("Failed to load session:", error)
    return null
  }
}

export function clearSession() {
  if (typeof window === "undefined") return
  localStorage.removeItem(SESSION_KEY)
}
