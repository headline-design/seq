"use client"

import { AlertTriangle } from "lucide-react"

export function ApiKeyWarning() {
  return (
    <div className="mb-6 p-4 bg-[var(--accent-muted)] border border-[var(--accent-border)] rounded-lg flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-[var(--accent-primary)] shrink-0 mt-0.5" />
      <div>
        <h3 className="text-sm font-medium text-[var(--accent-primary)] mb-1">API Key Not Configured</h3>
        <p className="text-xs text-[var(--accent-text)]">
          To generate images, please add your AI_GATEWAY_API_KEY environment variable in the Vars section of the
          sidebar.
        </p>
      </div>
    </div>
  )
}
