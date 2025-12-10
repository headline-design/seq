"use client"

import type React from "react"
import { useRef, useState, useCallback, memo, useMemo } from "react"
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
  onAddTrack?: (type: "video" | "audio" | "text") => void
  onReorderTracks?: (trackIds: string[]) => void
  onAddTextClip?: (trackId: string, start: number) => void
  isRendering?: boolean
  renderProgress?: number
  renderedPreviewUrl?: string | null
  isPreviewStale?: boolean
  onRenderPreview?: () => void
  onCancelRender?: () => void
  isPreviewPlayback?: boolean
  onTogglePreviewPlayback?: () => void
  onExportAudio?: (clipIds: string[]) => void
  frameRate?: number
  historyCount?: number
  futureCount?: number
  onUndo?: () => void
  onRedo?: () => void
  onShowShortcuts?: () => void
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
  onReorderTracks,
  onAddTextClip,
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
  historyCount = 0,
  futureCount = 0,
  onUndo,
  onRedo,
  onShowShortcuts,
}: TimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const headerContainerRef = useRef<HTMLDivElement>(null)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; clipId: string } | null>(null)

  const { scrollLeft, viewportWidth } = useScrollPosition(scrollContainerRef)

  const visibleClipsByTrack = useMemo(() => {
    const buffer = 200
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

  const handleTrackDoubleClick = useCallback(
    (e: React.MouseEvent, track: Track) => {
      if (track.type !== "text" || !onAddTextClip) return
      if (!scrollContainerRef.current) return

      const rect = scrollContainerRef.current.getBoundingClientRect()
      const scrollLeft = scrollContainerRef.current.scrollLeft
      const x = e.clientX - rect.left + scrollLeft
      const time = Math.max(0, x / zoomLevel)

      onAddTextClip(track.id, time)
    },
    [zoomLevel, onAddTextClip],
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
        historyCount={historyCount}
        futureCount={futureCount}
        onUndo={onUndo}
        onRedo={onRedo}
        onShowShortcuts={onShowShortcuts}
        onPlayPause={onPlayPause}
        onSeek={onSeek}
        onToggleLoop={onToggleLoop}
        onToolChange={onToolChange}
        onSplitAtPlayhead={() => {
          if (selectedClipIds.length > 0) {
            selectedClipIds.forEach((id) => {
              const clip = clips.find((c) => c.id === id)
              if (clip && currentTime > clip.start && currentTime < clip.start + clip.duration) {
                onSplitClip(id, currentTime)
              }
            })
          }
        }}
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
          <TimelineTrackHeaders
            tracks={tracks}
            onTrackUpdate={onTrackUpdate}
            onAddTrack={onAddTrack}
            onReorderTracks={onReorderTracks}
          />
        </div>

        {/* Scrollable Timeline */}
        <div
          ref={scrollContainerRef}
          onScroll={() => {
            if (headerContainerRef.current && scrollContainerRef.current) {
              headerContainerRef.current.scrollTop = scrollContainerRef.current.scrollTop
            }
          }}
          className="flex-1 overflow-x-auto overflow-y-auto relative bg-[#0c0c0e] custom-scrollbar"
          onMouseDown={(e) => {
            // Only handle background selection if not clicking on a clip
            const target = e.target as HTMLElement
            if (!target.closest("[data-clip]")) {
              handleMouseDownBackground(e)
            }
          }}
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
              const isText = track.type === "text"
              const trackHeight = isAudio ? "h-16" : isText ? "h-12" : "h-24"

              return (
                <div
                  key={track.id}
                  className={`${trackHeight} border-b border-neutral-800/30 relative group/track bg-[#0c0c0e]`}
                  onDoubleClick={(e) => handleTrackDoubleClick(e, track)}
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
                        onContextMenu={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setContextMenu({ x: e.clientX, y: e.clientY, clipId: clip.id })
                          if (!selectedClipIds.includes(clip.id)) {
                            onSelectClips([clip.id])
                          }
                        }}
                        onKeyDown={(e) => {
                          // existing key handling
                        }}
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
            selectedClipIds={selectedClipIds}
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
