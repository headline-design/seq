"use client"

import type React from "react"
import { memo, useCallback, useState, useRef, useEffect } from "react"
import { PlayIcon, Grid3x3Icon, MaximizeIcon, ImageIcon, ChevronDownIcon, VideoIcon } from "./icons"
import type { MediaItem, TimelineClip, ClipEffects } from "../types"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/seq/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/seq/components/ui/dropdown-menu"
import { TextOverlayPreview } from "./text-overlay-preview"

function effectsToCSSFilter(effects?: ClipEffects): string {
  if (!effects) return "none"

  const filters: string[] = []

  if (effects.brightness !== 0) {
    filters.push(`brightness(${1 + effects.brightness / 100})`)
  }
  if (effects.contrast !== 0) {
    filters.push(`contrast(${1 + effects.contrast / 100})`)
  }
  if (effects.saturation !== 0) {
    filters.push(`saturate(${1 + effects.saturation / 100})`)
  }
  if (effects.hue !== 0) {
    filters.push(`hue-rotate(${effects.hue}deg)`)
  }
  if (effects.blur > 0) {
    filters.push(`blur(${effects.blur}px)`)
  }

  return filters.length > 0 ? filters.join(" ") : "none"
}

export interface PreviewPlayerProps {
  currentTime: number
  videoRefA: React.RefObject<HTMLVideoElement | null>
  videoRefB: React.RefObject<HTMLVideoElement | null>
  whiteOverlayRef: React.RefObject<HTMLDivElement | null>
  previewVideoRef: React.RefObject<HTMLVideoElement | null>
  duration: number
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
  activeClip?: TimelineClip | null
  textClips?: TimelineClip[]
  onCancelRender: () => void
  onPlay: () => void
  onSeek: (time: number) => void
  onTogglePlay: () => void
  onTogglePreviewPlayback: () => void
  onZoomReset: () => void
  onZoomChange: (zoom: number) => void
  onToggleSafeGuides: () => void
  onToggleCinemaMode: () => void
  onLoadFFmpeg: () => void
  onRenderPreview: () => void
}

export const PreviewPlayer = memo(function PreviewPlayer({
  currentTime,
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
  activeClip,
  textClips = [],
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
  const [isSavingFrame, setIsSavingFrame] = useState(false)
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 1920, height: 1080 })

  useEffect(() => {
    const updateSize = () => {
      if (previewContainerRef.current) {
        const rect = previewContainerRef.current.getBoundingClientRect()
        setContainerSize({ width: rect.width, height: rect.height })
      }
    }
    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  const cssFilter = effectsToCSSFilter(activeClip?.effects)
  const clipOpacity = activeClip?.effects?.opacity ?? 100

  const handleSaveFrame = useCallback(
    async (format: "png" | "jpeg" | "webp" = "png", quality = 0.95) => {
      if (isSavingFrame) return
      setIsSavingFrame(true)

      try {
        let videoElement: HTMLVideoElement | null = null

        if (isPreviewPlayback && previewVideoRef?.current) {
          videoElement = previewVideoRef.current
        } else if (videoRefA?.current && Number.parseFloat(videoRefA.current.style.opacity || "1") > 0) {
          videoElement = videoRefA.current
        } else if (videoRefB?.current) {
          videoElement = videoRefB.current
        }

        if (!videoElement || videoElement.readyState < 2) {
          console.warn("No video element ready for frame capture")
          return
        }

        const width = videoElement.videoWidth || 1920
        const height = videoElement.videoHeight || 1080

        let imageBitmap: ImageBitmap | null = null
        try {
          imageBitmap = await createImageBitmap(videoElement, {
            premultiplyAlpha: "none",
            colorSpaceConversion: "none",
          })
        } catch {}

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d", {
          alpha: false,
          desynchronized: true,
          willReadFrequently: false,
        })

        if (!ctx) {
          console.error("Failed to get canvas context")
          return
        }

        ctx.imageSmoothingEnabled = false

        if (cssFilter !== "none") {
          ctx.filter = cssFilter
        }
        if (clipOpacity < 100) {
          ctx.globalAlpha = clipOpacity / 100
        }

        if (imageBitmap) {
          ctx.drawImage(imageBitmap, 0, 0, width, height)
          imageBitmap.close()
        } else {
          ctx.drawImage(videoElement, 0, 0, width, height)
        }

        const timecode = formatTimecodeForFilename(currentTime)
        const extension = format === "jpeg" ? "jpg" : format
        const filename = `frame_${timecode}_${width}x${height}.${extension}`

        const mimeType = format === "jpeg" ? "image/jpeg" : format === "webp" ? "image/webp" : "image/png"
        const blobQuality = format === "png" ? undefined : quality

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              console.error("Failed to create image blob")
              return
            }

            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          },
          mimeType,
          blobQuality,
        )
      } finally {
        setIsSavingFrame(false)
      }
    },
    [currentTime, isPreviewPlayback, previewVideoRef, videoRefA, videoRefB, isSavingFrame, cssFilter, clipOpacity],
  )

  const handleQuickSaveFrame = useCallback(() => {
    handleSaveFrame("png")
  }, [handleSaveFrame])

  const hasClips = timelineClips.length > 0

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className="flex-1 w-full bg-[#050505] relative flex items-center justify-center p-6 overflow-hidden min-h-[200px]"
        role="region"
        aria-label="Video preview player"
        aria-description="Preview area for video playback and frame capture"
      >
        {isSafeGuidesVisible && (
          <div
            className="absolute z-40 inset-0 pointer-events-none flex items-center justify-center"
            style={{ transform: `scale(${playerZoom})` }}
          >
            <div className="w-[90%] h-[90%] border border-white/20 border-dashed absolute aspect-video"></div>
            <div className="w-[80%] h-[80%] border border-cyan-500/30 absolute aspect-video"></div>
          </div>
        )}

        {!isExporting && !isRendering && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-black/60 backdrop-blur rounded p-1.5 border border-white/10">
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`p-1 text-neutral-400 hover:text-white transition-colors flex items-center gap-0.5 ${isSavingFrame ? "opacity-50" : ""}`}
                      disabled={isSavingFrame}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <ChevronDownIcon className="w-2.5 h-2.5" />
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Save Frame (F)
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                <DropdownMenuLabel className="text-xs text-neutral-400">Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSaveFrame("png")} className="text-xs">
                  <span className="flex-1">PNG (Lossless)</span>
                  <span className="text-neutral-500">Best Quality</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSaveFrame("jpeg", 0.95)} className="text-xs">
                  <span className="flex-1">JPEG (95%)</span>
                  <span className="text-neutral-500">Smaller File</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSaveFrame("webp", 0.95)} className="text-xs">
                  <span className="flex-1">WebP (95%)</span>
                  <span className="text-neutral-500">Modern Format</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSaveFrame("jpeg", 1.0)} className="text-xs">
                  <span className="flex-1">JPEG (100%)</span>
                  <span className="text-neutral-500">Max JPEG</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-3.5 bg-white/20" />
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

        <div
          ref={previewContainerRef}
          className="relative aspect-video w-full max-h-full shadow-2xl bg-black flex items-center justify-center overflow-hidden"
          style={{ transform: `scale(${playerZoom})` }}
        >
          {!hasClips && !isExporting && !isRendering && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-30 text-neutral-500">
              <VideoIcon className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-sm font-medium text-neutral-400">No clips in timeline</p>
              <p className="text-xs text-neutral-600 mt-1">Add media or generate content to preview</p>
            </div>
          )}

          {hasClips && (
            <>
              {isPreviewPlayback && renderedPreviewUrl && (
                <video
                  ref={previewVideoRef as React.RefObject<HTMLVideoElement>}
                  src={renderedPreviewUrl}
                  className="absolute inset-0 w-full h-full object-contain bg-black z-10"
                  controls
                  crossOrigin="anonymous"
                />
              )}

              <video
                ref={videoRefA as React.RefObject<HTMLVideoElement>}
                className={`absolute inset-0 w-full h-full object-contain bg-black transition-transform ${isPreviewPlayback ? "hidden" : ""}`}
                crossOrigin="anonymous"
                onClick={() => !isExporting && !isRendering && !isPreviewPlayback && onTogglePlay()}
                style={{
                  filter: cssFilter,
                  opacity: clipOpacity / 100,
                }}
              />
              <video
                ref={videoRefB as React.RefObject<HTMLVideoElement>}
                className={`absolute inset-0 w-full h-full object-contain bg-black transition-transform opacity-0 ${isPreviewPlayback ? "hidden" : ""}`}
                crossOrigin="anonymous"
                onClick={() => !isExporting && !isRendering && !isPreviewPlayback && onTogglePlay()}
                style={{
                  filter: cssFilter,
                }}
              />

              <div
                ref={whiteOverlayRef as React.RefObject<HTMLDivElement>}
                className={`absolute inset-0 bg-white pointer-events-none z-20 ${isPreviewPlayback ? "hidden" : ""}`}
                style={{ opacity: 0 }}
              />

              {!isPreviewPlayback && textClips.length > 0 && (
                <TextOverlayPreview
                  clips={textClips}
                  currentTime={currentTime}
                  containerWidth={containerSize.width}
                  containerHeight={containerSize.height}
                />
              )}

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
            </>
          )}

          {isPreviewPlayback && (
            <div className="absolute top-4 left-4 z-40 flex items-center gap-2 bg-cyan-500/20 backdrop-blur rounded px-3 py-1.5 border border-cyan-500/30">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Rendered Preview</span>
            </div>
          )}

          {isRendering && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none bg-black/70 backdrop-blur">
              <div className="w-12 h-12 border-t-2 border-indigo-500 rounded-full animate-spin mb-3"></div>
              <p className="text-sm">Rendering Preview...</p>
              <p className="text-xs text-neutral-400">{Math.round(renderProgress)}%</p>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
})

function formatTimecodeForFilename(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  return `${mins.toString().padStart(2, "0")}-${secs.toString().padStart(2, "0")}-${ms.toString().padStart(3, "0")}`
}

export default PreviewPlayer
