"use client"

import { memo } from "react"
import type { VideoConfig } from "../../types"
import { PanelLeftClose, Sparkles, SettingsIcon } from "../icons"

interface StoryboardHeaderProps {
  onClose: () => void
  masterDescription: string
  setMasterDescription: (desc: string) => void
  isEnhancingMaster: boolean
  onEnhanceMaster: () => void
  videoConfig: VideoConfig
  setVideoConfig: (config: VideoConfig) => void
}

export const StoryboardHeader = memo<StoryboardHeaderProps>(
  ({
    onClose,
    masterDescription,
    setMasterDescription,
    isEnhancingMaster,
    onEnhanceMaster,
    videoConfig,
    setVideoConfig,
  }) => {
    return (
      <>
        {/* Header */}
        <div className="h-14 flex items-center px-4 justify-between shrink-0 border-b border-[var(--border-default)] bg-[var(--surface-0)] z-10">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Storyboard</h2>
          <div
            className="p-1.5 rounded hover:bg-neutral-800 cursor-pointer text-neutral-500 transition-colors"
            onClick={onClose}
          >
            <PanelLeftClose className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 flex flex-col gap-6">
          {/* Master Context */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Master Context</label>
              <button
                onClick={onEnhanceMaster}
                disabled={isEnhancingMaster || !masterDescription.trim()}
                className="flex items-center gap-1 text-[10px] text-[var(--accent-text)] hover:text-[var(--accent-primary)] disabled:opacity-30 transition-colors"
              >
                {isEnhancingMaster ? (
                  <div className="animate-spin w-3 h-3 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                Enhance
              </button>
            </div>
            <textarea
              value={masterDescription}
              onChange={(e) => setMasterDescription(e.target.value)}
              placeholder="Describe the overall story, style, and atmosphere..."
              className="w-full bg-[var(--surface-1)] border border-[var(--border-default)] rounded p-2 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-[var(--accent-muted)] min-h-[60px] resize-y"
            />
          </div>

          {/* Global Settings */}
          <div className="flex flex-col gap-2 bg-[var(--surface-1)] p-3 rounded-lg border border-[var(--border-default)]">
            <div className="flex items-center gap-2 mb-2 text-neutral-400">
              <SettingsIcon className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Video Settings</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-neutral-500">Aspect Ratio</span>
                <div className="flex gap-1 bg-black/20 rounded p-0.5">
                  {["16:9", "9:16"].map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setVideoConfig({ ...videoConfig, aspectRatio: ratio as "16:9" | "9:16" })}
                      className={`flex-1 py-1 text-[9px] rounded ${
                        videoConfig.aspectRatio === ratio
                          ? "bg-neutral-700 text-white"
                          : "text-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-neutral-500">Model Quality</span>
                <div className="flex gap-1 bg-black/20 rounded p-0.5">
                  <button
                    onClick={() => setVideoConfig({ ...videoConfig, useFastModel: true })}
                    className={`flex-1 py-1 text-[9px] rounded ${
                      videoConfig.useFastModel
                        ? "bg-[var(--accent-primary)] text-accent-text-white"
                        : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    Fast
                  </button>
                  <button
                    onClick={() => setVideoConfig({ ...videoConfig, useFastModel: false })}
                    className={`flex-1 py-1 text-[9px] rounded ${
                      !videoConfig.useFastModel
                        ? "bg-[var(--accent-secondary)] text-white"
                        : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    High
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  },
)

StoryboardHeader.displayName = "StoryboardHeader"
