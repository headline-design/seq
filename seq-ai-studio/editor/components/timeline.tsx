"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback, memo, useMemo } from "react"
import type { TimelineClip, Track, MediaItem } from "../types"
import { TimelineRuler } from "./timeline-ruler"
import { TimelineClipItem } from "./timeline-clip"
import { TimelineToolbar } from "./timeline-toolbar"
import { TimelineTrackHeaders } from "./timeline-track-headers"
import { TimelineContextMenu } from "./timeline-context-menu"
import { useTimelineSnap } from "../hooks/use-timeline-snap"
import { useTimelineDrag } from "../hooks/use-timeline-drag"
import { useTimelineSelection } from "../hooks/use-timeline-selection"
import { useScrollPosition } from "../hooks/use-virtualized-clips"

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
  isLooping: boolean
  onPlayPause: () => void
  onToggleLoop: () => void
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
  onExportAudio?: (clipId: string) => void
  frameRate?: number
}

export const Timeline = memo(function Timeline({
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
  isLooping,
  onPlayPause,
  onToggleLoop,
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
  isPreviewPlayback = false,
  onTogglePreviewPlayback,
  onExportAudio,
  frameRate = 30,
}: TimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const headerContainerRef = useRef<HTMLDivElement>(null)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; clipId: string } | null>(null)

  const { scrollLeft, viewportWidth } = useScrollPosition(scrollContainerRef)

  const visibleClipsByTrack = useMemo(() => {
    const buffer = 200 // pixels
    const startTime = Math.max(0, (scrollLeft - buffer) / zoomLevel)
    const endTime = (scrollLeft + viewportWidth + buffer) / zoomLevel

    const result: Record<string, TimelineClip[]> = {}
    for (const track of tracks) {
      result[track.id] = clips.filter((clip) => {
        if (clip.trackId !== track.id) return false
        const clipEnd = clip.start + clip.duration
        return clipEnd >= startTime && clip.start <= endTime
      })
    }
    return result
  }, [clips, tracks, scrollLeft, viewportWidth, zoomLevel])

  const totalWidth = useMemo(() => {
    if (clips.length === 0) return 2000
    const maxEnd = Math.max(...clips.map((c) => c.start + c.duration))
    return Math.max(maxEnd * zoomLevel + 500, 2000)
  }, [clips, zoomLevel])

  // Snapping hook
  const {
    snapConfig,
    showSnapMenu,
    setShowSnapMenu,
    getSnapTime,
    toggleSnapEnabled,
    toggleSnapOption,
    setGridInterval,
  } = useTimelineSnap({
    clips,
    currentTime,
    zoomLevel,
    isDraggingPlayhead,
  })

  // Drag hook
  const { dragState, snapIndicator, handleMouseDownClip, handleDragMove, handleDragEnd } = useTimelineDrag({
    clips,
    tracks,
    selectedClipIds,
    zoomLevel,
    tool,
    snapEnabled: snapConfig.enabled,
    getSnapTime,
    onClipUpdate,
    onSelectClips,
    onSplitClip,
    onDragStart,
  })

  // Selection hook
  const { isSelecting, selectionBox, handleMouseDownBackground, handleSelectionMove, handleSelectionEnd } =
    useTimelineSelection({
      clips,
      tracks,
      zoomLevel,
      tool,
      onSelectClips,
      onToolChange,
      scrollContainerRef,
    })

  // Refs for event listeners
  const zoomLevelRef = useRef(zoomLevel)
  zoomLevelRef.current = zoomLevel
  const onSeekRef = useRef(onSeek)
  onSeekRef.current = onSeek
  const isSelectingRef = useRef(isSelecting)
  isSelectingRef.current = isSelecting

  // Split at playhead handler
  const handleSplitAtPlayhead = useCallback(() => {
    if (selectedClipIds.length > 0) {
      selectedClipIds.forEach((id) => {
        const clip = clips.find((c) => c.id === id)
        if (clip && currentTime > clip.start && currentTime < clip.start + clip.duration) {
          onSplitClip(id, currentTime)
        }
      })
    }
  }, [selectedClipIds, clips, currentTime, onSplitClip])

  // Sync scroll between headers and tracks
  const handleScroll = useCallback(() => {
    if (headerContainerRef.current && scrollContainerRef.current) {
      headerContainerRef.current.scrollTop = scrollContainerRef.current.scrollTop
    }
  }, [])

  // Context menu handler
  const handleContextMenuClip = useCallback(
    (e: React.MouseEvent, clipId: string) => {
      e.preventDefault()
      e.stopPropagation()
      setContextMenu({ x: e.clientX, y: e.clientY, clipId })
      if (!selectedClipIds.includes(clipId)) {
        onSelectClips([clipId])
      }
    },
    [selectedClipIds, onSelectClips],
  )

  // Scrub handler
  const handleScrub = useCallback((clientX: number) => {
    if (scrollContainerRef.current) {
      const rect = scrollContainerRef.current.getBoundingClientRect()
      const scrollLeft = scrollContainerRef.current.scrollLeft
      const relativeX = clientX - rect.left + scrollLeft
      const time = Math.max(0, relativeX / zoomLevelRef.current)
      onSeekRef.current(time)
    }
  }, [])

  // Scrubbing ref
  const isScrubbingRef = useRef(isScrubbing)
  isScrubbingRef.current = isScrubbing

  // Global mouse move handler
  const globalMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isScrubbingRef.current) {
        handleScrub(e.clientX)
      } else if (isSelectingRef.current) {
        handleSelectionMove(e)
      } else {
        handleDragMove(e)
      }
    },
    [handleScrub, handleSelectionMove, handleDragMove],
  )

  // Global mouse up handler
  const handleMouseUp = useCallback(() => {
    handleDragEnd()
    handleSelectionEnd()
    setIsScrubbing(false)
    setIsDraggingPlayhead(false)
    document.body.style.cursor = "default"
  }, [handleDragEnd, handleSelectionEnd])

  // Global event listeners
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
  }, [globalMouseMove, handleMouseUp, setShowSnapMenu])

  // Playhead dragging logic
  useEffect(() => {
    if (isDraggingPlayhead) {
      const handleGlobalMove = (e: MouseEvent) => {
        e.preventDefault()
        if (scrollContainerRef.current) {
          const rect = scrollContainerRef.current.getBoundingClientRect()
          const x = e.clientX - rect.left + scrollContainerRef.current.scrollLeft
          let time = x / zoomLevel
          time = Math.max(0, Math.min(time, duration))

          if (snapConfig.enabled) {
            const snap = getSnapTime(time, [])
            if (snap !== null) {
              time = snap
            }
          }
          onSeek(time)
        }
      }
      const handleGlobalUp = () => {
        setIsDraggingPlayhead(false)
        document.body.style.cursor = "default"
      }

      document.body.style.cursor = "ew-resize"
      window.addEventListener("mousemove", handleGlobalMove)
      window.addEventListener("mouseup", handleGlobalUp)
      return () => {
        window.removeEventListener("mousemove", handleGlobalMove)
        window.removeEventListener("mouseup", handleGlobalUp)
        document.body.style.cursor = "default"
      }
    }
  }, [isDraggingPlayhead, zoomLevel, duration, snapConfig, onSeek, getSnapTime])

  // Wheel zoom/scroll
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const { getNextZoom, getPrevZoom } = require("../utils/timeline-scale")
        const nextZoom = e.deltaY > 0 ? getPrevZoom(zoomLevel) : getNextZoom(zoomLevel)
        onZoomChange(nextZoom)
      } else if (e.shiftKey) {
        e.preventDefault()
        el.scrollLeft += e.deltaY
      }
    }

    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [zoomLevel, onZoomChange])

  const handleClipKeyDown = useCallback(
    (e: React.KeyboardEvent, clipId: string) => {
      const clip = clips.find((c) => c.id === clipId)
      if (!clip) return

      switch (e.key) {
        case "Enter":
        case " ":
          e.preventDefault()
          onSelectClips([clipId])
          break
        case "Delete":
        case "Backspace":
          e.preventDefault()
          if (selectedClipIds.includes(clipId)) {
            onDeleteClip(selectedClipIds)
          } else {
            onDeleteClip([clipId])
          }
          break
        case "ArrowLeft":
          e.preventDefault()
          onClipUpdate(clipId, { start: Math.max(0, clip.start - (e.shiftKey ? 1 : 0.1)) })
          break
        case "ArrowRight":
          e.preventDefault()
          onClipUpdate(clipId, { start: clip.start + (e.shiftKey ? 1 : 0.1) })
          break
        case "d":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            onDuplicateClip([clipId])
          }
          break
        case "e":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            if (onExportAudio) {
              onExportAudio(clipId)
            }
          }
          break
      }
    },
    [clips, selectedClipIds, onSelectClips, onDeleteClip, onClipUpdate, onDuplicateClip, onExportAudio],
  )

  return (
    <div
      className={`${className || ""} bg-[#09090b] border-t border-neutral-800 flex flex-col shrink-0 select-none relative z-10 transition-none overflow-hidden`}
      style={style || { height: 320 }}
    >
      {/* Toolbar */}
      <TimelineToolbar
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        isLooping={isLooping}
        tool={tool}
        zoomLevel={zoomLevel}
        selectedClipCount={selectedClipIds.length}
        snapConfig={snapConfig}
        showSnapMenu={showSnapMenu}
        isRendering={isRendering}
        renderProgress={renderProgress}
        renderedPreviewUrl={renderedPreviewUrl}
        isPreviewStale={isPreviewStale}
        isPreviewPlayback={isPreviewPlayback}
        frameRate={frameRate}
        onPlayPause={onPlayPause}
        onSeek={onSeek}
        onToggleLoop={onToggleLoop}
        onToolChange={onToolChange}
        onSplitAtPlayhead={handleSplitAtPlayhead}
        onZoomChange={onZoomChange}
        onToggleSnap={toggleSnapEnabled}
        onToggleSnapOption={toggleSnapOption}
        onSetGridInterval={setGridInterval}
        onSetShowSnapMenu={setShowSnapMenu}
        onRenderPreview={onRenderPreview}
        onCancelRender={onCancelRender}
        onTogglePreviewPlayback={onTogglePreviewPlayback}
      />

      <div
        className={`flex-1 flex overflow-hidden relative ${tool === "razor" ? "cursor-crosshair" : ""}`}
        id="timeline-wrapper"
      >
        {/* Track Headers */}
        <div
          ref={headerContainerRef}
          className="w-32 bg-[#09090b] border-r border-neutral-800 shrink-0 z-20 flex flex-col pt-8 shadow-[4px_0_15px_-5px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          <TimelineTrackHeaders tracks={tracks} onTrackUpdate={onTrackUpdate} onAddTrack={onAddTrack} />
        </div>

        {/* Scrollable Timeline */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-x-auto overflow-y-auto relative bg-[#0c0c0e] custom-scrollbar"
          onMouseDown={handleMouseDownBackground}
        >
          {/* Canvas Ruler */}
          <TimelineRuler
            duration={duration}
            zoomLevel={zoomLevel}
            scrollContainerRef={scrollContainerRef}
            onClick={(time) => onSeek(time)}
          />

          {/* Tracks Render */}
          <div className="min-w-full relative" style={{ width: `${totalWidth}px` }}>
            {/* Playhead Line (Interactive) */}
            <div
              className="absolute top-0 bottom-0 z-50 group/playhead"
              style={{ left: `${currentTime * zoomLevel}px` }}
            >
              {/* Hit Area */}
              <div
                className="absolute -left-2 w-4 h-full cursor-ew-resize z-50"
                onMouseDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  setIsDraggingPlayhead(true)
                }}
              />
              {/* Visual Line */}
              <div
                className={`absolute left-0 w-px h-full bg-[#6366f1] pointer-events-none ${
                  isDraggingPlayhead ? "bg-white shadow-[0_0_8px_white]" : ""
                }`}
              />
              {/* Head/Handle */}
              <div
                className={`absolute -left-[5.5px] top-0 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] pointer-events-none transition-colors ${
                  isDraggingPlayhead ? "border-t-white" : "border-t-[#6366f1] group-hover/playhead:border-t-indigo-400"
                }`}
              />
            </div>

            {/* Snap Indicator Line */}
            {snapIndicator !== null && (
              <div
                className="absolute top-0 bottom-0 w-[1px] bg-yellow-400 z-50 pointer-events-none shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                style={{ left: `${snapIndicator * zoomLevel}px` }}
              />
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

            {/* Track Rows */}
            {tracks.map((track) => {
              const trackClips = visibleClipsByTrack[track.id] || []
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
                  />

                  {trackClips.map((clip, index) => {
                    const media = mediaMap[clip.mediaId]
                    const isSelected = selectedClipIds.includes(clip.id)

                    return (
                      <TimelineClipItem
                        key={clip.id}
                        clip={clip}
                        media={media}
                        track={track}
                        zoomLevel={zoomLevel}
                        isSelected={isSelected}
                        tool={tool}
                        onMouseDown={(e, mode) => handleMouseDownClip(e, clip, mode)}
                        onContextMenu={(e) => handleContextMenuClip(e, clip.id)}
                        onKeyDown={(e) => handleClipKeyDown(e, clip.id)}
                        tabIndex={index === 0 ? 0 : -1}
                      />
                    )
                  })}
                </div>
              )
            })}

            {/* Extra space at bottom */}
            <div className="h-40" />
          </div>
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <TimelineContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            clipId={contextMenu.clipId}
            clips={clips}
            tracks={tracks}
            currentTime={currentTime}
            onSplitClip={onSplitClip}
            onDuplicateClip={onDuplicateClip}
            onDetachAudio={onDetachAudio}
            onRippleDeleteClip={onRippleDeleteClip}
            onDeleteClip={onDeleteClip}
            onExportAudio={onExportAudio}
            onClose={() => setContextMenu(null)}
          />
        )}
      </div>
    </div>
  )
})
