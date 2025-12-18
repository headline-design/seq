"use client"

import { memo, useState, useCallback } from "react"
import type { TimelineClip, MediaItem, Track } from "../types"
import { FilmIcon, MusicIcon, InfoIcon, VolumeIcon, PlayIcon, PauseIcon, TypeIcon, LockIcon, UnlockIcon } from "./icons"
import { Scissors, RotateCcw, Copy, Trash2, Zap, Palette } from "lucide-react"
import { EffectsPanel } from "./effects-panel"
import { TextEditorPanel } from "./text-editor-panel"
import {
  PanelContainer,
  PanelHeader,
  PanelContent,
  PanelSection,
  PanelDivider,
  ActionButton,
  InfoCard,
  InfoRow,
} from "./panel-primitives"

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

export const InspectorPanel = memo(function InspectorPanel({
  onClose,
  selectedClipId,
  clips,
  mediaMap,
  tracks,
  onUpdateClip,
  onDeleteClip,
  onDuplicateClip,
  onSplitClip,
}: InspectorPanelProps) {
  const clip = clips.find((c) => c.id === selectedClipId)
  const media = clip ? mediaMap[clip.mediaId] : null
  const track = clip ? tracks.find((t) => t.id === clip.trackId) : null
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const [activeTab, setActiveTab] = useState<"properties" | "effects">("properties")

  const isTextClip = track?.type === "text" && clip?.textOverlay

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
      const defaults = [0, 0, 0, 0, 0, 100]
      return v !== defaults[i]
    })

  return (
    <PanelContainer>
      <PanelHeader title="Inspector" onClose={onClose} />

      {clip && media && media.type === "video" && !isTextClip && (
        <div className="flex border-b border-[var(--border-default)]">
          <button
            onClick={() => setActiveTab("properties")}
            className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              activeTab === "properties"
                ? "text-white border-b-2 border-[var(--tertiary)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            }`}
          >
            Properties
          </button>
          <button
            onClick={() => setActiveTab("effects")}
            className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === "effects"
                ? "text-white border-b-2 border-[var(--tertiary)]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            }`}
          >
            <Palette className="w-3 h-3" />
            Effects
            {hasEffects && <span className="w-1.5 h-1.5 rounded-full bg-[var(--tertiary)]"></span>}
          </button>
        </div>
      )}

      <PanelContent>
        {!clip ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 opacity-50">
            <InfoIcon className="w-8 h-8 text-[var(--text-muted)]" />
            <p className="text-xs text-[var(--text-tertiary)]">Select a clip to view properties</p>
          </div>
        ) : isTextClip ? (
          <>
            {/* Text Clip Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-default)]">
              <div className="w-10 h-10 rounded-lg bg-[var(--tertiary-muted)] flex items-center justify-center">
                <TypeIcon className="w-5 h-5 text-[var(--tertiary)]" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Text Overlay</h3>
                <span className="text-[10px] text-[var(--text-tertiary)] font-mono">{clip.id}</span>
              </div>
            </div>

            {/* Text Editor Panel */}
            <TextEditorPanel clip={clip} onUpdateClip={onUpdateClip} />

            {/* Quick Actions for Text */}
            <PanelDivider />
            <PanelSection title="Quick Actions">
              <div className="grid grid-cols-3 gap-2">
                <ActionButton
                  icon={<Copy className="w-4 h-4" />}
                  label="Duplicate"
                  onClick={() => onDuplicateClip?.(clip.id)}
                  disabled={!onDuplicateClip}
                />
                <ActionButton
                  icon={<RotateCcw className="w-4 h-4" />}
                  label="Reset"
                  onClick={() =>
                    onUpdateClip(clip.id, {
                      textOverlay: {
                        ...clip.textOverlay!,
                        fontSize: 48,
                        fontWeight: 600,
                        color: "#ffffff",
                        backgroundColor: "#000000",
                        backgroundOpacity: 0,
                        position: { x: 50, y: 50 },
                        animation: "none",
                      },
                    })
                  }
                />
                <ActionButton
                  icon={<Trash2 className="w-4 h-4" />}
                  label="Delete"
                  onClick={() => onDeleteClip?.(clip.id)}
                  variant="danger"
                  disabled={!onDeleteClip}
                />
              </div>
            </PanelSection>

            {/* Timing for Text */}
            <PanelDivider />
            <PanelSection title="Timing">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[var(--text-muted)] uppercase">Start</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={clip.start.toFixed(2)}
                      onChange={(e) => onUpdateClip(clip.id, { start: Number(e.target.value) })}
                      min={0}
                      step={0.01}
                      className="w-full p-2 pr-6 bg-[var(--surface-0)] rounded border border-[var(--border-default)] text-xs font-mono text-[var(--text-secondary)] focus:outline-none focus:border-[var(--tertiary)]/50 focus:ring-1 focus:ring-[var(--focus-ring)]"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)]">
                      s
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[var(--text-muted)] uppercase">Duration</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={clip.duration.toFixed(2)}
                      onChange={(e) => onUpdateClip(clip.id, { duration: Number(e.target.value) })}
                      min={0.1}
                      step={0.01}
                      className="w-full p-2 pr-6 bg-[var(--surface-0)] rounded border border-[var(--border-default)] text-xs font-mono text-[var(--text-secondary)] focus:outline-none focus:border-[var(--tertiary)]/50 focus:ring-1 focus:ring-[var(--focus-ring)]"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)]">
                      s
                    </span>
                  </div>
                </div>
              </div>
            </PanelSection>
          </>
        ) : !media ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 opacity-50">
            <InfoIcon className="w-8 h-8 text-[var(--text-muted)]" />
            <p className="text-xs text-[var(--text-tertiary)]">Media not found</p>
          </div>
        ) : activeTab === "effects" && media.type === "video" ? (
          <EffectsPanel clip={clip} onUpdateClip={onUpdateClip} />
        ) : (
          <>
            {/* Media Identity with Preview */}
            <div className="flex flex-col gap-3">
              <div className="relative aspect-video bg-black rounded-lg border border-[var(--border-default)] overflow-hidden group">
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
                    <MusicIcon className="w-12 h-12 text-[var(--text-muted)]" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate" title={media.prompt}>
                  {media.prompt || "Untitled Clip"}
                </h3>
                <span className="text-[10px] text-[var(--text-tertiary)] font-mono">{clip.id}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <PanelSection title="Quick Actions">
              <div className="grid grid-cols-5 gap-2">
                <ActionButton
                  icon={<Scissors className="w-4 h-4" />}
                  label="Split"
                  onClick={() => onSplitClip?.(clip.id, clip.start + clip.duration / 2)}
                  disabled={!onSplitClip || clip.isLocked}
                />
                <ActionButton
                  icon={<Copy className="w-4 h-4" />}
                  label="Duplicate"
                  onClick={() => onDuplicateClip?.(clip.id)}
                  disabled={!onDuplicateClip}
                />
                <ActionButton
                  icon={clip.isLocked ? <UnlockIcon className="w-4 h-4" /> : <LockIcon className="w-4 h-4" />}
                  label={clip.isLocked ? "Unlock" : "Lock"}
                  onClick={() => onUpdateClip(clip.id, { isLocked: !clip.isLocked })}
                />
                <ActionButton
                  icon={<RotateCcw className="w-4 h-4" />}
                  label="Reset"
                  onClick={() =>
                    onUpdateClip(clip.id, {
                      volume: 1,
                      speed: 1,
                      offset: 0,
                      effects: undefined,
                      fadeIn: 0,
                      fadeOut: 0,
                    })
                  }
                  disabled={clip.isLocked}
                />
                <ActionButton
                  icon={<Trash2 className="w-4 h-4" />}
                  label="Delete"
                  onClick={() => onDeleteClip?.(clip.id)}
                  variant="danger"
                  disabled={!onDeleteClip || clip.isLocked}
                />
              </div>
            </PanelSection>

            <PanelDivider />

            {/* Speed Control */}
            <PanelSection
              title="Speed"
              badge={
                clip.speed !== 1 ? (
                  <span className="px-1.5 py-0.5 bg-[var(--tertiary-muted)] text-[var(--tertiary)] text-[9px] font-bold rounded">
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
                        ? "bg-[var(--tertiary)] text-white"
                        : "bg-[var(--hover-overlay)] text-[var(--text-tertiary)] hover:bg-[var(--active-overlay)] hover:text-white"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Zap className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                <input
                  type="range"
                  min="0.1"
                  max="4"
                  step="0.1"
                  value={clip.speed ?? 1}
                  onChange={(e) => handleSpeedChange(Number.parseFloat(e.target.value))}
                  className="flex-1 h-1 bg-[var(--surface-4)] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[var(--tertiary)] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
                />
                <span className="text-xs font-mono text-[var(--text-secondary)] w-10 text-right">
                  {(clip.speed ?? 1).toFixed(1)}x
                </span>
              </div>
            </PanelSection>

            <PanelDivider />

            {/* Audio */}
            <PanelSection title="Audio">
              <InfoCard className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <VolumeIcon className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    <span>Volume</span>
                  </div>
                  <span className="font-mono text-[var(--text-secondary)]">
                    {Math.round((clip.volume ?? 1) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={clip.volume ?? 1}
                  onChange={(e) => onUpdateClip(clip.id, { volume: Number.parseFloat(e.target.value) })}
                  className="w-full h-1 bg-[var(--surface-4)] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
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
                          : "bg-[var(--hover-overlay)] text-[var(--text-tertiary)] hover:bg-[var(--active-overlay)] hover:text-white"
                      }`}
                    >
                      {vol === 0 ? "Mute" : `${Math.round(vol * 100)}%`}
                    </button>
                  ))}
                </div>

                {/* Fade In/Out Controls */}
                <div className="pt-2 border-t border-[var(--border-default)] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-tertiary)]">Fade In</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max={Math.min(clip.duration / 2, 3)}
                        step="0.1"
                        value={clip.fadeIn ?? 0}
                        onChange={(e) => onUpdateClip(clip.id, { fadeIn: Number.parseFloat(e.target.value) })}
                        className="w-20 h-1 bg-[var(--surface-4)] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                      />
                      <span className="text-[10px] font-mono text-[var(--text-secondary)] w-8">
                        {(clip.fadeIn ?? 0).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-tertiary)]">Fade Out</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max={Math.min(clip.duration / 2, 3)}
                        step="0.1"
                        value={clip.fadeOut ?? 0}
                        onChange={(e) => onUpdateClip(clip.id, { fadeOut: Number.parseFloat(e.target.value) })}
                        className="w-20 h-1 bg-[var(--surface-4)] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                      />
                      <span className="text-[10px] font-mono text-[var(--text-secondary)] w-8">
                        {(clip.fadeOut ?? 0).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[0, 0.5, 1, 2].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => onUpdateClip(clip.id, { fadeIn: val, fadeOut: val })}
                        className={`flex-1 py-1 rounded text-[9px] font-medium transition-all ${
                          (clip.fadeIn ?? 0) === val && (clip.fadeOut ?? 0) === val
                            ? "bg-white text-black"
                            : "bg-[var(--hover-overlay)] text-[var(--text-tertiary)] hover:bg-[var(--active-overlay)] hover:text-white"
                        }`}
                      >
                        {val === 0 ? "None" : `${val}s`}
                      </button>
                    ))}
                  </div>
                </div>
              </InfoCard>
            </PanelSection>

            <PanelDivider />

            {/* Track & Media Info */}
            <PanelSection title="Info" defaultOpen={false}>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[var(--text-muted)] uppercase">Track</label>
                  <div className="p-2 bg-[var(--surface-2)] rounded border border-[var(--border-default)] text-xs text-[var(--text-secondary)]">
                    {track?.name || clip.trackId}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-[var(--text-muted)] uppercase">Type</label>
                  <div className="p-2 bg-[var(--surface-2)] rounded border border-[var(--border-default)] text-xs text-[var(--text-secondary)] flex items-center gap-2">
                    {media.type === "video" ? (
                      <FilmIcon className="w-3 h-3 text-[var(--tertiary)]" />
                    ) : (
                      <MusicIcon className="w-3 h-3 text-[var(--success)]" />
                    )}
                    <span className="capitalize">{media.type}</span>
                  </div>
                </div>
              </div>
              {media.type === "video" && media.resolution && (
                <InfoCard className="space-y-2 mt-1">
                  <InfoRow label="Resolution" value={`${media.resolution.width} x ${media.resolution.height}`} />
                  <InfoRow label="Aspect" value={media.aspectRatio} />
                  <InfoRow label="Source Length" value={`${media.duration.toFixed(2)}s`} />
                </InfoCard>
              )}
            </PanelSection>

            {/* Transition Info */}
            {clip.transition && clip.transition.type !== "none" && (
              <>
                <PanelDivider />
                <PanelSection title="Transition">
                  <div className="bg-[var(--tertiary-muted)] rounded-lg border border-[var(--tertiary)]/30 p-3 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-[var(--tertiary)] capitalize">
                        {clip.transition.type.replace("-", " ")}
                      </span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">Applied to this clip</span>
                    </div>
                    <div className="text-xs font-mono text-[var(--tertiary)]">{clip.transition.duration}s</div>
                  </div>
                </PanelSection>
              </>
            )}
          </>
        )}
      </PanelContent>
    </PanelContainer>
  )
})

InspectorPanel.displayName = "InspectorPanel"
