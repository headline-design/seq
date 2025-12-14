"use client"

import { AlertTriangle } from "lucide-react"

export function ApiKeyWarning() {
  return (
    <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
      <div>
        <h3 className="text-sm font-medium text-amber-500 mb-1">API Key Not Configured</h3>
        <p className="text-xs text-amber-500/80">
          To generate images, please add your FAL_KEY environment variable in the Vars section of the sidebar.
        </p>
      </div>
    </div>
  )
}
