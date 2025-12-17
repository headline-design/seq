"use client"

import { memo } from "react"
import type { StoryboardPanel as IStoryboardPanel } from "../../types"
import { PlusIcon, FilmIcon, ImageIcon } from "../icons"

interface StoryboardBatchActionsProps {
  panels: IStoryboardPanel[]
  isAnyGenerating: boolean
  isGeneratingAll: "images" | "videos" | null
  onGenerateAllImages: () => void
  onGenerateAllVideos: () => void
  onAddAllToTimeline: () => void
}

export const StoryboardBatchActions = memo<StoryboardBatchActionsProps>(
  ({ panels, isAnyGenerating, isGeneratingAll, onGenerateAllImages, onGenerateAllVideos, onAddAllToTimeline }) => {
    const panelsWithVideos = panels.filter((p) => p.videoUrl)
    const panelsNeedingImages = panels.filter((p) => !p.imageUrl && p.prompt && p.status === "idle")
    const panelsNeedingVideos = panels.filter((p) => p.imageUrl && !p.videoUrl && p.prompt && p.status === "idle")
    const hasAnyVideos = panelsWithVideos.length > 0

    if (panels.length === 0) return null

    return (
      <div className="flex flex-col gap-2 px-4">
        <div className="grid grid-cols-2 gap-2">
          {panelsNeedingImages.length > 0 && (
            <button
              onClick={onGenerateAllImages}
              disabled={isAnyGenerating || isGeneratingAll !== null}
              className="py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-emerald-600/30 disabled:opacity-50"
            >
              {isGeneratingAll === "images" ? (
                <div className="animate-spin w-3 h-3 border-2 border-neutral-600 border-t-neutral-400 rounded-full" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5" />
              )}
              Gen All Images ({panelsNeedingImages.length})
            </button>
          )}
          {panelsNeedingVideos.length > 0 && (
            <button
              onClick={onGenerateAllVideos}
              disabled={isAnyGenerating || isGeneratingAll !== null}
              className="py-2 rounded-lg bg-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/30 text-[var(--accent-text)] text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-[var(--accent-border)] disabled:opacity-50"
            >
              {isGeneratingAll === "videos" ? (
                <div className="animate-spin w-3 h-3 border-2 border-[var(--accent-text)] border-t-transparent rounded-full" />
              ) : (
                <FilmIcon className="w-3.5 h-3.5" />
              )}
              Gen All Videos ({panelsNeedingVideos.length})
            </button>
          )}
        </div>

        {hasAnyVideos && (
          <button
            onClick={onAddAllToTimeline}
            className="w-full py-2.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-accent-text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add All to Timeline ({panelsWithVideos.length} clip{panelsWithVideos.length !== 1 ? "s" : ""})
          </button>
        )}
      </div>
    )
  },
)

StoryboardBatchActions.displayName = "StoryboardBatchActions"
