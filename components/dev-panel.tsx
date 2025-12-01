"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Bug, ChevronDown, ChevronUp } from "lucide-react"
import { loadSession } from "@/lib/session-storage"

interface DevPanelProps {
  currentStep?: string
  masterData?: { url: string; prompt: string; panelCount: number } | null
  processedPanels?: string[]
  transitionPanels?: string[]
  linkedPanelData?: Record<number, string>
  finalPanels?: string[]
  storageMode?: "persistent" | "temporal"
}

export function DevPanel({
  currentStep,
  masterData,
  linkedPanelData,
  processedPanels = [],
  transitionPanels = [],
  finalPanels = [],
  storageMode,
}: DevPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [sections, setSections] = useState({
    workflow: true,
    storage: true,
    images: false,
    localStorage: false,
  })

  // Keyboard shortcut: Ctrl+Shift+D to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const toggleSection = (section: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const getLocalStorageSize = () => {
    if (typeof window === "undefined") return "0 KB"
    let total = 0
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length
      }
    }
    return `${(total / 1024).toFixed(2)} KB`
  }

  const session = loadSession()

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-all"
        title="Dev Panel (Ctrl+Shift+D)"
      >
        <Bug className="w-5 h-5" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[500px] max-h-[80vh] bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-3 bg-purple-600 text-white border-b border-purple-700">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4" />
          <span className="font-semibold text-sm">Development Panel</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-purple-700" onClick={() => setIsOpen(false)}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="overflow-y-auto flex-1 text-xs">
        {/* Workflow State */}
        <div className="border-b border-zinc-800">
          <button
            onClick={() => toggleSection("workflow")}
            className="w-full flex items-center justify-between p-3 hover:bg-zinc-800 transition-colors"
          >
            <span className="font-semibold text-white">Workflow State</span>
            {sections.workflow ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {sections.workflow && (
            <div className="p-3 space-y-2 bg-zinc-950">
              <div className="flex justify-between">
                <span className="text-zinc-400">Current Step:</span>
                <span className="text-emerald-400 font-mono">{currentStep || "unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Master Generated:</span>
                <span className={masterData ? "text-emerald-400" : "text-red-400"}>
                  {masterData ? "✓ Yes" : "✗ No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Panel Count:</span>
                <span className="text-white font-mono">{masterData?.panelCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Processed Panels:</span>
                <span className="text-white font-mono">{processedPanels.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Final Panels:</span>
                <span className="text-white font-mono">{finalPanels.length}</span>
              </div>
            </div>
          )}
        </div>

        {/* Storage Info */}
        <div className="border-b border-zinc-800">
          <button
            onClick={() => toggleSection("storage")}
            className="w-full flex items-center justify-between p-3 hover:bg-zinc-800 transition-colors"
          >
            <span className="font-semibold text-white">Storage</span>
            {sections.storage ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {sections.storage && (
            <div className="p-3 space-y-2 bg-zinc-950">
              <div className="flex justify-between">
                <span className="text-zinc-400">Mode:</span>
                <span className={`font-mono ${storageMode === "persistent" ? "text-emerald-400" : "text-amber-400"}`}>
                  {storageMode || "temporal"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Session Saved:</span>
                <span className={session ? "text-emerald-400" : "text-red-400"}>{session ? "✓ Yes" : "✗ No"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">LocalStorage Size:</span>
                <span className="text-white font-mono">{getLocalStorageSize()}</span>
              </div>
              {session && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Session Age:</span>
                  <span className="text-white font-mono">
                    {Math.floor((Date.now() - session.timestamp) / 1000 / 60)}m ago
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Image URLs */}
        <div className="border-b border-zinc-800">
          <button
            onClick={() => toggleSection("images")}
            className="w-full flex items-center justify-between p-3 hover:bg-zinc-800 transition-colors"
          >
            <span className="font-semibold text-white">Image URLs</span>
            {sections.images ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {sections.images && (
            <div className="p-3 space-y-3 bg-zinc-950 max-h-64 overflow-y-auto">
              {masterData?.url && (
                <div>
                  <div className="text-zinc-400 mb-1">Master:</div>
                  <div className="p-2 bg-zinc-900 rounded font-mono text-[10px] break-all text-zinc-300">
                    {masterData.url.startsWith("data:") ? (
                      <span className="text-amber-400">⚠️ Data URI ({masterData.url.length} chars)</span>
                    ) : (
                      <a
                        href={masterData.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {masterData.url.substring(0, 80)}...
                      </a>
                    )}
                  </div>
                </div>
              )}
              {processedPanels.length > 0 && (
                <div>
                  <div className="text-zinc-400 mb-1">Processed Panels ({processedPanels.length}):</div>
                  {processedPanels.slice(0, 3).map((url, i) => (
                    <div key={i} className="p-2 bg-zinc-900 rounded font-mono text-[10px] break-all text-zinc-300 mb-1">
                      {url.startsWith("data:") ? (
                        <span className="text-amber-400">
                          ⚠️ Panel {i + 1}: Data URI ({url.length} chars)
                        </span>
                      ) : (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          Panel {i + 1}: {url.substring(0, 60)}...
                        </a>
                      )}
                    </div>
                  ))}
                  {processedPanels.length > 3 && (
                    <div className="text-zinc-500 text-center">...and {processedPanels.length - 3} more</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* LocalStorage Contents */}
        <div>
          <button
            onClick={() => toggleSection("localStorage")}
            className="w-full flex items-center justify-between p-3 hover:bg-zinc-800 transition-colors"
          >
            <span className="font-semibold text-white">LocalStorage Keys</span>
            {sections.localStorage ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {sections.localStorage && (
            <div className="p-3 space-y-1 bg-zinc-950 max-h-48 overflow-y-auto">
              {typeof window !== "undefined" &&
                Object.keys(localStorage).map((key) => (
                  <div key={key} className="flex justify-between p-2 bg-zinc-900 rounded">
                    <span className="text-zinc-300 font-mono text-[10px] truncate">{key}</span>
                    <span className="text-zinc-500 font-mono text-[10px]">
                      {(localStorage[key].length / 1024).toFixed(2)} KB
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-2 bg-zinc-950 border-t border-zinc-800 text-center text-[10px] text-zinc-600">
        Press <kbd className="px-1 py-0.5 bg-zinc-800 rounded">Ctrl+Shift+D</kbd> to toggle
      </div>
    </div>
  )
}
