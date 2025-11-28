"use client"

import type React from "react"
import { Trash2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect, useCallback } from "react"
import type { TimelineClip, SnapResult } from "./types"

interface TimelineClipProps {
  clip: TimelineClip
  zoom: number
  isSelected: boolean
  onUpdate: (updates: Partial<TimelineClip>) => void
  onSelect: () => void
  onRemove?: () => void
  onDragStart?: () => void
  onDragEnd?: () => void
  onSnapIndicator?: (time: number | null) => void
  allClips: TimelineClip[]
  snapThreshold: number
  magneticMode: boolean
}

const CLIP_COLORS = [
  "from-indigo-600 to-indigo-800",
  "from-purple-600 to-purple-800",
  "from-blue-600 to-blue-800",
  "from-cyan-600 to-cyan-800",
  "from-teal-600 to-teal-800",
  "from-emerald-600 to-emerald-800",
  "from-amber-600 to-amber-800",
]

export function TimelineClipComponent({
  clip,
  zoom,
  isSelected,
  onUpdate,
  onSelect,
  onRemove,
  onDragStart,
  onDragEnd,
  onSnapIndicator,
  allClips,
  snapThreshold,
  magneticMode,
}: TimelineClipProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizingStart, setIsResizingStart] = useState(false)
  const [isResizingEnd, setIsResizingEnd] = useState(false)
  const [snapResult, setSnapResult] = useState<SnapResult | null>(null)
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const clipRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const effectiveDuration = clip.duration - clip.trimStart - clip.trimEnd
  const width = Math.max(effectiveDuration * zoom, 40) // Minimum width of 40px
  const clipIndex = Number.parseInt(clip.id.split("-")[1]) || 0
  const colorClass = clip.color || CLIP_COLORS[clipIndex % CLIP_COLORS.length]

  // Generate thumbnail from video
  useEffect(() => {
    if (!clip.videoUrl || thumbnailLoaded) return

    const video = document.createElement("video")
    video.crossOrigin = "anonymous"
    video.preload = "metadata"
    video.muted = true

    video.onloadeddata = () => {
      video.currentTime = clip.trimStart + 0.5 // Get frame slightly after trim start
    }

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = 160
        canvas.height = 90
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          setThumbnailUrl(canvas.toDataURL("image/jpeg", 0.7))
          setThumbnailLoaded(true)
        }
      } catch (e) {
        // CORS or other error - use placeholder
      }
    }

    video.onerror = () => {
      setThumbnailLoaded(true) // Mark as loaded to prevent retries
    }

    video.src = clip.videoUrl
  }, [clip.videoUrl, clip.trimStart, thumbnailLoaded])

  const getSnapPoints = useCallback((): { time: number; type: "start" | "end"; clipId: string }[] => {
    const points: { time: number; type: "start" | "end"; clipId: string }[] = []
    points.push({ time: 0, type: "start", clipId: "timeline" })

    allClips
      .filter((c) => c.id !== clip.id)
      .forEach((c) => {
        const clipEnd = c.startTime + (c.duration - c.trimStart - c.trimEnd)
        points.push({ time: c.startTime, type: "start", clipId: c.id })
        points.push({ time: clipEnd, type: "end", clipId: c.id })
      })
    return points
  }, [allClips, clip.id])

  const findSnapPoint = useCallback(
    (targetTime: number, isClipEnd = false): SnapResult => {
      if (!magneticMode) {
        return { time: targetTime, snapped: false, snapType: "none" }
      }

      const snapPoints = getSnapPoints()
      const targetPixel = targetTime * zoom

      for (const point of snapPoints) {
        const pointPixel = point.time * zoom
        if (Math.abs(targetPixel - pointPixel) < snapThreshold) {
          return {
            time: point.time,
            snapped: true,
            snapType: isClipEnd ? "clip-end" : "clip-start",
            snapTargetId: point.clipId,
          }
        }
      }

      // Also check if our end would snap to another clip's start
      if (!isClipEnd) {
        const ourEnd = targetTime + effectiveDuration
        const ourEndPixel = ourEnd * zoom

        for (const point of snapPoints) {
          if (point.type === "start") {
            const pointPixel = point.time * zoom
            if (Math.abs(ourEndPixel - pointPixel) < snapThreshold) {
              return {
                time: point.time - effectiveDuration,
                snapped: true,
                snapType: "clip-end",
                snapTargetId: point.clipId,
              }
            }
          }
        }
      }

      return { time: targetTime, snapped: false, snapType: "none" }
    },
    [magneticMode, getSnapPoints, zoom, snapThreshold, effectiveDuration],
  )

  const handleMouseDown = (e: React.MouseEvent, type: "move" | "trim-start" | "trim-end") => {
    e.preventDefault()
    e.stopPropagation()
    onSelect()
    onDragStart?.()

    const startX = e.clientX
    const startTrimStart = clip.trimStart
    const startTrimEnd = clip.trimEnd
    const startPosition = clip.startTime

    if (type === "trim-start") setIsResizingStart(true)
    if (type === "trim-end") setIsResizingEnd(true)
    if (type === "move") setIsDragging(true)

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const deltaTime = deltaX / zoom

      if (type === "trim-start") {
        const maxTrim = clip.duration - startTrimEnd - 0.5 // Minimum 0.5s duration
        const newTrimStart = Math.max(0, Math.min(startTrimStart + deltaTime, maxTrim))
        const trimDelta = newTrimStart - startTrimStart
        onUpdate({
          trimStart: newTrimStart,
          startTime: startPosition + trimDelta,
        })
      } else if (type === "trim-end") {
        const maxTrim = clip.duration - startTrimStart - 0.5 // Minimum 0.5s duration
        const newTrimEnd = Math.max(0, Math.min(startTrimEnd - deltaTime, maxTrim))
        onUpdate({ trimEnd: newTrimEnd })
      } else if (type === "move") {
        const rawNewTime = Math.max(0, startPosition + deltaTime)
        const result = findSnapPoint(rawNewTime)
        setSnapResult(result.snapped ? result : null)
        onSnapIndicator?.(result.snapped ? result.time : null)
        onUpdate({ startTime: result.time })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizingStart(false)
      setIsResizingEnd(false)
      setSnapResult(null)
      onSnapIndicator?.(null)
      onDragEnd?.()
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  return (
    <>
      {/* Snap indicator line */}
      {snapResult?.snapped && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-50 pointer-events-none animate-pulse"
          style={{
            left: `${
              (snapResult.snapType === "clip-end" ? clip.startTime + effectiveDuration : clip.startTime) * zoom
            }px`,
          }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50" />
        </div>
      )}

      <div
        ref={clipRef}
        className={`
          absolute h-[72px] rounded-lg overflow-hidden group transition-all duration-75
          bg-gradient-to-br ${colorClass}
          border-2 
          ${isSelected ? "border-white ring-2 ring-white/30 shadow-xl" : "border-white/20 hover:border-white/40"}
          ${isDragging ? "opacity-90 scale-[1.02] shadow-2xl cursor-grabbing z-30" : "cursor-grab"}
          ${isResizingStart || isResizingEnd ? "z-30" : ""}
        `}
        style={{
          left: `${clip.startTime * zoom}px`,
          width: `${width}px`,
          top: `${clip.track * 84 + 4}px`,
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        {/* Thumbnail background */}
        {thumbnailUrl && (
          <div
            className="absolute inset-0 opacity-30 bg-cover bg-center"
            style={{ backgroundImage: `url(${thumbnailUrl})` }}
          />
        )}

        {/* Trim handle - Start */}
        <div
          className={`
            absolute left-0 top-0 w-2.5 h-full cursor-ew-resize z-20
            bg-gradient-to-r from-yellow-400 to-yellow-500
            hover:from-yellow-300 hover:to-yellow-400
            transition-all flex items-center justify-center
            ${isResizingStart ? "w-3 from-yellow-300 to-yellow-400" : ""}
          `}
          onMouseDown={(e) => handleMouseDown(e, "trim-start")}
        >
          <div className="w-0.5 h-6 bg-yellow-900/30 rounded-full" />
        </div>

        {/* Main content area */}
        <div
          className="absolute inset-0 pl-4 pr-4 flex items-center cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => handleMouseDown(e, "move")}
        >
          <GripVertical className="h-4 w-4 text-white/40 mr-2 flex-shrink-0" />

          <div className="flex-1 min-w-0 select-none">
            <p className="text-xs font-semibold text-white truncate drop-shadow-sm">
              {clip.name || `Clip ${clipIndex + 1}`}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-white/70 font-mono tabular-nums">{effectiveDuration.toFixed(2)}s</span>
              {(clip.trimStart > 0 || clip.trimEnd > 0) && (
                <span className="text-[9px] text-yellow-300/80 bg-yellow-900/30 px-1 rounded">trimmed</span>
              )}
            </div>
          </div>

          {/* Delete button - only show if onRemove provided */}
          {onRemove && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
            >
              <Trash2 className="h-3 w-3 text-red-400" />
            </Button>
          )}
        </div>

        {/* Trim handle - End */}
        <div
          className={`
            absolute right-0 top-0 w-2.5 h-full cursor-ew-resize z-20
            bg-gradient-to-l from-yellow-400 to-yellow-500
            hover:from-yellow-300 hover:to-yellow-400
            transition-all flex items-center justify-center
            ${isResizingEnd ? "w-3 from-yellow-300 to-yellow-400" : ""}
          `}
          onMouseDown={(e) => handleMouseDown(e, "trim-end")}
        >
          <div className="w-0.5 h-6 bg-yellow-900/30 rounded-full" />
        </div>

        {/* Waveform visualization (decorative) */}
        <div className="absolute inset-x-3 bottom-1 h-3 opacity-20 pointer-events-none flex items-end gap-px">
          {Array.from({ length: Math.max(Math.floor(width / 4), 8) }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-white rounded-t-sm"
              style={{ height: `${20 + Math.sin(i * 0.5) * 40 + Math.random() * 40}%` }}
            />
          ))}
        </div>
      </div>
    </>
  )
}

export { TimelineClipComponent as TimelineClip }
