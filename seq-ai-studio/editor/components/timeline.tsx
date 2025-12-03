"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback } from "react"
import type { TimelineClip, Track, MediaItem } from "../types"
import {
  MusicIcon,
  VolumeIcon,
  MagnetIcon,
  TrashIcon,
  CopyIcon,
  ScissorsIcon,
  MusicIcon as DetachIcon,
  MuteIcon,
  LockIcon,
  UnlockIcon,
  ChevronDownIcon,
  CheckIcon,
  SplitIcon,
  PlusIcon,
  LayoutIcon,
} from "./icons"

const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

interface TimelineProps {
  tracks: Track[]
  clips: TimelineClip[]
  mediaMap: Record<string, MediaItem>
  currentTime: number
  duration: number
  zoomLevel: number
  selectedClipIds: string[]
  className?: string
  style?: React.CSSProperties
  tool: "select" | "razor"
  isPlaying: boolean
  onSeek: (time: number) => void
  onSelectClips: (clipIds: string[]) => void
  onZoomChange: (zoom: number) => void
  onClipUpdate: (clipId: string, changes: Partial<TimelineClip>) => void
  onTrackUpdate: (trackId: string, changes: Partial<Track>) => void
  onSplitClip: (clipId: string, splitTime: number) => void
  onDetachAudio: (clipId: string) => void
  onDeleteClip: (clipIds: string[]) => void
  onRippleDeleteClip: (clipIds: string[]) => void
  onDuplicateClip: (clipIds: string[]) => void
  onToolChange: (tool: "select" | "razor") => void
  onDragStart: () => void
  onAddTrack?: (type: "video" | "audio") => void
  isRendering?: boolean
  renderProgress?: number
  renderedPreviewUrl?: string | null
  isPreviewStale?: boolean
  onRenderPreview?: () => void
  onCancelRender?: () => void
  isPreviewPlayback?: boolean
  onTogglePreviewPlayback?: () => void
}

type DragMode = "none" | "move" | "trim-start" | "trim-end"

const SNAP_THRESHOLD_PX = 15

const ClipWaveform: React.FC<{ duration: number; offset: number; isAudio: boolean; isSelected: boolean }> = ({
  duration,
  offset,
  isAudio,
  isSelected,
}) => {
  // Generate a deterministic pattern based on duration/offset to look like a waveform
  // We limit bars to avoid performance issues with many clips
  const bars = Math.min(100, Math.max(10, Math.floor(duration * 8)))

  return (
    <div className="w-full h-full flex items-end gap-[1px] overflow-hidden opacity-80 pointer-events-none">
      {Array.from({ length: bars }).map((_, i) => {
        // varied height based on sine waves to look like audio
        const x = i + offset * 8
        const noise = Math.sin(x * 0.8) * Math.cos(x * 1.3)
        const height = 20 + Math.abs(noise) * 70

        return (
          <div
            key={i}
            className={`flex-1 rounded-t-[1px] min-w-[2px] ${isSelected ? "bg-white/80" : isAudio ? "bg-emerald-400/60" : "bg-white/30"}`}
            style={{ height: `${height}%` }}
          />
        )
      })}
    </div>
  )
}

interface SnapConfig {
  enabled: boolean
  toGrid: boolean
  toClips: boolean
  toPlayhead: boolean
  gridInterval: number
}

export const Timeline: React.FC<TimelineProps> = ({
  tracks,
  clips,
  mediaMap,
  currentTime,
  duration,
  zoomLevel,
  selectedClipIds = [],
  className,
  style,
  tool,
  isPlaying,
  onSeek,
  onSelectClips,
  onZoomChange,
  onClipUpdate,
  onTrackUpdate,
  onSplitClip,
  onDetachAudio,
  onDeleteClip,
  onRippleDeleteClip,
  onDuplicateClip,
  onToolChange,
  onDragStart,
  onAddTrack,
  isRendering = false,
  renderProgress = 0,
  renderedPreviewUrl = null,
  isPreviewStale = false,
  onRenderPreview,
  onCancelRender,
  // Destructure new props
  isPreviewPlayback = false,
  onTogglePreviewPlayback,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const headerContainerRef = useRef<HTMLDivElement>(null)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [snapIndicator, setSnapIndicator] = useState<number | null>(null)
  const [lastClickedClipId, setLastClickedClipId] = useState<string | null>(null)

  // Marquee Selection State
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null)

  // Snapping Configuration
  const [snapConfig, setSnapConfig] = useState<SnapConfig>({
    enabled: true,
    toGrid: true,
    toClips: true,
    toPlayhead: true,
    gridInterval: 0.5,
  })
  const [showSnapMenu, setShowSnapMenu] = useState(false)

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; clipId: string } | null>(null)

  // Drag State
  const [dragState, setDragState] = useState<{
    mode: DragMode
    clipIds: string[]
    startX: number
    initialStates: Record<string, { start: number; duration: number; offset: number }>
    minStartDelta: number
    maxStartDelta: number
  }>({
    mode: "none",
    clipIds: [],
    startX: 0,
    initialStates: {},
    minStartDelta: Number.NEGATIVE_INFINITY,
    maxStartDelta: Number.POSITIVE_INFINITY,
  })

  // Keep refs up to date for event listeners to avoid re-binding
  const clipsRef = useRef(clips)
  clipsRef.current = clips
  const zoomLevelRef = useRef(zoomLevel)
  zoomLevelRef.current = zoomLevel
  const dragStateRef = useRef(dragState)
  dragStateRef.current = dragState
  const snapConfigRef = useRef(snapConfig)
  snapConfigRef.current = snapConfig
  const currentTimeRef = useRef(currentTime)
  currentTimeRef.current = currentTime
  const isSelectingRef = useRef(isSelecting)
  isSelectingRef.current = isSelecting
  const tracksRef = useRef(tracks)
  tracksRef.current = tracks
  const toolRef = useRef(tool)
  toolRef.current = tool

  // Handlers refs
  const onClipUpdateRef = useRef(onClipUpdate)
  onClipUpdateRef.current = onClipUpdate
  const onSelectClipsRef = useRef(onSelectClips)
  onSelectClipsRef.current = onSelectClips
  const onSeekRef = useRef(onSeek)
  onSeekRef.current = onSeek
  const onDragStartRef = useRef(onDragStart)
  onDragStartRef.current = onDragStart
  const onSplitClipRef = useRef(onSplitClip)
  onSplitClipRef.current = onSplitClip

  const formatTimecode = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    const f = Math.floor((seconds % 1) * 30)
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}:${f.toString().padStart(2, "0")}`
  }

  const handleSplitAtPlayhead = () => {
    if (selectedClipIds.length > 0) {
      selectedClipIds.forEach((id) => {
        const clip = clips.find((c) => c.id === id)
        // Only split if playhead is within clip boundaries
        if (clip && currentTime > clip.start && currentTime < clip.start + clip.duration) {
          onSplitClip(id, currentTime)
        }
      })
    }
  }

  const handleScroll = () => {
    if (headerContainerRef.current && scrollContainerRef.current) {
      headerContainerRef.current.scrollTop = scrollContainerRef.current.scrollTop
    }
  }

  // --- Snapping Logic ---
  const getSnapTime = (time: number, ignoreClipIds: string[]): number | null => {
    const config = snapConfigRef.current
    if (!config.enabled) return null

    const snapPoints: number[] = []

    // Snap to Grid
    if (config.toGrid) {
      const interval = config.gridInterval
      const nearestGrid = Math.round(time / interval) * interval
      snapPoints.push(nearestGrid)
    }

    // Snap to Playhead
    if (config.toPlayhead) {
      snapPoints.push(currentTimeRef.current)
    }

    // Snap to Other Clips (Edges)
    if (config.toClips) {
      clipsRef.current.forEach((c) => {
        if (ignoreClipIds.includes(c.id)) return
        snapPoints.push(c.start)
        snapPoints.push(c.start + c.duration)
      })
    }

    // Include 0 always
    snapPoints.push(0)

    // Find closest snap point
    let closest = -1
    let minDistance = Number.POSITIVE_INFINITY

    snapPoints.forEach((p) => {
      const dist = Math.abs(p - time)
      if (dist < minDistance) {
        minDistance = dist
        closest = p
      }
    })

    const thresholdSeconds = SNAP_THRESHOLD_PX / zoomLevelRef.current
    if (minDistance <= thresholdSeconds) {
      return closest
    }
    return null
  }

  // --- Mouse Handlers ---

  const handleMouseDownClip = (e: React.MouseEvent, clip: TimelineClip, mode: DragMode) => {
    e.stopPropagation()
    e.preventDefault()

    // Check if track is locked
    const track = tracks.find((t) => t.id === clip.trackId)
    if (track?.isLocked) return

    // Razor Tool Logic
    if (tool === "razor" && mode === "move") {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const timeOffset = clickX / zoomLevel
      const splitTime = clip.start + timeOffset
      onSplitClipRef.current(clip.id, splitTime)
      return
    }

    // Selection Logic
    const isMultiSelect = e.ctrlKey || e.metaKey
    const isRangeSelect = e.shiftKey
    const isAlreadySelected = selectedClipIds.includes(clip.id)

    if (isRangeSelect && lastClickedClipId) {
      // Range Selection
      const sortedClips = [...clips].sort((a, b) => a.start - b.start)
      const idxA = sortedClips.findIndex((c) => c.id === lastClickedClipId)
      const idxB = sortedClips.findIndex((c) => c.id === clip.id)
      if (idxA !== -1 && idxB !== -1) {
        const start = Math.min(idxA, idxB)
        const end = Math.max(idxA, idxB)
        const rangeIds = sortedClips.slice(start, end + 1).map((c) => c.id)
        const newSelection = Array.from(new Set([...selectedClipIds, ...rangeIds]))
        onSelectClips(newSelection)
      }
    } else if (isMultiSelect) {
      // Toggle Selection
      if (isAlreadySelected) {
        onSelectClips(selectedClipIds.filter((id) => id !== clip.id))
      } else {
        onSelectClips([...selectedClipIds, clip.id])
      }
    } else if (!isAlreadySelected) {
      // Single Selection (Replace)
      onSelectClips([clip.id])
    }

    setLastClickedClipId(clip.id)

    // Context Menu handled via onContextMenu
    if (e.button === 2) return

    // Save history snapshot before drag begins
    onDragStartRef.current()

    // DETERMINE ACTIVE DRAG GROUP
    const activeClipIds =
      isAlreadySelected || !isMultiSelect
        ? selectedClipIds.includes(clip.id)
          ? selectedClipIds
          : [clip.id]
        : [clip.id]

    // INITIAL STATES & GROUP PHYSICS
    const initialStates: Record<string, { start: number; duration: number; offset: number }> = {}
    let globalMinStartDelta = Number.NEGATIVE_INFINITY
    let globalMaxStartDelta = Number.POSITIVE_INFINITY

    activeClipIds.forEach((id) => {
      const c = clips.find((x) => x.id === id)
      if (c) {
        initialStates[id] = { start: c.start, duration: c.duration, offset: c.offset }

        const trackClips = clips.filter((x) => x.trackId === c.trackId && !activeClipIds.includes(x.id))

        const prevClip = trackClips
          .filter((x) => x.start + x.duration <= c.start)
          .sort((a, b) => b.start + b.duration - (a.start + a.duration))[0]
        const minStart = prevClip ? prevClip.start + prevClip.duration : 0
        const maxLeftDelta = minStart - c.start

        const nextClip = trackClips.filter((x) => x.start >= c.start + c.duration).sort((a, b) => a.start - b.start)[0]
        const maxEnd = nextClip ? nextClip.start : Number.POSITIVE_INFINITY
        const maxRightDelta = maxEnd - (c.start + c.duration)

        if (maxLeftDelta > globalMinStartDelta) globalMinStartDelta = maxLeftDelta
        if (maxRightDelta < globalMaxStartDelta) globalMaxStartDelta = maxRightDelta
      }
    })

    setDragState({
      mode,
      clipIds: activeClipIds,
      startX: e.clientX,
      initialStates,
      minStartDelta: globalMinStartDelta,
      maxStartDelta: globalMaxStartDelta,
    })
  }

  const handleMouseDownBackground = (e: React.MouseEvent) => {
    // Check if clicking on scrollbar
    if (scrollContainerRef.current) {
      const rect = scrollContainerRef.current.getBoundingClientRect()
      if (e.clientY > rect.bottom - 12) return // Scrollbar area
    }

    if ((e.target as HTMLElement).closest(".clip-item")) return

    if (tool === "razor") {
      onToolChange("select")
      return
    }

    const isRuler = (e.target as HTMLElement).closest(".ruler-area")

    if (isRuler) {
      setIsScrubbing(true)
      handleScrub(e.clientX)
      return
    }

    // Box Selection Start
    if (!isScrubbing) {
      const container = scrollContainerRef.current
      if (container) {
        const rect = container.getBoundingClientRect()
        const x = e.clientX - rect.left + container.scrollLeft
        const y = e.clientY - rect.top + container.scrollTop // Adjust for scrollY

        selectionStartRef.current = { x, y }
        setIsSelecting(true)
        setSelectionBox({ x, y, w: 0, h: 0 })

        if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
          onSelectClips([]) // Deselect all if plain click
        }
      }
    }
  }

  const handleContextMenuClip = (e: React.MouseEvent, clipId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      clipId,
    })
    if (!selectedClipIds.includes(clipId)) {
      onSelectClips([clipId])
    }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const ds = dragStateRef.current
    const zoom = zoomLevelRef.current
    const isSel = isSelectingRef.current

    // 1. Clip Dragging
    if (ds.mode !== "none" && ds.clipIds.length > 0) {
      const deltaX = e.clientX - ds.startX
      const deltaSeconds = deltaX / zoom
      let snappedTime: number | null = null

      if (ds.mode === "move") {
        let proposedDelta = deltaSeconds
        proposedDelta = Math.max(ds.minStartDelta, proposedDelta)
        proposedDelta = Math.min(ds.maxStartDelta, proposedDelta)

        const leadClipId = ds.clipIds[0]
        const leadState = ds.initialStates[leadClipId]

        if (snapConfigRef.current.enabled) {
          const leadNewStart = leadState.start + proposedDelta
          const snapLeft = getSnapTime(leadNewStart, ds.clipIds)
          if (snapLeft !== null) {
            const snapDelta = snapLeft - leadState.start
            if (snapDelta >= ds.minStartDelta && snapDelta <= ds.maxStartDelta) {
              proposedDelta = snapDelta
              snappedTime = snapLeft
            }
          } else {
            const leadNewEnd = leadNewStart + leadState.duration
            const snapRight = getSnapTime(leadNewEnd, ds.clipIds)
            if (snapRight !== null) {
              const snapDelta = snapRight - leadState.duration - leadState.start
              if (snapDelta >= ds.minStartDelta && snapDelta <= ds.maxStartDelta) {
                proposedDelta = snapDelta
                snappedTime = snapRight
              }
            }
          }
        }

        ds.clipIds.forEach((id) => {
          const state = ds.initialStates[id]
          onClipUpdateRef.current(id, { start: Math.max(0, state.start + proposedDelta) })
        })
      } else if (ds.mode === "trim-start") {
        const id = ds.clipIds[0]
        const state = ds.initialStates[id]
        const clip = clipsRef.current.find((c) => c.id === id)
        if (!clip) return

        const maxDelta = state.duration - 0.5
        let validDelta = Math.min(deltaSeconds, maxDelta)
        let newStart = state.start + validDelta
        const minAllowedStart = state.start + ds.minStartDelta

        if (newStart < minAllowedStart) {
          newStart = minAllowedStart
          validDelta = newStart - state.start
        }

        if (snapConfigRef.current.enabled) {
          const snap = getSnapTime(newStart, [id])
          if (snap !== null) {
            const snapDelta = snap - state.start
            if (snap >= minAllowedStart && state.duration - snapDelta >= 0.5) {
              newStart = snap
              validDelta = snapDelta
              snappedTime = snap
            }
          }
        }
        newStart = Math.max(0, newStart)
        const newDuration = state.duration - validDelta
        const newOffset = state.offset + validDelta
        onClipUpdateRef.current(id, { start: newStart, duration: newDuration, offset: newOffset })
      } else if (ds.mode === "trim-end") {
        const id = ds.clipIds[0]
        const state = ds.initialStates[id]
        let newDuration = state.duration + deltaSeconds
        const maxAllowedDuration = state.duration + ds.maxStartDelta

        if (newDuration > maxAllowedDuration) {
          newDuration = maxAllowedDuration
        }

        if (snapConfigRef.current.enabled) {
          const endPos = state.start + newDuration
          const snap = getSnapTime(endPos, [id])
          if (snap !== null) {
            if (snap <= state.start + maxAllowedDuration && snap - state.start >= 0.5) {
              newDuration = snap - state.start
              snappedTime = snap
            }
          }
        }
        if (newDuration >= 0.5) onClipUpdateRef.current(id, { duration: newDuration })
      }
      setSnapIndicator(snappedTime)
    }
    // 2. Marquee Selection
    else if (isSel && selectionStartRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const rect = container.getBoundingClientRect()

      const currentX = e.clientX - rect.left + container.scrollLeft
      const currentY = e.clientY - rect.top + container.scrollTop
      const startX = selectionStartRef.current.x
      const startY = selectionStartRef.current.y

      const x = Math.min(startX, currentX)
      const y = Math.min(startY, currentY)
      const w = Math.abs(currentX - startX)
      const h = Math.abs(currentY - startY)

      setSelectionBox({ x, y, w, h })

      // Calculate Intersection
      const intersectingIds: string[] = []

      let currentTrackY = 32 // Ruler height

      tracksRef.current.forEach((track) => {
        const trackHeight = track.type === "audio" ? 64 : 96
        const trackTop = currentTrackY
        const trackBottom = trackTop + trackHeight

        // Check vertical intersection
        if (y < trackBottom && y + h > trackTop) {
          // Check horizontal intersection for clips on this track
          const trackClips = clipsRef.current.filter((c) => c.trackId === track.id)
          trackClips.forEach((clip) => {
            const clipX = clip.start * zoom
            const clipW = clip.duration * zoom

            if (x < clipX + clipW && x + w > clipX) {
              intersectingIds.push(clip.id)
            }
          })
        }
        currentTrackY += trackHeight
      })

      if (intersectingIds.length > 0) {
        onSelectClipsRef.current(intersectingIds)
      }
    }
  }, [])

  const isScrubbingRef = useRef(isScrubbing)
  isScrubbingRef.current = isScrubbing

  const globalMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isScrubbingRef.current) {
        handleScrub(e.clientX)
      } else {
        handleMouseMove(e)
      }
    },
    [handleMouseMove],
  )

  const handleMouseUp = useCallback(() => {
    setDragState({
      mode: "none",
      clipIds: [],
      startX: 0,
      initialStates: {},
      minStartDelta: 0,
      maxStartDelta: 0,
    })
    setSnapIndicator(null)
    setIsScrubbing(false)
    setIsSelecting(false)
    setSelectionBox(null)
    selectionStartRef.current = null
  }, [])

  useEffect(() => {
    const handleGlobalClick = () => {
      setContextMenu(null)
      setShowSnapMenu(false)
    }
    window.addEventListener("click", handleGlobalClick)
    window.addEventListener("mousemove", globalMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("click", handleGlobalClick)
      window.removeEventListener("mousemove", globalMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [globalMouseMove, handleMouseUp])

  // Wheel Zoom & Pan
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        onZoomChange(zoomLevel * delta)
      } else if (e.shiftKey) {
        e.preventDefault()
        el.scrollLeft += e.deltaY
      }
      // Vertical scroll is handled natively now
    }

    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [zoomLevel, onZoomChange])

  const handleScrub = (clientX: number) => {
    if (scrollContainerRef.current) {
      const rect = scrollContainerRef.current.getBoundingClientRect()
      const scrollLeft = scrollContainerRef.current.scrollLeft
      const relativeX = clientX - rect.left + scrollLeft
      const time = Math.max(0, relativeX / zoomLevelRef.current)
      onSeekRef.current(time)
    }
  }

  return (
    <div
      className={`${className || ""} bg-[#09090b] border-t border-neutral-800 flex flex-col shrink-0 select-none relative z-10 transition-none overflow-hidden`}
      style={style || { height: 320 }}
    >
      {/* Toolbar */}
      <div className="h-10 border-b border-neutral-800 flex items-center justify-between px-4 bg-[#09090b] shrink-0 z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-xs w-24">
            <span className="text-[#6366f1] font-bold text-sm tracking-wide">{formatTimecode(currentTime)}</span>
          </div>

          <div className="h-4 w-px bg-neutral-800"></div>

          {/* Tool Group */}
          <div className="flex items-center gap-1">
            {/* Tool Indicator */}
            <div
              className={`flex items-center gap-2 px-2 py-0.5 rounded border cursor-pointer select-none transition-all ${tool === "razor" ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
              onClick={() => onToolChange(tool === "select" ? "razor" : "select")}
              title="Toggle Razor Tool (Ctrl+C)"
            >
              {tool === "razor" ? (
                <ScissorsIcon className="w-3.5 h-3.5" />
              ) : (
                <div className="w-3.5 h-3.5 border-2 border-current rounded-sm"></div>
              )}
              <span className="text-[10px] uppercase font-bold tracking-wider">
                {tool === "razor" ? "Razor" : "Select"}
              </span>
            </div>

            <div
              className="flex items-center gap-2 px-2 py-0.5 rounded border border-transparent hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 cursor-pointer transition-colors"
              onClick={handleSplitAtPlayhead}
              title="Split at Playhead"
            >
              <SplitIcon className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Split</span>
            </div>
          </div>

          <div className="h-4 w-px bg-neutral-800"></div>

          {onRenderPreview && (
            <>
              <div className="flex items-center gap-2">
                {isRendering ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/30">
                      <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                        Rendering {renderProgress.toFixed(0)}%
                      </span>
                    </div>
                    <button
                      onClick={onCancelRender}
                      className="px-2 py-1 rounded border border-red-500/30 bg-red-500/10 text-red-400 text-[10px] uppercase font-bold hover:bg-red-500/20 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onRenderPreview}
                      className={`flex items-center gap-2 px-3 py-1 rounded border transition-all ${
                        renderedPreviewUrl && !isPreviewStale
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          : isPreviewStale
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                            : "border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
                      }`}
                      title={
                        renderedPreviewUrl && !isPreviewStale
                          ? "Preview rendered - click to re-render"
                          : isPreviewStale
                            ? "Timeline changed - click to update preview"
                            : "Render preview video for playback"
                      }
                    >
                      {renderedPreviewUrl && !isPreviewStale ? (
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : isPreviewStale ? (
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                          <path d="M21 3v5h-5" />
                        </svg>
                      ) : (
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      )}
                      <span className="text-[10px] uppercase font-bold tracking-wider">
                        {renderedPreviewUrl && !isPreviewStale ? "Rendered" : isPreviewStale ? "Re-render" : "Render"}
                      </span>
                    </button>

                    {renderedPreviewUrl && !isPreviewStale && onTogglePreviewPlayback && (
                      <button
                        onClick={onTogglePreviewPlayback}
                        className={`flex items-center gap-2 px-3 py-1 rounded border transition-all ${
                          isPreviewPlayback
                            ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-300"
                            : "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                        }`}
                        title={isPreviewPlayback ? "Exit preview mode (back to live)" : "Watch rendered preview"}
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">
                          {isPreviewPlayback ? "Exit Preview" : "Play Preview"}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="h-4 w-px bg-neutral-800"></div>
            </>
          )}

          {/* Add preview playback button */}
          {onTogglePreviewPlayback && (
            <>
              <button
                onClick={onTogglePreviewPlayback}
                className={`flex items-center gap-2 px-2 py-0.5 rounded border transition-colors ${
                  isPreviewPlayback
                    ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                    : "border-transparent text-neutral-500 hover:text-neutral-300"
                }`}
                title={isPreviewPlayback ? "Disable Preview Playback" : "Enable Preview Playback"}
              >
                <EyeIcon className={`w-3.5 h-3.5 ${isPreviewPlayback ? "text-blue-400" : ""}`} />
                <span className="text-[10px] uppercase font-bold tracking-wider">Preview</span>
              </button>
              <div className="h-4 w-px bg-neutral-800"></div>
            </>
          )}

          {/* Granular Snapping Control */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center bg-neutral-800 rounded-md p-0.5 border border-neutral-700">
              <button
                onClick={() => setSnapConfig((p) => ({ ...p, enabled: !p.enabled }))}
                className={`p-1 rounded transition-colors ${snapConfig.enabled ? "text-indigo-400 bg-indigo-500/10" : "text-neutral-500 hover:text-neutral-300"}`}
                title="Toggle Snapping (S)"
              >
                <MagnetIcon className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-3.5 bg-neutral-700 mx-0.5"></div>
              <button
                onClick={() => setShowSnapMenu(!showSnapMenu)}
                className={`p-0.5 rounded hover:bg-neutral-700 text-neutral-400 ${showSnapMenu ? "bg-neutral-700 text-neutral-200" : ""}`}
              >
                <ChevronDownIcon className="w-3 h-3" />
              </button>
            </div>

            {showSnapMenu && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-[#18181b] border border-neutral-700 rounded-lg shadow-xl py-2 z-50 flex flex-col gap-1">
                <div className="px-3 py-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  Snap Targets
                </div>
                {[
                  { key: "toGrid", label: "Snap to Grid" },
                  { key: "toClips", label: "Snap to Clips" },
                  { key: "toPlayhead", label: "Snap to Playhead" },
                ].map((opt) => (
                  <div
                    key={opt.key}
                    className="px-3 py-1.5 hover:bg-neutral-800 cursor-pointer flex items-center justify-between group"
                    onClick={() => setSnapConfig((p) => ({ ...p, [opt.key]: !p[opt.key as keyof SnapConfig] }))}
                  >
                    <span className="text-xs text-neutral-300">{opt.label}</span>
                    {snapConfig[opt.key as keyof SnapConfig] && <CheckIcon className="w-3 h-3 text-indigo-400" />}
                  </div>
                ))}
                <div className="h-px bg-neutral-800 my-1"></div>
                <div className="px-3 py-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  Grid Interval
                </div>
                {[0.1, 0.25, 0.5, 1.0].map((val) => (
                  <div
                    key={val}
                    className="px-3 py-1.5 hover:bg-neutral-800 cursor-pointer flex items-center justify-between"
                    onClick={() => setSnapConfig((p) => ({ ...p, gridInterval: val }))}
                  >
                    <span className="text-xs text-neutral-300">{val}s</span>
                    {snapConfig.gridInterval === val && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedClipIds.length > 1 && (
            <div className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-[10px] font-medium border border-indigo-500/30">
              {selectedClipIds.length} Clips Selected
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Zoom Controls */}
          <div className="flex items-center gap-2 bg-[#18181b] rounded-md p-1 border border-neutral-800">
            <button
              onClick={() => onZoomChange(Math.max(10, zoomLevel - 10))}
              className="p-1 hover:text-white text-neutral-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <div className="w-24 px-2 flex items-center">
              <input
                type="range"
                min="10"
                max="200"
                value={zoomLevel}
                onChange={(e) => onZoomChange(Number(e.target.value))}
                className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer block focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-[#6366f1] [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>
            <button
              onClick={() => onZoomChange(Math.min(200, zoomLevel + 10))}
              className="p-1 hover:text-white text-neutral-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div
        className={`flex-1 flex overflow-hidden relative ${tool === "razor" ? "cursor-crosshair" : ""}`}
        id="timeline-wrapper"
      >
        {/* Track Headers */}
        <div
          ref={headerContainerRef}
          className="w-32 bg-[#09090b] border-r border-neutral-800 shrink-0 z-20 flex flex-col pt-8 shadow-[4px_0_15px_-5px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          {tracks.map((track) => {
            const isAudio = track.type === "audio"
            const trackHeight = isAudio ? "h-16" : "h-24"

            return (
              <div
                key={track.id}
                className={`${trackHeight} border-b border-neutral-800/50 flex flex-col px-3 py-3 gap-2 bg-[#09090b] relative group/header shrink-0`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {isAudio ? <MusicIcon className="w-3 h-3 text-emerald-500" /> : null}
                    <span
                      className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider truncate"
                      title={track.name}
                    >
                      {track.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                    <button
                      onClick={() => onTrackUpdate(track.id, { isLocked: !track.isLocked })}
                      className={`p-1 rounded hover:bg-neutral-800 ${track.isLocked ? "text-amber-500" : "text-neutral-600"}`}
                    >
                      {track.isLocked ? <LockIcon className="w-3 h-3" /> : <UnlockIcon className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => onTrackUpdate(track.id, { isMuted: !track.isMuted })}
                      className={`p-1 rounded hover:bg-neutral-800 ${track.isMuted ? "text-red-400" : "text-neutral-600"}`}
                    >
                      <MuteIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 bg-neutral-900/30 rounded border border-neutral-800/50 flex flex-col items-center justify-center overflow-hidden relative">
                  {isAudio ? (
                    <div
                      className={`w-full h-full flex flex-col items-center justify-center px-2 gap-1 transition-opacity ${track.isMuted ? "opacity-30" : "opacity-100"}`}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <VolumeIcon className="w-3 h-3 text-neutral-500" />
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={track.volume ?? 1}
                          disabled={track.isLocked}
                          onChange={(e) => onTrackUpdate(track.id, { volume: Number.parseFloat(e.target.value) })}
                          className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className={`flex items-end gap-0.5 h-3 ${track.isMuted ? "opacity-10" : "opacity-20"}`}>
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="w-1 bg-neutral-500" style={{ height: `${Math.random() * 100}%` }}></div>
                      ))}
                    </div>
                  )}
                  {track.isLocked && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                      <LockIcon className="w-4 h-4 text-neutral-500" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Add Track Buttons */}
          {onAddTrack && (
            <div className="p-2 flex flex-col gap-1 mt-2">
              <button
                onClick={() => onAddTrack("video")}
                className="flex items-center justify-center gap-2 w-full py-1.5 rounded border border-neutral-800 hover:bg-neutral-800 text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                <PlusIcon className="w-3 h-3" /> Video Track
              </button>
              <button
                onClick={() => onAddTrack("audio")}
                className="flex items-center justify-center gap-2 w-full py-1.5 rounded border border-neutral-800 hover:bg-neutral-800 text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                <PlusIcon className="w-3 h-3" /> Audio Track
              </button>
            </div>
          )}

          {/* Spacer to allow scrolling past bottom */}
          <div className="h-20 shrink-0"></div>
        </div>

        {/* Scrollable Timeline */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-x-auto overflow-y-auto relative bg-[#0c0c0e] custom-scrollbar"
          onMouseDown={handleMouseDownBackground}
        >
          {/* Global Ruler */}
          <div
            className="h-8 border-b border-neutral-800 flex items-end sticky top-0 bg-[#09090b] z-30 min-w-full ruler-area"
            style={{ width: `${Math.max(duration * zoomLevel + 500, 2000)}px` }}
          >
            <div className="relative w-full h-full">
              {[...Array(Math.ceil(duration + 10))].map((_, sec) => (
                <div
                  key={sec}
                  className="absolute bottom-0 h-full flex flex-col justify-end pointer-events-none"
                  style={{ left: `${sec * zoomLevel}px` }}
                >
                  <div className="h-2.5 border-l border-neutral-600"></div>
                  <span className="absolute bottom-3 left-1 text-[9px] text-neutral-500 font-mono select-none">
                    {sec}s
                  </span>
                  {snapConfig.enabled &&
                    snapConfig.toGrid &&
                    [...Array(Math.floor(1 / snapConfig.gridInterval) - 1)].map((_, i) => {
                      const offset = (i + 1) * snapConfig.gridInterval
                      return (
                        <div
                          key={i}
                          className="absolute bottom-0 border-l border-neutral-700 h-2"
                          style={{ left: `${offset * zoomLevel}px` }}
                        />
                      )
                    })}
                  {(!snapConfig.enabled || !snapConfig.toGrid || snapConfig.gridInterval === 1) && (
                    <div
                      className="absolute bottom-0 border-l border-neutral-700 h-2"
                      style={{ left: `${zoomLevel * 0.5}px` }}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tracks Render */}
          <div className="min-w-full relative" style={{ width: `${Math.max(duration * zoomLevel + 500, 2000)}px` }}>
            {/* Playhead Line */}
            <div
              className="absolute top-0 bottom-0 w-[1px] bg-[#6366f1] z-50 pointer-events-none"
              style={{ left: `${currentTime * zoomLevel}px` }}
            >
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#6366f1] -ml-[5.5px] -mt-[0px] sticky top-0"></div>
              <div className="absolute top-0 bottom-0 w-px bg-[#6366f1]"></div>
            </div>

            {/* Snap Indicator Line */}
            {snapIndicator !== null && (
              <div
                className="absolute top-0 bottom-0 w-[1px] bg-yellow-400 z-50 pointer-events-none shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                style={{ left: `${snapIndicator * zoomLevel}px` }}
              ></div>
            )}

            {/* Marquee Selection Box */}
            {selectionBox && (
              <div
                className="absolute z-[60] bg-indigo-500/20 border border-indigo-500/50 pointer-events-none"
                style={{
                  left: selectionBox.x,
                  top: selectionBox.y,
                  width: selectionBox.w,
                  height: selectionBox.h,
                }}
              />
            )}

            {tracks.map((track) => {
              const trackClips = clips.filter((c) => c.trackId === track.id)
              const isAudio = track.type === "audio"
              const trackHeight = isAudio ? "h-16" : "h-24"

              return (
                <div
                  key={track.id}
                  className={`${trackHeight} border-b border-neutral-800/30 relative group/track bg-[#0c0c0e]`}
                >
                  <div
                    className="absolute inset-0 bg-[linear-gradient(90deg,transparent_99%,#1f1f22_100%)] opacity-10 pointer-events-none"
                    style={{ backgroundSize: `${zoomLevel}px 100%` }}
                  ></div>

                  {trackClips.map((clip) => {
                    const media = mediaMap[clip.mediaId]
                    const isSelected = selectedClipIds.includes(clip.id)

                    const baseColor = isAudio ? "bg-emerald-900/40" : "bg-[#18181b]"
                    const hoverColor = isAudio ? "hover:bg-emerald-900/60" : "hover:bg-[#202023]"
                    const borderColor = isAudio ? "border-emerald-800/50" : "border-neutral-700/80"
                    const cursorClass = tool === "razor" ? "cursor-crosshair" : "cursor-pointer"
                    const selectedClass = isSelected
                      ? isAudio
                        ? "bg-emerald-900/60 border-emerald-400 z-20 ring-1 ring-emerald-400"
                        : "bg-[#1e1e24] border-[#6366f1] z-20 ring-1 ring-[#6366f1]"
                      : `${baseColor} ${hoverColor} hover:border-neutral-500 z-10`

                    const verticalPos = isAudio ? "top-1 bottom-1" : "top-0 bottom-0"

                    return (
                      <div
                        key={clip.id}
                        className={`clip-item absolute ${verticalPos} rounded-md overflow-visible ${cursorClass} flex flex-col border transition-all select-none group/item ${selectedClass} shadow-[0_4px_12px_rgba(0,0,0,0.5)]`}
                        style={{
                          left: `${clip.start * zoomLevel}px`,
                          width: `${clip.duration * zoomLevel}px`,
                          opacity: track.isMuted ? 0.5 : 1,
                          pointerEvents: track.isLocked ? "none" : "auto",
                        }}
                        onMouseDown={(e) => handleMouseDownClip(e, clip, "move")}
                        onContextMenu={(e) => handleContextMenuClip(e, clip.id)}
                      >
                        {clip.transition && clip.transition.type !== "none" && (
                          <div
                            className="absolute left-0 top-0 bottom-0 z-30 bg-gradient-to-r from-white/30 to-transparent pointer-events-none border-r border-white/20 flex items-center justify-start pl-1"
                            style={{ width: `${clip.transition.duration * zoomLevel}px` }}
                          >
                            <div className="text-[9px] text-white/80 font-bold -rotate-90 origin-left translate-y-4 truncate w-full">
                              {clip.transition.type.replace("-", " ")}
                            </div>
                          </div>
                        )}

                        <div
                          className={`absolute -left-3 top-0 bottom-0 w-6 cursor-ew-resize z-30 flex items-center justify-center group/handle opacity-0 group-hover/item:opacity-100 ${isSelected && "opacity-100"}`}
                          onMouseDown={(e) => handleMouseDownClip(e, clip, "trim-start")}
                        >
                          <div className="w-1.5 h-8 bg-white rounded-full shadow-md group-hover/handle:scale-110 transition-transform"></div>
                        </div>

                        <div
                          className={`absolute -right-3 top-0 bottom-0 w-6 cursor-ew-resize z-30 flex items-center justify-center group/handle opacity-0 group-hover/item:opacity-100 ${isSelected && "opacity-100"}`}
                          onMouseDown={(e) => handleMouseDownClip(e, clip, "trim-end")}
                        >
                          <div className="w-1.5 h-8 bg-white rounded-full shadow-md group-hover/handle:scale-110 transition-transform"></div>
                        </div>

                        {/* Content Render */}
                        <div className="flex-1 overflow-hidden relative px-2 py-1 flex flex-col justify-center">
                          {/* Thumbnails Strips (Video only) */}
                          {!isAudio &&
                            !clip.isAudioDetached &&
                            media?.status === "ready" &&
                            clip.duration * zoomLevel > 60 && (
                              <div className="absolute inset-0 flex opacity-20 pointer-events-none">
                                {[...Array(Math.floor((clip.duration * zoomLevel) / 60))].map((_, i) => (
                                  <div
                                    key={i}
                                    className="w-[60px] h-full border-r border-white/10 overflow-hidden relative"
                                  >
                                    <video src={media.url} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            )}

                          {/* Info */}
                          <div className="relative z-10 flex items-center gap-2">
                            <span
                              className={`text-[10px] font-medium truncate drop-shadow-md ${isAudio ? "text-emerald-100" : "text-white"}`}
                            >
                              {media?.prompt || "Media"}
                            </span>
                          </div>
                          {/* Waveform Visualization */}
                          <div className="absolute bottom-0 left-0 right-0 h-1/2 opacity-50 px-0.5">
                            {media && (
                              <ClipWaveform
                                duration={clip.duration}
                                offset={clip.offset}
                                isAudio={isAudio}
                                isSelected={isSelected}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}

            {/* Extra space at bottom */}
            <div className="h-40"></div>
          </div>
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed z-[100] bg-[#18181b] border border-neutral-700 rounded-lg shadow-2xl py-1 w-48 animate-in fade-in zoom-in-95 duration-75"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1.5 border-b border-neutral-800 text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
              Clip Actions
            </div>

            <button
              onClick={() => {
                onSplitClip(contextMenu.clipId, currentTime)
                setContextMenu(null)
              }}
              className="w-full px-3 py-1.5 text-left text-xs text-neutral-200 hover:bg-neutral-800 flex items-center gap-2"
            >
              <SplitIcon className="w-3.5 h-3.5 text-neutral-500" /> Split at Playhead
            </button>

            <button
              onClick={() => {
                onDuplicateClip([contextMenu.clipId])
                setContextMenu(null)
              }}
              className="w-full px-3 py-1.5 text-left text-xs text-neutral-200 hover:bg-neutral-800 flex items-center gap-2"
            >
              <CopyIcon className="w-3.5 h-3.5 text-neutral-500" /> Duplicate
            </button>

            {!clips.find((c) => c.id === contextMenu.clipId)?.isAudioDetached &&
              tracks.find((t) => t.id === clips.find((c) => c.id === contextMenu.clipId)?.trackId)?.type ===
                "video" && (
                <button
                  onClick={() => {
                    onDetachAudio(contextMenu.clipId)
                    setContextMenu(null)
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-neutral-200 hover:bg-neutral-800 flex items-center gap-2"
                >
                  <DetachIcon className="w-3.5 h-3.5 text-neutral-500" /> Detach Audio
                </button>
              )}

            <div className="h-px bg-neutral-800 my-1"></div>

            <button
              onClick={() => {
                onRippleDeleteClip([contextMenu.clipId])
                setContextMenu(null)
              }}
              className="w-full px-3 py-1.5 text-left text-xs text-amber-400 hover:bg-neutral-800 flex items-center gap-2"
            >
              <LayoutIcon className="w-3.5 h-3.5 text-amber-600" /> Ripple Delete
            </button>

            <button
              onClick={() => {
                onDeleteClip([contextMenu.clipId])
                setContextMenu(null)
              }}
              className="w-full px-3 py-1.5 text-left text-xs text-red-400 hover:bg-neutral-800 flex items-center gap-2"
            >
              <TrashIcon className="w-3.5 h-3.5 text-red-500" /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Timeline
