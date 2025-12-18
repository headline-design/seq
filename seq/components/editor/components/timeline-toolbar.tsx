"use client"

import { TooltipTrigger } from "@/seq/components/ui/tooltip"

import { memo } from "react"
import type { SnapConfig } from "../hooks/use-timeline-snap"
import { getNextZoom, getPrevZoom } from "../utils/timeline-scale"
import {
  MagnetIcon,
  ScissorsIcon,
  SplitIcon,
  ChevronDownIcon,
  CheckIcon,
  ZoomInIcon,
  ZoomOutIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon,
  SkipBackIcon,
  SkipForwardIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LoopIcon,
  UndoIcon,
  RedoIcon,
  FlagIcon,
  MaximizeIcon,
} from "./icons"
import { Button } from "@/seq/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider } from "@/seq/components/ui/tooltip"

interface TimelineToolbarProps {
  currentTime: number
  duration: number
  isPlaying: boolean
  isLooping: boolean
  tool: "select" | "razor"
  zoomLevel: number
  selectedClipCount: number
  snapConfig: SnapConfig
  showSnapMenu: boolean
  isRendering?: boolean
  renderProgress?: number
  renderedPreviewUrl?: string | null
  isPreviewStale?: boolean
  isPreviewPlayback?: boolean
  frameRate?: number
  historyCount?: number
  futureCount?: number
  onUndo?: () => void
  onRedo?: () => void
  onShowShortcuts?: () => void
  onPlayPause: () => void
  onSeek: (time: number) => void
  onToggleLoop: () => void
  onToolChange: (tool: "select" | "razor") => void
  onSplitAtPlayhead: () => void
  onZoomChange: (zoom: number) => void
  onToggleSnap: () => void
  onToggleSnapOption: (key: keyof SnapConfig) => void
  onSetGridInterval: (interval: number) => void
  onSetShowSnapMenu: (show: boolean) => void
  onRenderPreview?: () => void
  onCancelRender?: () => void
  onTogglePreviewPlayback?: () => void
  onAddMarker?: () => void
  onZoomToFit?: () => void
}

export const TimelineToolbar = memo(function TimelineToolbar({
  currentTime,
  duration,
  isPlaying,
  isLooping,
  tool,
  zoomLevel,
  selectedClipCount,
  snapConfig,
  showSnapMenu,
  isRendering = false,
  renderProgress = 0,
  renderedPreviewUrl = null,
  isPreviewStale = false,
  isPreviewPlayback = false,
  frameRate = 30,
  historyCount = 0,
  futureCount = 0,
  onUndo,
  onRedo,
  onShowShortcuts,
  onPlayPause,
  onSeek,
  onToggleLoop,
  onToolChange,
  onSplitAtPlayhead,
  onZoomChange,
  onToggleSnap,
  onToggleSnapOption,
  onSetGridInterval,
  onSetShowSnapMenu,
  onRenderPreview,
  onCancelRender,
  onTogglePreviewPlayback,
  onAddMarker,
  onZoomToFit,
}: TimelineToolbarProps) {
  const frameDuration = 1 / frameRate

  const stepFrame = (direction: 1 | -1) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + frameDuration * direction))
    onSeek(newTime)
  }

  const jumpToStart = () => onSeek(0)
  const jumpToEnd = () => onSeek(duration)

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-11 border-b border-[var(--border-default)] flex items-center justify-between px-4 bg-[var(--surface-0)] shrink-0 z-30 overflow-x-auto min-w-0 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex items-center gap-3 shrink-0">
          {onUndo && onRedo && (
            <>
              <div className="flex items-center gap-0.5 bg-[var(--hover-overlay)] rounded-md p-0.5 border border-[var(--border-default)]">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-6 w-6 hover:bg-[var(--hover-overlay)] ${historyCount > 0 ? "text-[var(--text-primary)] hover:text-white" : "text-[var(--text-muted)] cursor-not-allowed"}`}
                      onClick={onUndo}
                      disabled={historyCount === 0}
                    >
                      <UndoIcon className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Undo (Ctrl+Z) {historyCount > 0 && `• ${historyCount}`}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-6 w-6 hover:bg-[var(--hover-overlay)] ${futureCount > 0 ? "text-[var(--text-primary)] hover:text-white" : "text-[var(--text-muted)] cursor-not-allowed"}`}
                      onClick={onRedo}
                      disabled={futureCount === 0}
                    >
                      <RedoIcon className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Redo (Ctrl+Shift+Z) {futureCount > 0 && `• ${futureCount}`}
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="h-4 w-px bg-[var(--border-default)]" />
            </>
          )}

          <div className="flex items-center gap-0.5 bg-[var(--hover-overlay)] rounded-md p-0.5 border border-[var(--border-default)]">
            {/* Jump to Start */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--hover-overlay)]"
                  onClick={jumpToStart}
                >
                  <SkipBackIcon className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Jump to Start (Home)
              </TooltipContent>
            </Tooltip>

            {/* Previous Frame */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--hover-overlay)]"
                  onClick={() => stepFrame(-1)}
                >
                  <ChevronLeftIcon className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Previous Frame (,)
              </TooltipContent>
            </Tooltip>

            {/* Play/Pause */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white hover:bg-[var(--accent-bg-subtle)] hover:text-[var(--accent-text)]"
                  onClick={onPlayPause}
                >
                  {isPlaying ? <PauseIcon className="h-3.5 w-3.5" /> : <PlayIcon className="h-3.5 w-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {isPlaying ? "Pause (Space/K)" : "Play (Space/K)"}
              </TooltipContent>
            </Tooltip>

            {/* Next Frame */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--hover-overlay)]"
                  onClick={() => stepFrame(1)}
                >
                  <ChevronRightIcon className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Next Frame (.)
              </TooltipContent>
            </Tooltip>

            {/* Jump to End */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--hover-overlay)]"
                  onClick={jumpToEnd}
                >
                  <SkipForwardIcon className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Jump to End (End)
              </TooltipContent>
            </Tooltip>

            <div className="w-px h-4 bg-[var(--border-default)] mx-0.5" />

            {/* Loop Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 hover:bg-[var(--hover-overlay)] ${isLooping ? "text-[var(--accent-text)]" : "text-[var(--text-tertiary)] hover:text-white"}`}
                  onClick={onToggleLoop}
                >
                  <LoopIcon className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {isLooping ? "Disable Loop (L)" : "Enable Loop (L)"}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Timecode Display */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-[var(--accent-text)] font-bold tabular-nums">
              {formatTimecode(currentTime, frameRate)}
            </span>
            <span className="text-[var(--text-muted)]">/</span>
            <span className="text-[var(--text-secondary)] tabular-nums">{formatTimecode(duration, frameRate)}</span>
          </div>

          <div className="h-4 w-px bg-[var(--border-default)]" />

          {/* Tool Group */}
          <div className="flex items-center gap-1">
            <div
              className={`flex items-center gap-2 px-2 py-0.5 rounded border cursor-pointer select-none transition-all ${
                tool === "razor"
                  ? "border-[var(--accent-border)] bg-[var(--accent-bg-subtle)] text-[var(--accent-text)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
              onClick={() => onToolChange(tool === "select" ? "razor" : "select")}
              title="Toggle Razor Tool (C)"
            >
              {tool === "razor" ? (
                <ScissorsIcon className="w-3.5 h-3.5" />
              ) : (
                <div className="w-3.5 h-3.5 border-2 border-current rounded-sm" />
              )}
              <span className="text-[10px] uppercase font-bold tracking-wider">
                {tool === "razor" ? "Razor" : "Select"}
              </span>
            </div>

            <div
              className="flex items-center gap-2 px-2 py-0.5 rounded border border-transparent hover:bg-[var(--hover-overlay)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
              onClick={onSplitAtPlayhead}
              title="Split at Playhead (S)"
            >
              <SplitIcon className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Split</span>
            </div>
          </div>

          {/* Render Preview Controls */}
          {onRenderPreview && (
            <>
              <div className="flex items-center gap-2">
                {isRendering ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/30">
                      <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                        Rendering {renderProgress.toFixed(0)}%
                      </span>
                    </div>
                    <button
                      onClick={onCancelRender}
                      className="px-2 py-1 rounded border border-red-500/30 bg-red-500/10 text-red-400 text-[10px] uppercase font-bold hover:bg-red-500/20 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onRenderPreview}
                      className={`flex items-center gap-2 px-3 py-1 rounded border transition-all ${
                        renderedPreviewUrl && !isPreviewStale
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          : isPreviewStale
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                            : "border-[var(--accent-border)] bg-[var(--accent-bg-subtle)] text-[var(--accent-text)] hover:bg-[var(--accent-muted)]"
                      }`}
                      title={
                        renderedPreviewUrl && !isPreviewStale
                          ? "Preview rendered - click to re-render"
                          : isPreviewStale
                            ? "Timeline changed - click to update preview"
                            : "Render preview video for playback"
                      }
                    >
                      {renderedPreviewUrl && !isPreviewStale ? (
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : isPreviewStale ? (
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                          <path d="M21 3v5h-5" />
                        </svg>
                      ) : (
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      )}
                      <span className="text-[10px] uppercase font-bold tracking-wider">
                        {renderedPreviewUrl && !isPreviewStale ? "Rendered" : isPreviewStale ? "Re-render" : "Render"}
                      </span>
                    </button>

                    {renderedPreviewUrl && !isPreviewStale && onTogglePreviewPlayback && (
                      <button
                        onClick={onTogglePreviewPlayback}
                        className={`flex items-center gap-2 px-3 py-1 rounded border transition-all ${
                          isPreviewPlayback
                            ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-300"
                            : "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                        }`}
                        title={isPreviewPlayback ? "Exit preview mode (back to live)" : "Watch rendered preview"}
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">
                          {isPreviewPlayback ? "Exit Preview" : "Play Preview"}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="h-4 w-px bg-[var(--border-default)]" />
            </>
          )}

          {/* Snapping Controls */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center bg-[var(--hover-overlay)] rounded-md p-0.5 border border-[var(--border-default)]">
              <button
                onClick={onToggleSnap}
                className={`p-1 rounded transition-colors ${
                  snapConfig.enabled
                    ? "text-[var(--accent-text)] bg-[var(--accent-bg-subtle)]"
                    : "text-[var(--text-muted)] hover:text-white"
                }`}
                title="Toggle Snapping (N)"
              >
                <MagnetIcon className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-3.5 bg-[var(--border-default)] mx-0.5" />
              <button
                onClick={() => onSetShowSnapMenu(!showSnapMenu)}
                className={`p-0.5 rounded hover:bg-[var(--hover-overlay)] text-[var(--text-tertiary)] ${
                  showSnapMenu ? "bg-[var(--hover-overlay)] text-[var(--text-secondary)]" : ""
                }`}
              >
                <ChevronDownIcon className="w-3 h-3" />
              </button>
            </div>

            {showSnapMenu && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-[var(--surface-0)] border border-[var(--border-default)] rounded-lg shadow-xl py-2 z-50 flex flex-col gap-1">
                <div className="px-3 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Snap Targets
                </div>
                {[
                  { key: "toGrid" as const, label: "Snap to Grid" },
                  { key: "toClips" as const, label: "Snap to Clips" },
                  { key: "toPlayhead" as const, label: "Snap to Playhead" },
                ].map((opt) => (
                  <div
                    key={opt.key}
                    className="px-3 py-1.5 hover:bg-[var(--hover-overlay)] cursor-pointer flex items-center justify-between group"
                    onClick={() => onToggleSnapOption(opt.key)}
                  >
                    <span className="text-xs text-[var(--text-secondary)]">{opt.label}</span>
                    {snapConfig[opt.key] && <CheckIcon className="w-3 h-3 text-[var(--accent-text)]" />}
                  </div>
                ))}
                <div className="h-px bg-[var(--border-default)] my-1" />
                <div className="px-3 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Grid Interval
                </div>
                {[0.1, 0.25, 0.5, 1.0].map((val) => (
                  <div
                    key={val}
                    className="px-3 py-1.5 hover:bg-[var(--hover-overlay)] cursor-pointer flex items-center justify-between"
                    onClick={() => onSetGridInterval(val)}
                  >
                    <span className="text-xs text-[var(--text-secondary)]">{val}s</span>
                    {snapConfig.gridInterval === val && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selection Count Badge */}
          {selectedClipCount > 1 && (
            <div className="px-2 py-0.5 bg-[var(--accent-bg-subtle)] text-[var(--accent-text)] rounded text-[10px] font-medium border border-[var(--accent-border)]">
              {selectedClipCount} Clips Selected
            </div>
          )}
        </div>

        {/* Right side - Zoom Controls and Shortcuts */}
        <div className="flex items-center gap-3 shrink-0">
          {onAddMarker && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onAddMarker}
                  className="p-1.5 rounded hover:bg-white/[0.06] text-[var(--text-tertiary)] hover:text-yellow-400 transition-colors"
                >
                  <FlagIcon className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Add Marker (M)
              </TooltipContent>
            </Tooltip>
          )}

          {onShowShortcuts && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onShowShortcuts}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/[0.04] border border-white/[0.06] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06] transition-colors"
                >
                  <kbd className="text-[10px] font-mono bg-white/[0.06] px-1 rounded">?</kbd>
                  <span className="text-[10px] font-medium">Shortcuts</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                View Keyboard Shortcuts (?)
              </TooltipContent>
            </Tooltip>
          )}

          <div className="flex items-center gap-2 bg-[var(--hover-overlay)] rounded-md p-1 border border-[var(--border-default)]">
            <button
              onClick={() => onZoomChange(getPrevZoom(zoomLevel))}
              className="p-1 hover:text-[var(--text-primary)] text-[var(--text-tertiary)] hover:bg-white/[0.06] rounded"
            >
              <ZoomOutIcon className="w-3.5 h-3.5" />
            </button>
            {onZoomToFit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onZoomToFit}
                    className="p-1 hover:text-[var(--text-primary)] text-[var(--text-tertiary)] hover:bg-white/[0.06] rounded"
                  >
                    <MaximizeIcon className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Zoom to Fit (Shift+Z)
                </TooltipContent>
              </Tooltip>
            )}
            <div className="w-20 px-2 flex items-center justify-center border-x border-[var(--border-default)]">
              <span className="text-[10px] font-mono text-[var(--text-tertiary)]">{Math.round(zoomLevel)}px/s</span>
            </div>
            <button
              onClick={() => onZoomChange(getNextZoom(zoomLevel))}
              className="p-1 hover:text-[var(--text-primary)] text-[var(--text-tertiary)] hover:bg-white/[0.06] rounded"
            >
              <ZoomInIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
})

const formatTimecode = (seconds: number, frameRate = 30) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const frames = Math.floor((seconds % 1) * frameRate)
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`
}
