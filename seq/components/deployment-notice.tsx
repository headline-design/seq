"use client"

import { useState, useEffect } from "react"
import { X, Github, Key } from "lucide-react"

export function DeploymentNotice() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Check if we're on the demo domain
    const hostname = window.location.hostname
    const isDemoSite = hostname === "seq-studio.vercel.app" || hostname.includes("seq-studio")

    // Check if user has dismissed before (session only)
    const dismissed = sessionStorage.getItem("deployment-notice-dismissed")

    if (isDemoSite && !dismissed) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    sessionStorage.setItem("deployment-notice-dismissed", "true")
    setTimeout(() => setIsVisible(false), 300)
  }

  if (!isVisible) return null

  return (
    <div
      className={`fixed bottom-4 right-4 z-[9999] max-w-sm transition-all duration-300 ${
        isDismissed ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
      }`}
    >
      <div className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[var(--tertiary-muted)] border-b border-[var(--tertiary)]/30 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--tertiary)] animate-pulse" />
            <span className="text-[var(--tertiary)] text-sm font-medium">Demo Instance</span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1 -mr-1"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            This is a demo deployment. To use Seq with full functionality, deploy your own instance and add your API
            keys.
          </p>

          <div className="space-y-2">
            <a
              href="https://github.com/your-repo/seq"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Github className="w-4 h-4" />
              <span>Clone from GitHub</span>
            </a>
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <Key className="w-4 h-4" />
              <span>Required: FAL_KEY, GOOGLE_GENERATIVE_AI_API_KEY</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[var(--surface-2)] border-t border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">One-click deploy:</span>
            <a
              href="https://vercel.com/new/clone?repository-url=https://github.com/your-repo/seq"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--tertiary)] hover:bg-[var(--tertiary-hover)] text-white text-xs font-medium rounded transition-all"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 76 65" fill="currentColor">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
              </svg>
              Deploy to Vercel
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
