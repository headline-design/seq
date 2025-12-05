
"use client"

import React, { memo } from "react"
import type { TimelineClip, MediaItem, Track } from "../types"

interface TimelineClipItemProps {
  clip: TimelineClip
  media: MediaItem | undefined
  track: Track
  zoomLevel: number
  isSelected: boolean
  tool: "select" | "razor"
  onMouseDown: (e: React.MouseEvent, mode: "move" | "trim-start" | "trim-end") => void
  onContextMenu: (e: React.MouseEvent) => void
}

const ClipWaveform = ({ duration, offset, isAudio, isSelected }: { duration: number; offset: number; isAudio: boolean; isSelected: boolean }) => {
  const bars = Math.min(100, Math.max(10, Math.floor(duration * 8)))
  return (
    <div className="w-full h-full flex items-end gap-[1px] overflow-hidden opacity-80 pointer-events-none">
      {Array.from({ length: bars }).map((_, i) => {
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

export const TimelineClipItem = memo(({
  clip,
  media,
  track,
  zoomLevel,
  isSelected,
  tool,
  onMouseDown,
  onContextMenu
}: TimelineClipItemProps) => {
  const isAudio = track.type === "audio"
  
  const baseColor = isAudio ? "bg-emerald-900/40" : "bg-[#18181b]"
  const hoverColor = isAudio ? "hover:bg-emerald-900/60" : "hover:bg-[#202023]"
  const cursorClass = tool === "razor" ? "cursor-crosshair" : "cursor-pointer"
  
  const selectedClass = isSelected
    ? isAudio
      ? "bg-emerald-900/60 border-emerald-400 z-20 ring-1 ring-emerald-400 shadow-md"
      : "bg-[#1e1e24] border-[#6366f1] z-20 ring-1 ring-[#6366f1] shadow-md"
    : `${baseColor} ${hoverColor} border-transparent hover:border-neutral-600 z-10`
    
  const borderClass = "border"
  const verticalPos = isAudio ? "top-1 bottom-1" : "top-0 bottom-0"

  return (
    <div
      className={`clip-item absolute ${verticalPos} rounded-md overflow-visible ${cursorClass} flex flex-col ${borderClass} transition-colors select-none group/item ${selectedClass}`}
      style={{
        left: `${clip.start * zoomLevel}px`,
        width: `${clip.duration * zoomLevel}px`,
        opacity: track.isMuted ? 0.5 : 1,
        pointerEvents: track.isLocked ? "none" : "auto",
      }}
      onMouseDown={(e) => onMouseDown(e, "move")}
      onContextMenu={onContextMenu}
    >
      {/* Transition Indicator */}
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

      {/* Resize Handles - Only visible on hover or selection */}
      <div
        className={`absolute -left-3 top-0 bottom-0 w-6 cursor-ew-resize z-30 flex items-center justify-center group/handle opacity-0 group-hover/item:opacity-100 ${isSelected && "opacity-100"}`}
        onMouseDown={(e) => onMouseDown(e, "trim-start")}
      >
        <div className="w-1 h-6 bg-white rounded-full shadow-sm group-hover/handle:scale-110 transition-transform"></div>
      </div>

      <div
        className={`absolute -right-3 top-0 bottom-0 w-6 cursor-ew-resize z-30 flex items-center justify-center group/handle opacity-0 group-hover/item:opacity-100 ${isSelected && "opacity-100"}`}
        onMouseDown={(e) => onMouseDown(e, "trim-end")}
      >
        <div className="w-1 h-6 bg-white rounded-full shadow-sm group-hover/handle:scale-110 transition-transform"></div>
      </div>

      {/* Content Render */}
      <div className="flex-1 overflow-hidden relative px-2 py-1 flex flex-col justify-center">
        {/* Video Thumbnails or Image Preview */}
        {!isAudio && !clip.isAudioDetached && media?.status === "ready" && (
           media.type === 'video' ? (
              clip.duration * zoomLevel > 60 && (
                <div className="absolute inset-0 flex opacity-20 pointer-events-none">
                  {[...Array(Math.floor((clip.duration * zoomLevel) / 60))].map((_, i) => (
                    <div key={i} className="w-[60px] h-full border-r border-white/10 overflow-hidden relative">
                      <video src={media.url} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )
           ) : media.type === 'image' ? (
              <div className="absolute inset-0 opacity-30 pointer-events-none">
                 <img src={media.url} className="w-full h-full object-cover" alt="" />
              </div>
           ) : null
        )}

        {/* Label */}
        <div className="relative z-10 flex items-center gap-2">
          <span className={`text-[10px] font-medium truncate drop-shadow-md ${isAudio ? "text-emerald-100" : "text-white"}`}>
            {media?.prompt || "Media"}
          </span>
        </div>

        {/* Waveform */}
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
})

TimelineClipItem.displayName = "TimelineClipItem"
