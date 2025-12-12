"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import type { FFmpeg as FFmpegType } from "@ffmpeg/ffmpeg"

export type ExportPhase = "idle" | "init" | "audio" | "video" | "encoding" | "complete"

export interface UseFFmpegResult {
  ffmpegRef: React.MutableRefObject<FFmpegType | null>
  ffmpegLoaded: boolean
  ffmpegLoading: boolean
  ffmpegError: string | null
  loadFFmpeg: () => Promise<boolean>

  // Export state
  isExporting: boolean
  setIsExporting: (v: boolean) => void
  exportProgress: number
  setExportProgress: (v: number) => void
  exportPhase: ExportPhase
  setExportPhase: (v: ExportPhase) => void
  downloadUrl: string | null
  setDownloadUrl: (v: string | null) => void
  abortExportRef: React.MutableRefObject<boolean>
  exportCancelledRef: React.MutableRefObject<boolean>

  // Render preview state
  isRendering: boolean
  setIsRendering: (v: boolean) => void
  renderProgress: number
  setRenderProgress: (v: number) => void
  renderedPreviewUrl: string | null
  setRenderedPreviewUrl: (v: string | null) => void
  isPreviewStale: boolean
  setIsPreviewStale: (v: boolean) => void
  renderCancelledRef: React.MutableRefObject<boolean>
}

export function useFFmpeg(): UseFFmpegResult {
  const ffmpegRef = useRef<FFmpegType | null>(null)
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false)
  const [ffmpegLoading, setFfmpegLoading] = useState(false)
  const [ffmpegError, setFfmpegError] = useState<string | null>(null)

  // Export state
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportPhase, setExportPhase] = useState<ExportPhase>("idle")
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const abortExportRef = useRef(false)
  const exportCancelledRef = useRef(false)

  // Render preview state
  const [isRendering, setIsRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState(0)
  const [renderedPreviewUrl, setRenderedPreviewUrl] = useState<string | null>(null)
  const [isPreviewStale, setIsPreviewStale] = useState(false)
  const renderCancelledRef = useRef(false)

  const loadFFmpeg = useCallback(async (): Promise<boolean> => {
    if (ffmpegLoaded) return true
    if (ffmpegLoading) return false

    setFfmpegLoading(true)
    setFfmpegError(null)

    // Multiple CDN sources to try
    const cdnSources = [
      "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm",
      "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm",
      "https://cdnjs.cloudflare.com/ajax/libs/ffmpeg.wasm-core/0.12.6",
    ]

    try {
      const [{ FFmpeg }, { toBlobURL }] = await Promise.all([import("@ffmpeg/ffmpeg"), import("@ffmpeg/util")])

      if (!ffmpegRef.current) {
        ffmpegRef.current = new FFmpeg()
      }
      const ffmpeg = ffmpegRef.current

      ffmpeg.on("log", ({ message }: { message: string }) => {
        console.log("[FFmpeg]", message)
      })

      // Try each CDN source until one works
      let loadSuccess = false
      let lastError: Error | null = null

      for (const baseURL of cdnSources) {
        try {
          console.log(`[FFmpeg] Trying CDN: ${baseURL}`)
          await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
          })
          loadSuccess = true
          console.log(`[FFmpeg] Successfully loaded from: ${baseURL}`)
          break
        } catch (cdnError) {
          console.warn(`[FFmpeg] Failed to load from ${baseURL}:`, cdnError)
          lastError = cdnError as Error
        }
      }

      if (!loadSuccess) {
        throw lastError || new Error("All CDN sources failed")
      }

      setFfmpegLoaded(true)
      return true
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error"
      console.error("FFmpeg load failed:", e)

      if (errorMessage.includes("SharedArrayBuffer")) {
        setFfmpegError(
          "Export requires secure context headers (COOP/COEP). This feature may not work in all environments.",
        )
      } else if (errorMessage.includes("Worker") || errorMessage.includes("CORS")) {
        setFfmpegError(
          "Unable to load video encoder due to browser security restrictions. Try using a different browser or deploying to production.",
        )
      } else {
        setFfmpegError(`Failed to initialize video encoder: ${errorMessage}`)
      }
      return false
    } finally {
      setFfmpegLoading(false)
    }
  }, [ffmpegLoaded, ffmpegLoading])

  return {
    ffmpegRef,
    ffmpegLoaded,
    ffmpegLoading,
    ffmpegError,
    loadFFmpeg,
    isExporting,
    setIsExporting,
    exportProgress,
    setExportProgress,
    exportPhase,
    setExportPhase,
    downloadUrl,
    setDownloadUrl,
    abortExportRef,
    exportCancelledRef,
    isRendering,
    setIsRendering,
    renderProgress,
    setRenderProgress,
    renderedPreviewUrl,
    setRenderedPreviewUrl,
    isPreviewStale,
    setIsPreviewStale,
    renderCancelledRef,
  }
}
