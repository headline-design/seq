"use client"

import { memo } from "react"
import { LoadingSpinner } from "./loading-skeleton"

interface StatusBarProps {
  projectName?: string
  totalDuration: number
  clipCount: number
  trackCount: number
  isSaving?: boolean
  isExporting?: boolean
  isGenerating?: boolean
  isRendering?: boolean
  zoomLevel: number
  fps?: number
}

export const StatusBar = memo(function StatusBar({
  projectName = "Untitled Project",
  totalDuration,
  clipCount,
  trackCount,
  isSaving,
  isExporting,
  isGenerating,
  isRendering,
  zoomLevel,
  fps = 30,
}: StatusBarProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const frames = Math.floor((seconds % 1) * fps)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`
  }

  const getActiveOperation = () => {
    if (isExporting) return { label: "Exporting...", color: "text-indigo-400" }
    if (isRendering) return { label: "Rendering...", color: "text-purple-400" }
    if (isGenerating) return { label: "Generating...", color: "text-amber-400" }
    if (isSaving) return { label: "Saving...", color: "text-emerald-400" }
    return null
  }

  const activeOp = getActiveOperation()

  return (
    <div
      className="h-7 bg-[#0a0a0a] border-t border-neutral-800/50 px-4 flex items-center justify-between text-[11px] text-neutral-500 select-none"
      role="status"
      aria-live="polite"
    >
      {/* Left - Project info */}
      <div className="flex items-center gap-3">
        <span className="text-neutral-300 font-medium truncate max-w-[150px]" title={projectName}>
          {projectName}
        </span>
        <span className="text-neutral-700">|</span>
        <span className="font-mono">{formatDuration(totalDuration)}</span>
        <span className="text-neutral-700">|</span>
        <span>{clipCount} clips</span>
        <span className="text-neutral-700">|</span>
        <span>{trackCount} tracks</span>
      </div>

      {/* Center - Active operation */}
      <div className="flex items-center gap-2">
        {activeOp && (
          <>
            <LoadingSpinner size="sm" className={activeOp.color} />
            <span className={activeOp.color}>{activeOp.label}</span>
          </>
        )}
      </div>

      {/* Right - Zoom and FPS */}
      <div className="flex items-center gap-3 font-mono">
        <span>Zoom: {Math.round(zoomLevel * 10)}%</span>
        <span className="text-neutral-700">|</span>
        <span>{fps} fps</span>
      </div>
    </div>
  )
})

StatusBar.displayName = "StatusBar"
