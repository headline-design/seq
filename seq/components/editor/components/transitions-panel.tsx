"use client"

import type React from "react"
import { memo, useState, useCallback, useEffect } from "react"
import type { TimelineClip, TransitionType } from "../types"
import { CrossDissolveIcon, TransitionIcon } from "./icons"
import { PanelContainer, PanelHeader, PanelContent } from "./panel-primitives"

interface TransitionsPanelProps {
  onClose: () => void
  onApplyTransition: (type: TransitionType, duration?: number) => void
  onUpdateClip?: (clipId: string, updates: Partial<TimelineClip>) => void
  clips: TimelineClip[]
  selectedClipIds: string[]
  selectedClipId?: string | null
  currentTransition?: { type: TransitionType; duration: number } | null
}

interface TransitionDef {
  type: TransitionType
  label: string
  description: string
  icon: React.ReactNode
  preview: React.ReactNode
}

const TRANSITIONS: TransitionDef[] = [
  {
    type: "cross-dissolve",
    label: "Cross Dissolve",
    description: "Smoothly blend between clips",
    icon: <CrossDissolveIcon className="w-5 h-5" />,
    preview: <CrossDissolvePreview />,
  },
  {
    type: "fade-black",
    label: "Dip to Black",
    description: "Fade through black",
    icon: <div className="w-5 h-5 bg-black rounded border border-neutral-700" />,
    preview: <DipToBlackPreview />,
  },
  {
    type: "fade-white",
    label: "Dip to White",
    description: "Fade through white",
    icon: <div className="w-5 h-5 bg-white rounded" />,
    preview: <DipToWhitePreview />,
  },
  {
    type: "wipe-left",
    label: "Wipe Left",
    description: "Reveal clip from right to left",
    icon: <TransitionIcon className="w-5 h-5 rotate-180" />,
    preview: <WipePreview direction="left" />,
  },
  {
    type: "wipe-right",
    label: "Wipe Right",
    description: "Reveal clip from left to right",
    icon: <TransitionIcon className="w-5 h-5" />,
    preview: <WipePreview direction="right" />,
  },
]

function CrossDissolvePreview() {
  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 bg-[var(--accent-primary)] animate-pulse" />
      <div
        className="absolute inset-0 bg-[var(--accent-secondary)] animate-[pulse_2s_ease-in-out_infinite_0.5s]"
        style={{ mixBlendMode: "overlay" }}
      />
    </div>
  )
}

function DipToBlackPreview() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0 bg-[var(--accent-primary)]" />
      <div className="absolute inset-0 bg-black animate-[fadeInOut_2s_ease-in-out_infinite]" />
    </div>
  )
}

function DipToWhitePreview() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0 bg-[var(--accent-primary)]" />
      <div className="absolute inset-0 bg-white animate-[fadeInOut_2s_ease-in-out_infinite]" />
    </div>
  )
}

function WipePreview({ direction }: { direction: "left" | "right" }) {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0 bg-[var(--accent-primary)]" />
      <div
        className={`absolute inset-0 bg-[var(--accent-secondary)] ${
          direction === "left"
            ? "animate-[wipeLeft_2s_ease-in-out_infinite]"
            : "animate-[wipeRight_2s_ease-in-out_infinite]"
        }`}
        style={{
          clipPath: direction === "left" ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)",
        }}
      />
    </div>
  )
}

const TransitionCard = memo(function TransitionCard({
  transition,
  isSelected,
  isDisabled,
  onSelect,
}: {
  transition: TransitionDef
  isSelected: boolean
  isDisabled: boolean
  onSelect: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`relative rounded-lg border transition-all cursor-pointer overflow-hidden ${
        isDisabled
          ? "opacity-40 cursor-not-allowed border-[var(--border-default)]"
          : isSelected
            ? "border-[var(--accent-primary)] bg-[var(--accent-bg-subtle)] ring-1 ring-[var(--accent-ring)]"
            : "border-[var(--border-default)] hover:border-[var(--border-strong)] hover:bg-[var(--hover-overlay)]"
      }`}
      onClick={() => !isDisabled && onSelect()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Preview Area */}
      <div className="aspect-video bg-neutral-900 relative overflow-hidden">
        {isHovered && !isDisabled ? (
          transition.preview
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-neutral-600">{transition.icon}</div>
          </div>
        )}
        {isSelected && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </div>

      {/* Label */}
      <div className="p-2.5">
        <h4 className={`text-xs font-medium ${isSelected ? "text-[var(--accent-text)]" : "text-neutral-300"}`}>
          {transition.label}
        </h4>
        <p className="text-[10px] text-neutral-500 mt-0.5">{transition.description}</p>
      </div>
    </div>
  )
})

const DurationSlider = memo(function DurationSlider({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  const presets = [0.5, 1, 1.5, 2, 3]

  return (
    <div className="flex flex-col gap-3 p-4 bg-[var(--hover-overlay)] rounded-lg border border-[var(--border-default)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-400">Duration</span>
        <span className="text-sm font-mono text-[var(--accent-text)]">{value.toFixed(1)}s</span>
      </div>

      <input
        type="range"
        min="0.1"
        max="5"
        step="0.1"
        value={value}
        onChange={(e) => onChange(Number.parseFloat(e.target.value))}
        className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[var(--accent-primary)] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-[var(--accent-shadow)]"
      />

      <div className="flex gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
              value === preset
                ? "bg-[var(--accent-primary)] text-accent-text-white"
                : "bg-[var(--hover-overlay)] text-neutral-400 hover:bg-[var(--active-overlay)] hover:text-accent-text-white"
            }`}
          >
            {preset}s
          </button>
        ))}
      </div>
    </div>
  )
})

export const TransitionsPanel = memo(function TransitionsPanel({
  onClose,
  onApplyTransition,
  onUpdateClip,
  clips,
  selectedClipIds,
  selectedClipId,
  currentTransition,
}: TransitionsPanelProps) {
  const [selectedType, setSelectedType] = useState<TransitionType | null>(currentTransition?.type || null)
  const [duration, setDuration] = useState(currentTransition?.duration || 1)

  // Sync with prop changes
  useEffect(() => {
    if (currentTransition) {
      setSelectedType(currentTransition.type)
      setDuration(currentTransition.duration)
    } else {
      setSelectedType(null)
    }
  }, [currentTransition])

  const handleApply = useCallback(() => {
    if (selectedType && selectedClipId) {
      onApplyTransition(selectedType, duration)
    }
  }, [selectedType, duration, selectedClipId, onApplyTransition])

  const handleRemove = useCallback(() => {
    if (selectedClipId) {
      onApplyTransition("none")
      setSelectedType(null)
    }
  }, [selectedClipId, onApplyTransition])

  return (
    <PanelContainer>
      <PanelHeader title="Transitions" onClose={onClose} />

      <PanelContent className="p-0">
        <div className="p-4 flex flex-col gap-4">
          {/* Warning if no clip selected */}
          {!selectedClipId && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-200/70 text-xs flex items-start gap-2">
              <svg
                className="w-4 h-4 shrink-0 mt-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Select a clip on the timeline to apply transitions.</span>
            </div>
          )}

          {/* Transition Grid */}
          <div className="grid grid-cols-2 gap-3">
            {TRANSITIONS.map((trans) => (
              <TransitionCard
                key={trans.type}
                transition={trans}
                isSelected={selectedType === trans.type}
                isDisabled={!selectedClipId}
                onSelect={() => setSelectedType(trans.type)}
              />
            ))}
          </div>

          {/* Duration Control */}
          {selectedType && selectedType !== "none" && selectedClipId && (
            <DurationSlider value={duration} onChange={setDuration} />
          )}

          {/* Apply/Remove Buttons */}
          {selectedClipId && (
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleApply}
                disabled={!selectedType || selectedType === "none"}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
                  selectedType && selectedType !== "none"
                    ? "bg-[var(--accent-primary)] text-accent-text-white hover:bg-[var(--accent-hover)]"
                    : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                }`}
              >
                Apply Transition
              </button>

              {currentTransition && currentTransition.type !== "none" && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="w-full py-2.5 rounded-lg text-sm font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
                >
                  Remove Transition
                </button>
              )}
            </div>
          )}
        </div>
      </PanelContent>

      {/* Custom keyframes for animations */}
      <style jsx global>{`
        @keyframes fadeInOut {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        @keyframes wipeLeft {
          0%, 100% { clip-path: inset(0 0 0 100%); }
          50% { clip-path: inset(0 0 0 0); }
        }
        @keyframes wipeRight {
          0%, 100% { clip-path: inset(0 100% 0 0); }
          50% { clip-path: inset(0 0 0 0); }
        }
      `}</style>
    </PanelContainer>
  )
})

TransitionsPanel.displayName = "TransitionsPanel"
