"use client"

import { memo } from "react"
import type { TimelineClip, Track } from "../types"
import { SplitIcon, CopyIcon, MusicIcon, LayoutIcon, TrashIcon } from "./icons"

interface TimelineContextMenuProps {
  x: number
  y: number
  clipId: string
  clips: TimelineClip[]
  tracks: Track[]
  currentTime: number
  onSplitClip: (clipId: string, time: number) => void
  onDuplicateClip: (clipIds: string[]) => void
  onDetachAudio: (clipId: string) => void
  onRippleDeleteClip: (clipIds: string[]) => void
  onDeleteClip: (clipIds: string[]) => void
  onClose: () => void
}

export const TimelineContextMenu = memo(function TimelineContextMenu({
  x,
  y,
  clipId,
  clips,
  tracks,
  currentTime,
  onSplitClip,
  onDuplicateClip,
  onDetachAudio,
  onRippleDeleteClip,
  onDeleteClip,
  onClose,
}: TimelineContextMenuProps) {
  const clip = clips.find((c) => c.id === clipId)
  const track = clip ? tracks.find((t) => t.id === clip.trackId) : null
  const canDetachAudio = clip && !clip.isAudioDetached && track?.type === "video"

  return (
    <div
      className="fixed z-[100] bg-[#18181b] border border-neutral-700 rounded-lg shadow-2xl py-1 w-48 animate-in fade-in zoom-in-95 duration-75"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-1.5 border-b border-neutral-800 text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
        Clip Actions
      </div>

      <button
        onClick={() => {
          onSplitClip(clipId, currentTime)
          onClose()
        }}
        className="w-full px-3 py-1.5 text-left text-xs text-neutral-200 hover:bg-neutral-800 flex items-center gap-2"
      >
        <SplitIcon className="w-3.5 h-3.5 text-neutral-500" /> Split at Playhead
      </button>

      <button
        onClick={() => {
          onDuplicateClip([clipId])
          onClose()
        }}
        className="w-full px-3 py-1.5 text-left text-xs text-neutral-200 hover:bg-neutral-800 flex items-center gap-2"
      >
        <CopyIcon className="w-3.5 h-3.5 text-neutral-500" /> Duplicate
      </button>

      {canDetachAudio && (
        <button
          onClick={() => {
            onDetachAudio(clipId)
            onClose()
          }}
          className="w-full px-3 py-1.5 text-left text-xs text-neutral-200 hover:bg-neutral-800 flex items-center gap-2"
        >
          <MusicIcon className="w-3.5 h-3.5 text-neutral-500" /> Detach Audio
        </button>
      )}

      <div className="h-px bg-neutral-800 my-1" />

      <button
        onClick={() => {
          onRippleDeleteClip([clipId])
          onClose()
        }}
        className="w-full px-3 py-1.5 text-left text-xs text-amber-400 hover:bg-neutral-800 flex items-center gap-2"
      >
        <LayoutIcon className="w-3.5 h-3.5 text-amber-600" /> Ripple Delete
      </button>

      <button
        onClick={() => {
          onDeleteClip([clipId])
          onClose()
        }}
        className="w-full px-3 py-1.5 text-left text-xs text-red-400 hover:bg-neutral-800 flex items-center gap-2"
      >
        <TrashIcon className="w-3.5 h-3.5 text-red-500" /> Delete
      </button>
    </div>
  )
})
