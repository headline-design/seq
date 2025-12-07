"use client"

import { memo } from "react"
import type { Track } from "../types"
import { MusicIcon, VolumeIcon, LockIcon, UnlockIcon, MuteIcon, PlusIcon } from "./icons"

interface TimelineTrackHeadersProps {
  tracks: Track[]
  onTrackUpdate: (trackId: string, changes: Partial<Track>) => void
  onAddTrack?: (type: "video" | "audio") => void
}

export const TimelineTrackHeaders = memo(function TimelineTrackHeaders({
  tracks,
  onTrackUpdate,
  onAddTrack,
}: TimelineTrackHeadersProps) {
  return (
    <>
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
                  className={`w-full h-full flex flex-col items-center justify-center px-2 gap-1 transition-opacity ${
                    track.isMuted ? "opacity-30" : "opacity-100"
                  }`}
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
                    <div key={i} className="w-1 bg-neutral-500" style={{ height: `${Math.random() * 100}%` }} />
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

      {/* Spacer */}
      <div className="h-20 shrink-0" />
    </>
  )
})
