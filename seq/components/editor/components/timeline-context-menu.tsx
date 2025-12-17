"use client"

import { memo } from "react"
import type { TimelineClip, Track } from "../types"
import { SplitIcon, CopyIcon, MusicIcon, LayoutIcon, TrashIcon, DownloadIcon } from "./icons"

interface TimelineContextMenuProps {
  x: number
  y: number
  clipId: string
  clips: TimelineClip[]
  tracks: Track[]
  currentTime: number
  selectedClipIds: string[]
  onSplitClip: (clipId: string, time: number) => void
  onDuplicateClip: (clipIds: string[]) => void
  onDetachAudio: (clipId: string) => void
  onRippleDeleteClip: (clipIds: string[]) => void
  onDeleteClip: (clipIds: string[]) => void
  onExportAudio?: (clipIds: string[]) => void
  onClose: () => void
}

export const TimelineContextMenu = memo(function TimelineContextMenu({
  x,
  y,
  clipId,
  clips,
  tracks,
  currentTime,
  selectedClipIds,
  onSplitClip,
  onDuplicateClip,
  onDetachAudio,
  onRippleDeleteClip,
  onDeleteClip,
  onExportAudio,
  onClose,
}: TimelineContextMenuProps) {
  const clip = clips.find((c) => c.id === clipId)
  const track = clip ? tracks.find((t) => t.id === clip.trackId) : null
  const canDetachAudio = clip && !clip.isAudioDetached && track?.type === "video"
  const isAudioTrack = track?.type === "audio"

  const selectedAudioClipIds = selectedClipIds.filter((id) => {
    const c = clips.find((clip) => clip.id === id)
    if (!c) return false
    const t = tracks.find((track) => track.id === c.trackId)
    return t?.type === "audio"
  })

  // Include current clip if it's an audio clip and not already selected
  const audioClipsToExport =
    isAudioTrack && !selectedAudioClipIds.includes(clipId)
      ? [...selectedAudioClipIds, clipId]
      : selectedAudioClipIds.length > 0
        ? selectedAudioClipIds
        : isAudioTrack
          ? [clipId]
          : []

  const hasMultipleAudioClips = audioClipsToExport.length > 1

  return (
    <div
      className="fixed z-[100] bg-[var(--surface-2)] border border-neutral-700 rounded-lg shadow-2xl py-1 w-48 animate-in fade-in zoom-in-95 duration-75"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-1.5 border-b border-[var(--border-default)] text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
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

      {audioClipsToExport.length > 0 && onExportAudio && (
        <button
          onClick={() => {
            onExportAudio(audioClipsToExport)
            onClose()
          }}
          className="w-full px-3 py-1.5 text-left text-xs text-neutral-200 hover:bg-neutral-800 flex items-center gap-2"
        >
          <DownloadIcon className="w-3.5 h-3.5 text-neutral-500" />
          {hasMultipleAudioClips ? `Export ${audioClipsToExport.length} Audio Clips` : "Export Audio"}
        </button>
      )}

      <div className="h-px bg-[var(--border-default)] my-1" />

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
