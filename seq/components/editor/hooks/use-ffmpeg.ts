"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { toBlobURL } from "@ffmpeg/util"

export type ExportPhase = "idle" | "init" | "audio" | "video" | "encoding" | "complete"

export interface UseFFmpegResult {
  ffmpegRef: React.MutableRefObject<FFmpeg | null>
  ffmpegLoaded: boolean
  ffmpegLoading: boolean
  ffmpegError: string | null
  loadFFmpeg: () => Promise<void>

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
  const ffmpegRef = useRef<FFmpeg | null>(null)
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

    // FFmpeg Loading Logic
    const loadFFmpeg = useCallback(async () => {
        if (ffmpegLoaded) return
        if (ffmpegLoading) return

        setFfmpegLoading(true)

        if (!ffmpegRef.current) {
            ffmpegRef.current = new FFmpeg()
        }
        const ffmpeg = ffmpegRef.current

        ffmpeg.on("log", ({ message }) => {
            console.log("[FFmpeg]", message)
        })

        try {
            const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd"
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
            })
            setFfmpegLoaded(true)
        } catch (e) {
            console.error("FFmpeg load failed:", e)
            throw e
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
