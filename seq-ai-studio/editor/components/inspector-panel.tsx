"use client"

import type React from "react"

import { memo, useState, useCallback } from "react"
import type { TimelineClip, MediaItem, Track } from "../types"
import { FilmIcon, MusicIcon, InfoIcon, PanelLeftClose, VolumeIcon, PlayIcon, PauseIcon } from "./icons"
import { Scissors, RotateCcw, Copy, Trash2, Zap, Palette } from "lucide-react"
import { EffectsPanel } from "./effects-panel"

interface InspectorPanelProps {
  onClose: () => void
  selectedClipId: string | null
  clips: TimelineClip[]
  mediaMap: Record<string, MediaItem>
  tracks: Track[]
  onUpdateClip: (id: string, changes: Partial<TimelineClip>) => void
  onDeleteClip?: (id: string) => void
  onDuplicateClip?: (id: string) => void
  onSplitClip?: (id: string, time: number) => void
}

const Section = memo(function Section({
  title,
  defaultOpen = true,
  children,
  badge,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  badge?: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="flex flex-col">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between py-2 group">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-neutral-500 group-hover:text-neutral-400 transition-colors">
            {title}
          </span>
          {badge}
        </div>
        <svg
          className={`w-3 h-3 text-neutral-600 transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {isOpen && <div className="flex flex-col gap-3 pb-3">{children}</div>}
    </div>
  )
})

const QuickAction = memo(function QuickAction({
  icon,
  label,
  onClick,
  variant = "default",
  disabled = false,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant?: "default" | "danger"
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border transition-all ${
        disabled
          ? "opacity-40 cursor-not-allowed border-neutral-800 bg-neutral-900/50"
          : variant === "danger"
            ? "border-neutral-800 hover:border-red-500/30 hover:bg-red-500/10 text-neutral-400 hover:text-red-400"
            : "border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/50 text-neutral-400 hover:text-white"
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
})

const NumericInput = memo(function NumericInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.01,
  unit = "s",
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] text-neutral-600 uppercase">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value.toFixed(2)}
          onChange={(e) => {
            const val = Number.parseFloat(e.target.value)
            if (!isNaN(val)) {
              const clamped = Math.max(min ?? Number.NEGATIVE_INFINITY, Math.min(max ?? Number.POSITIVE_INFINITY, val))
              onChange(clamped)
            }
          }}
          min={min}
          max={max}
          step={step}
          className="w-full p-2 pr-6 bg-[#18181b] rounded border border-neutral-800 text-xs font-mono text-neutral-300 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-neutral-600">{unit}</span>
      </div>
    </div>
  )
})

export const InspectorPanel = memo<InspectorPanelProps>(
  ({ onClose, selectedClipId, clips, mediaMap, tracks, onUpdateClip, onDeleteClip, onDuplicateClip, onSplitClip }) => {
    const clip = clips.find((c) => c.id === selectedClipId)
    const media = clip ? mediaMap[clip.mediaId] : null
    const track = clip ? tracks.find((t) => t.id === clip.trackId) : null
    const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
    const [activeTab, setActiveTab] = useState<"properties" | "effects">("properties")

    const speedPresets = [0.25, 0.5, 1, 1.5, 2, 4]

    const handleSpeedChange = useCallback(
      (speed: number) => {
        if (clip) {
          onUpdateClip(clip.id, { speed })
        }
      },
      [clip, onUpdateClip],
    )

    const hasEffects =
      clip?.effects &&
      Object.values(clip.effects).some((v, i) => {
        const defaults = [0, 0, 0, 0, 0, 100] // brightness, contrast, saturation, hue, blur, opacity
        return v !== defaults[i]
      })

    return (
      <div className="w-full flex flex-col bg-[#09090b] border-r border-neutral-800 h-full">
        {/* Header */}
        <div className="h-14 flex items-center px-4 justify-between shrink-0 border-b border-neutral-800">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Inspector</h2>
          <div
            className="p-1.5 rounded hover:bg-neutral-800 cursor-pointer text-neutral-500 transition-colors"
            onClick={onClose}
          >
            <PanelLeftClose className="w-4 h-4" />
          </div>
        </div>

        {clip && media && media.type === "video" && (
          <div className="flex border-b border-neutral-800">
            <button
              onClick={() => setActiveTab("properties")}
              className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                activeTab === "properties"
                  ? "text-white border-b-2 border-indigo-500"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Properties
            </button>
            <button
              onClick={() => setActiveTab("effects")}
              className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === "effects"
                  ? "text-white border-b-2 border-indigo-500"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <Palette className="w-3 h-3" />
              Effects
              {hasEffects && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>}
            </button>
          </div>
        )}

        <div className="p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
          {!clip || !media ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 opacity-50">
              <InfoIcon className="w-8 h-8 text-neutral-600" />
              <p className="text-xs text-neutral-500">Select a clip to view properties</p>
            </div>
          ) : activeTab === "effects" && media.type === "video" ? (
            <EffectsPanel clip={clip} onUpdateClip={onUpdateClip} />
          ) : (
            <>
              {/* Media Identity with Preview */}
              <div className="flex flex-col gap-3">
                <div className="relative aspect-video bg-black rounded-lg border border-neutral-800 overflow-hidden group">
                  {media.type === "video" ? (
                    <>
                      <video
                        src={media.url}
                        className="w-full h-full object-contain"
                        loop
                        muted
                        playsInline
                        ref={(el) => {
                          if (el) {
                            if (isPreviewPlaying) el.play()
                            else el.pause()
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setIsPreviewPlaying(!isPreviewPlaying)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {isPreviewPlaying ? (
                          <PauseIcon className="w-10 h-10 text-white/80" />
                        ) : (
                          <PlayIcon className="w-10 h-10 text-white/80" />
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MusicIcon className="w-12 h-12 text-neutral-600" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-semibold text-neutral-200 truncate" title={media.prompt}>
                    {media.prompt || "Untitled Clip"}
                  </h3>
                  <span className="text-[10px] text-neutral-500 font-mono">{clip.id}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <Section title="Quick Actions">
                <div className="grid grid-cols-4 gap-2">
                  <QuickAction
                    icon={<Scissors className="w-4 h-4" />}
                    label="Split"
                    onClick={() => onSplitClip?.(clip.id, clip.start + clip.duration / 2)}
                    disabled={!onSplitClip}
                  />
                  <QuickAction
                    icon={<Copy className="w-4 h-4" />}
                    label="Duplicate"
                    onClick={() => onDuplicateClip?.(clip.id)}
                    disabled={!onDuplicateClip}
                  />
                  <QuickAction
                    icon={<RotateCcw className="w-4 h-4" />}
                    label="Reset"
                    onClick={() =>
                      onUpdateClip(clip.id, {
                        volume: 1,
                        speed: 1,
                        offset: 0,
                        effects: undefined,
                      })
                    }
                  />
                  <QuickAction
                    icon={<Trash2 className="w-4 h-4" />}
                    label="Delete"
                    onClick={() => onDeleteClip?.(clip.id)}
                    variant="danger"
                    disabled={!onDeleteClip}
                  />
                </div>
              </Section>

              <div className="h-px bg-neutral-800" />

              {/* Speed Control */}
              <Section
                title="Speed"
                badge={
                  clip.speed !== 1 ? (
                    <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-[9px] font-bold rounded">
                      {clip.speed}x
                    </span>
                  ) : null
                }
              >
                <div className="flex flex-wrap gap-1.5">
                  {speedPresets.map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => handleSpeedChange(speed)}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                        (clip.speed ?? 1) === speed
                          ? "bg-indigo-500 text-white"
                          : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white"
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Zap className="w-3.5 h-3.5 text-neutral-500" />
                  <input
                    type="range"
                    min="0.1"
                    max="4"
                    step="0.1"
                    value={clip.speed ?? 1}
                    onChange={(e) => handleSpeedChange(Number.parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
                  />
                  <span className="text-xs font-mono text-neutral-400 w-10 text-right">
                    {(clip.speed ?? 1).toFixed(1)}x
                  </span>
                </div>
              </Section>

              <div className="h-px bg-neutral-800" />

              {/* Audio */}
              <Section title="Audio">
                <div className="bg-[#18181b] rounded-lg border border-neutral-800 p-3 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-neutral-300">
                      <VolumeIcon className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Volume</span>
                    </div>
                    <span className="font-mono text-neutral-400">{Math.round((clip.volume ?? 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={clip.volume ?? 1}
                    onChange={(e) => onUpdateClip(clip.id, { volume: Number.parseFloat(e.target.value) })}
                    className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                  />
                  <div className="flex gap-1.5">
                    {[0, 0.25, 0.5, 0.75, 1].map((vol) => (
                      <button
                        key={vol}
                        type="button"
                        onClick={() => onUpdateClip(clip.id, { volume: vol })}
                        className={`flex-1 py-1 rounded text-[10px] font-medium transition-all ${
                          (clip.volume ?? 1) === vol
                            ? "bg-white text-black"
                            : "bg-neutral-800 text-neutral-500 hover:bg-neutral-700 hover:text-white"
                        }`}
                      >
                        {vol === 0 ? "Mute" : `${Math.round(vol * 100)}%`}
                      </button>
                    ))}
                  </div>
                </div>
              </Section>

              <div className="h-px bg-neutral-800" />

              {/* Timing */}
              <Section title="Timing">
                <div className="grid grid-cols-2 gap-3">
                  <NumericInput
                    label="Start"
                    value={clip.start}
                    onChange={(val) => onUpdateClip(clip.id, { start: val })}
                    min={0}
                  />
                  <NumericInput
                    label="Duration"
                    value={clip.duration}
                    onChange={(val) => onUpdateClip(clip.id, { duration: val })}
                    min={0.1}
                  />
                  <NumericInput
                    label="Offset"
                    value={clip.offset}
                    onChange={(val) => onUpdateClip(clip.id, { offset: val })}
                    min={0}
                    max={media.duration}
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-neutral-600 uppercase">End</label>
                    <div className="p-2 bg-neutral-900/50 rounded border border-neutral-800/50 text-xs font-mono text-neutral-500">
                      {(clip.start + clip.duration).toFixed(2)}s
                    </div>
                  </div>
                </div>
              </Section>

              <div className="h-px bg-neutral-800" />

              {/* Track & Media Info */}
              <Section title="Info" defaultOpen={false}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-neutral-600 uppercase">Track</label>
                    <div className="p-2 bg-[#18181b] rounded border border-neutral-800 text-xs text-neutral-300">
                      {track?.name || clip.trackId}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-neutral-600 uppercase">Type</label>
                    <div className="p-2 bg-[#18181b] rounded border border-neutral-800 text-xs text-neutral-300 flex items-center gap-2">
                      {media.type === "video" ? (
                        <FilmIcon className="w-3 h-3 text-indigo-400" />
                      ) : (
                        <MusicIcon className="w-3 h-3 text-emerald-400" />
                      )}
                      <span className="capitalize">{media.type}</span>
                    </div>
                  </div>
                </div>
                {media.type === "video" && media.resolution && (
                  <div className="bg-[#18181b] rounded-lg border border-neutral-800 p-3 space-y-2 mt-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-500">Resolution</span>
                      <span className="text-neutral-300 font-mono">
                        {media.resolution.width} x {media.resolution.height}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-500">Aspect</span>
                      <span className="text-neutral-300 font-mono">{media.aspectRatio}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-500">Source Length</span>
                      <span className="text-neutral-300 font-mono">{media.duration.toFixed(2)}s</span>
                    </div>
                  </div>
                )}
              </Section>

              {/* Transition Info */}
              {clip.transition && clip.transition.type !== "none" && (
                <>
                  <div className="h-px bg-neutral-800" />
                  <Section title="Transition">
                    <div className="bg-indigo-900/10 rounded-lg border border-indigo-500/20 p-3 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-indigo-300 capitalize">
                          {clip.transition.type.replace("-", " ")}
                        </span>
                        <span className="text-[10px] text-neutral-500">Applied to this clip</span>
                      </div>
                      <div className="text-xs font-mono text-indigo-300/80">{clip.transition.duration}s</div>
                    </div>
                  </Section>
                </>
              )}
            </>
          )}
        </div>
      </div>
    )
  },
)

InspectorPanel.displayName = "InspectorPanel"
