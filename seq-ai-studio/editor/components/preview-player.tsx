"use client"

import type React from "react"
import { memo } from "react"
import { PlayIcon, Grid3x3Icon, MaximizeIcon } from "./icons"
import { MediaItem, TimelineClip } from "../types"

export interface PreviewPlayerProps {
  currentTime: number
  // Video refs
  videoRefA: React.RefObject<HTMLVideoElement | null>
  videoRefB: React.RefObject<HTMLVideoElement | null>
  whiteOverlayRef: React.RefObject<HTMLDivElement | null>
  previewVideoRef: React.RefObject<HTMLVideoElement | null>
  duration: number

  // State
  isPlaying: boolean
  isExporting: boolean
  isRendering: boolean
  isPreviewPlayback: boolean
  isPreviewStale: boolean
  isCinemaMode: boolean
  renderProgress: number
  renderedPreviewUrl: string | null
  timelineClips: TimelineClip[]
  mediaMap: Record<string, MediaItem>
  playerZoom: number
  isSafeGuidesVisible: boolean

  ffmpegLoaded: boolean
  ffmpegLoading: boolean

  // Callbacks
  onPlay: () => void
  onSeek: (time: number) => void
  onTogglePlay: () => void
  onTogglePreviewPlayback: () => void
  onZoomReset: () => void
  onZoomChange: (zoom: number) => void
  onToggleSafeGuides: () => void
  onCancelRender: () => void
  onToggleCinemaMode: () => void
  onLoadFFmpeg: () => void
  onRenderPreview: () => void
}

export const PreviewPlayer = memo(function PreviewPlayer({
  videoRefA,
  videoRefB,
  whiteOverlayRef,
  previewVideoRef,
  isPlaying,
  duration,
  isExporting,
  isRendering,
  isPreviewPlayback,
  isCinemaMode,
  renderProgress,
  renderedPreviewUrl,
  playerZoom,
  isSafeGuidesVisible,
  timelineClips,
  ffmpegLoaded,
  ffmpegLoading,
  onPlay,
  onLoadFFmpeg,
  onTogglePlay,
  onTogglePreviewPlayback,
  onCancelRender,
  onZoomReset,
  mediaMap,
  onZoomChange,
  onToggleSafeGuides,
  onToggleCinemaMode,
}: PreviewPlayerProps) {
  return (
    <div className="flex-1 w-full bg-[#050505] relative flex items-center justify-center p-6 overflow-hidden min-h-[200px]">
      {/* Safe guides overlay */}
      {isSafeGuidesVisible && (
        <div
          className="absolute z-40 inset-0 pointer-events-none flex items-center justify-center"
          style={{ transform: `scale(${playerZoom})` }}
        >
          <div className="w-[90%] h-[90%] border border-white/20 border-dashed absolute aspect-video"></div>
          <div className="w-[80%] h-[80%] border border-cyan-500/30 absolute aspect-video"></div>
        </div>
      )}

      {/* Player controls */}
      {!isExporting && !isRendering && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-black/60 backdrop-blur rounded p-1.5 border border-white/10">
          <button onClick={onZoomReset} className="text-[10px] text-neutral-400 hover:text-white px-2">
            Fit
          </button>
          <button
            onClick={onToggleSafeGuides}
            className={`p-1 ${isSafeGuidesVisible ? "text-indigo-400" : "text-neutral-400"}`}
          >
            <Grid3x3Icon className="w-3.5 h-3.5" />
          </button>
          <button onClick={onToggleCinemaMode} className="p-1 text-neutral-400 hover:text-white">
            <MaximizeIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Video container */}
      <div
        className="relative aspect-video w-full max-h-full shadow-2xl bg-black flex items-center justify-center overflow-hidden"
        style={{ transform: `scale(${playerZoom})` }}
      >
        {/* Rendered preview video */}
        {isPreviewPlayback && renderedPreviewUrl && (
          <video
            ref={previewVideoRef as React.RefObject<HTMLVideoElement>}
            src={renderedPreviewUrl}
            className="absolute inset-0 w-full h-full object-contain bg-black z-10"
            controls
            crossOrigin="anonymous"
          />
        )}

        {/* Live playback videos - hidden during preview playback */}
        <video
          ref={videoRefA as React.RefObject<HTMLVideoElement>}
          className={`absolute inset-0 w-full h-full object-contain bg-black transition-transform ${isPreviewPlayback ? "hidden" : ""}`}
          crossOrigin="anonymous"
          onClick={() => !isExporting && !isRendering && !isPreviewPlayback && onTogglePlay()}
        />
        <video
          ref={videoRefB as React.RefObject<HTMLVideoElement>}
          className={`absolute inset-0 w-full h-full object-contain bg-black transition-transform opacity-0 ${isPreviewPlayback ? "hidden" : ""}`}
          crossOrigin="anonymous"
          onClick={() => !isExporting && !isRendering && !isPreviewPlayback && onTogglePlay()}
        />

        {/* White fade overlay */}
        <div
          ref={whiteOverlayRef as React.RefObject<HTMLDivElement>}
          className={`absolute inset-0 bg-white pointer-events-none z-20 ${isPreviewPlayback ? "hidden" : ""}`}
          style={{ opacity: 0 }}
        />

        {/* Play button overlay */}
        {!isPlaying && !isExporting && !isRendering && !isPreviewPlayback && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <div
              className="w-16 h-16 bg-white/10 backdrop-blur rounded-full flex items-center justify-center cursor-pointer pointer-events-auto hover:scale-105 transition-transform"
              onClick={onPlay}
            >
              <PlayIcon className="w-6 h-6 text-white ml-1" />
            </div>
          </div>
        )}

        {/* Preview playback badge */}
        {isPreviewPlayback && (
          <div className="absolute top-4 left-4 z-40 flex items-center gap-2 bg-cyan-500/20 backdrop-blur rounded px-3 py-1.5 border border-cyan-500/30">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Rendered Preview</span>
          </div>
        )}

        {/* Rendering overlay */}
        {isRendering && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none bg-black/70 backdrop-blur">
            <div className="w-12 h-12 border-t-2 border-indigo-500 rounded-full animate-spin mb-3"></div>
            <p className="text-sm">Rendering Preview...</p>
            <p className="text-xs text-neutral-400">{Math.round(renderProgress)}%</p>
          </div>
        )}
      </div>
    </div>
  )
})

export default PreviewPlayer
