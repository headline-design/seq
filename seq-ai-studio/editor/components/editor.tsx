"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import type { MediaItem, TimelineClip, Marker, StoryboardPanel as StoryboardPanelType } from "../types"
import type { Generation } from "@/components/image-combiner/types"

import { useFFmpeg } from "../hooks/use-ffmpeg"
import { usePlayback } from "../hooks/use-playback"
import { useTimelineState } from "../hooks/use-timeline-state"
import { useRafCallback } from "../hooks/use-debounced-callback"
import { useTimelineKeyboard } from "../hooks/use-timeline-keyboard"
import { useStoryboard } from "../hooks/use-storyboard"
import { useMediaGeneration } from "../hooks/use-media-generation"

import { PreviewPlayer } from "./preview-player"
import { EditorHeader } from "./editor-header"
import { EditorSidebar, type SidebarView } from "./editor-sidebar"
import { ErrorBoundary } from "./error-boundary"
import { PanelErrorBoundary } from "./panel-error-boundary"

import { ProjectLibrary } from "./project-library"
import { CreatePanel } from "./create-panel"
import { SettingsPanel } from "./settings-panel"
import { TransitionsPanel } from "./transitions-panel"
import { InspectorPanel } from "./inspector-panel"
import { StoryboardPanel as StoryboardPanelComponent } from "./storyboard-panel"
import { ExportModal } from "./export-modal"
import { ShortcutsModal } from "./shortcuts-modal"
import { Timeline } from "./timeline"
import { AddMarkerDialog } from "./add-marker-dialog"
import { audioBufferToWav } from "../utils/audio-processing"
import { useShortcuts } from "../hooks/use-shortcuts"
import { useImageGeneration } from "@/components/image-combiner/hooks/use-image-generation"
import { useImageUpload } from "@/components/image-combiner/hooks/use-image-upload"
import { useAspectRatio } from "@/components/image-combiner/hooks/use-aspect-ratio"
import { useMobile } from "@/hooks/use-mobile"
import { useToastContext } from "@/components/ui/sonner"
import {
  serializeProject,
  deserializeProject,
  saveProjectToFile,
  loadProjectFromFile,
  autosaveProject,
  loadAutosave,
  hasAutosave,
  clearAutosave,
} from "../services/project-service"
import { UI_CONSTANTS, AUTOSAVE_CONSTANTS, FFMPEG_CONSTANTS } from "../constants"
import { createDemoData } from "../app"
import { StatusBar } from "./status-bar"

// Define VideoConfig and IStoryboardPanel types as they were not exported from constants/types
interface VideoConfig {
  aspectRatio: string
  useFastModel: boolean
}

interface IStoryboardPanel extends StoryboardPanelType { }

type WebkitWindow = Window & {
  webkitOfflineAudioContext?: typeof OfflineAudioContext
}

interface EditorProps {
  initialMedia?: MediaItem[]
  initialClips?: TimelineClip[]
  initialStoryboard?: IStoryboardPanel[]
  onBack: () => void
}

export const Editor: React.FC<EditorProps> = ({ initialMedia, initialClips, initialStoryboard, onBack }) => {
  const isMobile = useMobile()
  const { toast: toastCtx } = useToastContext()

  const ffmpeg = useFFmpeg()

  useEffect(() => {
    const preloadTimer = setTimeout(() => {
      if (!ffmpeg.ffmpegLoaded && !ffmpeg.ffmpegLoading) {
        ffmpeg.loadFFmpeg().catch(() => {
          // Silently fail preload - will retry when needed
        })
      }
    }, FFMPEG_CONSTANTS.PRELOAD_DELAY_MS)

    return () => clearTimeout(preloadTimer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const timeline = useTimelineState({
    initialMedia,
    initialClips,
    initialStoryboard,
    onPreviewStale: () => ffmpeg.setIsPreviewStale(true),
  })

  const [videoConfig, setVideoConfig] = useState<VideoConfig>({ aspectRatio: "16:9", useFastModel: true })

  const storyboard = useStoryboard({
    initialPanels: initialStoryboard,
    videoConfig,
    onMediaAdd: (media) => timeline.setMedia((prev) => [media, ...prev]),
  })

  const [defaultDuration, setDefaultDuration] = useState(5)
  const mediaGeneration = useMediaGeneration({
    defaultDuration,
    onMediaAdd: (media) => timeline.setMedia((prev) => [media, ...prev]),
    onMediaUpdate: (id, updates) =>
      timeline.setMedia((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m))),
    onAddToTimeline: timeline.handleAddToTimeline,
  })

  const handleExportAudio = useCallback(
    async (clipIds: string[]) => {
      // Filter to only audio track clips and sort by start time
      const clips = timeline.timelineClips.filter((c) => clipIds.includes(c.id)).sort((a, b) => a.start - b.start)

      if (clips.length === 0) return

      // Verify all clips are on audio tracks
      const audioClips = clips.filter((clip) => {
        const track = timeline.tracks.find((t) => t.id === clip.trackId)
        return track?.type === "audio"
      })

      if (audioClips.length === 0) {
        toastCtx.error("No audio clips selected")
        return
      }

      try {
        toastCtx.info(`Processing ${audioClips.length} audio clip${audioClips.length > 1 ? "s" : ""}...`)

        const audioContext = new (
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        )()

        // Decode all audio sources
        const decodedClips: Array<{
          clip: (typeof audioClips)[0]
          buffer: AudioBuffer
        }> = []

        for (const clip of audioClips) {
          const media = timeline.mediaMap[clip.mediaId]
          if (!media?.url) continue

          const response = await fetch(media.url)
          const arrayBuffer = await response.arrayBuffer()
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0))
          decodedClips.push({ clip, buffer: audioBuffer })
        }

        if (decodedClips.length === 0) {
          toastCtx.error("No audio sources found")
          audioContext.close()
          return
        }

        // Calculate total duration based on clip positions
        const firstClipStart = Math.min(...audioClips.map((c) => c.start))
        const lastClipEnd = Math.max(...audioClips.map((c) => c.start + c.duration))
        const totalDuration = lastClipEnd - firstClipStart

        // Use the sample rate from the first clip
        const sampleRate = decodedClips[0].buffer.sampleRate
        const totalSamples = Math.ceil(totalDuration * sampleRate)
        const numChannels = Math.max(...decodedClips.map((d) => d.buffer.numberOfChannels))

        // Create output buffer
        const outputBuffer = audioContext.createBuffer(numChannels, totalSamples, sampleRate)

        // Mix all clips into the output buffer
        for (const { clip, buffer } of decodedClips) {
          const clipStartInOutput = (clip.start - firstClipStart) * sampleRate
          const sourceStartSample = Math.floor(clip.offset * buffer.sampleRate)
          const sourceDurationSamples = Math.floor(clip.duration * buffer.sampleRate)
          const sourceEndSample = Math.min(sourceStartSample + sourceDurationSamples, buffer.length)

          const fadeInSamples = Math.floor((clip.fadeIn || 0) * buffer.sampleRate)
          const fadeOutSamples = Math.floor((clip.fadeOut || 0) * buffer.sampleRate)
          const clipSamples = sourceEndSample - sourceStartSample

          for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            const sourceData = buffer.getChannelData(channel)
            const destData = outputBuffer.getChannelData(channel)

            for (let i = 0; i < clipSamples; i++) {
              const destIndex = Math.floor(clipStartInOutput) + i
              if (destIndex >= 0 && destIndex < totalSamples) {
                let sample = sourceData[sourceStartSample + i]

                // Apply fade in
                if (fadeInSamples > 0 && i < fadeInSamples) {
                  sample *= i / fadeInSamples
                }

                // Apply fade out
                if (fadeOutSamples > 0 && i >= clipSamples - fadeOutSamples) {
                  const fadeOutPosition = clipSamples - i
                  sample *= fadeOutPosition / fadeOutSamples
                }

                // Mix audio (add samples together)
                destData[destIndex] += sample
              }
            }
          }
        }

        // Normalize to prevent clipping if multiple clips overlap
        for (let channel = 0; channel < numChannels; channel++) {
          const data = outputBuffer.getChannelData(channel)
          let maxAbs = 0
          for (let i = 0; i < data.length; i++) {
            maxAbs = Math.max(maxAbs, Math.abs(data[i]))
          }
          if (maxAbs > 1) {
            for (let i = 0; i < data.length; i++) {
              data[i] /= maxAbs
            }
          }
        }

        const wavData = audioBufferToWav(outputBuffer)
        const blob = new Blob([wavData], { type: "audio/wav" })
        const url = URL.createObjectURL(blob)

        const a = document.createElement("a")
        a.href = url
        a.download = `audio_export_${audioClips.length > 1 ? "combined_" : ""}${Date.now()}.wav`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        setTimeout(() => URL.revokeObjectURL(url), 1000)
        audioContext.close()

        toastCtx.success(
          audioClips.length > 1
            ? `${audioClips.length} audio clips combined and downloaded`
            : "Audio file downloaded successfully",
        )
      } catch (error) {
        console.error("Audio export failed:", error)
        toastCtx.error("Failed to export audio clip")
      }
    },
    [timeline.timelineClips, timeline.tracks, timeline.mediaMap, toastCtx],
  )

  const playback = usePlayback({
    timelineClips: timeline.timelineClips,
    tracks: timeline.tracks,
    mediaMap: timeline.mediaMap,
    timelineDuration: timeline.timelineDuration,
    isExporting: ffmpeg.isExporting,
    isRendering: ffmpeg.isRendering,
  })

  useTimelineKeyboard({
    clips: timeline.timelineClips,
    tracks: timeline.tracks,
    selectedClipIds: timeline.selectedClipIds,
    currentTime: playback.currentTime,
    duration: timeline.timelineDuration,
    zoomLevel: timeline.zoomLevel,
    isPlaying: playback.isPlaying,
    onSelectClips: timeline.handleSelectClips,
    onDeleteClip: timeline.handleDeleteClip,
    onDuplicateClip: timeline.handleDuplicateClip,
    onClipUpdate: timeline.handleClipUpdate,
    onSeek: playback.handleSeek,
    onTogglePlayback: () => playback.setIsPlaying((p) => !p),
    onUndo: timeline.undo,
    onRedo: timeline.redo,
  })

  // UI State - Use constants for default values
  const [activeView, setActiveView] = useState<SidebarView>("library")
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [apiKeyReady, setApiKeyReady] = useState(false) // Was not in updates, keeping it
  // const [defaultDuration, setDefaultDuration] = useState(5) // REMOVED, now handled by mediaGeneration hook
  const [playerZoom, setPlayerZoom] = useState(1)
  const [isCinemaMode, setIsCinemaMode] = useState(false)
  const [timelineHeight, setTimelineHeight] = useState<number>(UI_CONSTANTS.TIMELINE_DEFAULT_HEIGHT)
  const [isResizingTimeline, setIsResizingTimeline] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState<number>(UI_CONSTANTS.SIDEBAR_DEFAULT_WIDTH)
  const [isResizingSidebar, setIsResizingSidebar] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [isSafeGuidesVisible, setIsSafeGuidesVisible] = useState(false)
  const [isLooping, setIsLooping] = useState(false) // Added for loop playback

  const [isExportModalOpen, setIsExportModalOpen] = useState(false) // Added back for the modal itself

  // Add markers state after other useState hooks
  const [markers, setMarkers] = useState<Marker[]>([])
  const [showAddMarkerDialog, setShowAddMarkerDialog] = useState(false)

  const resizeRef = useRef<{ startY: number; startHeight: number } | null>(null)
  const sidebarResizeRef = useRef<{ startX: number; startWidth: number } | null>(null)

  const objectUrlsRef = useRef<string[]>([])
  const isMountedRef = useRef(true)

  const saveFrameRef = useRef<(() => void) | null>(null)

  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const handleTimelineResize = useRafCallback((e: MouseEvent) => {
    if (resizeRef.current) {
      const deltaY = resizeRef.current.startY - e.clientY
      const maxH = typeof window !== "undefined" ? window.innerHeight - 300 : UI_CONSTANTS.TIMELINE_MAX_HEIGHT
      const newHeight = Math.max(
        UI_CONSTANTS.TIMELINE_MIN_HEIGHT,
        Math.min(maxH, resizeRef.current.startHeight + deltaY),
      )
      setTimelineHeight(newHeight)
    }
  })

  const handleSidebarResize = useRafCallback((e: MouseEvent) => {
    if (sidebarResizeRef.current) {
      const deltaX = e.clientX - sidebarResizeRef.current.startX
      const proposedWidth = sidebarResizeRef.current.startWidth + deltaX
      if (proposedWidth < 150) {
        setIsPanelOpen(false)
        setIsResizingSidebar(false)
      } else {
        const newWidth = Math.max(
          UI_CONSTANTS.SIDEBAR_MIN_WIDTH,
          Math.min(UI_CONSTANTS.SIDEBAR_MAX_WIDTH, proposedWidth),
        )
        setSidebarWidth(newWidth)
      }
    }
  })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingTimeline) {
        handleTimelineResize(e)
      }
      if (isResizingSidebar) {
        handleSidebarResize(e)
      }
    }
    const handleMouseUp = () => {
      setIsResizingTimeline(false)
      setIsResizingSidebar(false)
      resizeRef.current = null
      sidebarResizeRef.current = null
      document.body.style.cursor = "default"
    }

    if (isResizingTimeline || isResizingSidebar) {
      document.body.style.cursor = isResizingTimeline ? "ns-resize" : "ew-resize"
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
        document.body.style.cursor = "default"
      }
    }
  }, [isResizingTimeline, isResizingSidebar, handleTimelineResize, handleSidebarResize])

  useEffect(() => {
    if (ffmpeg.isPreviewStale && playback.isPreviewPlayback) {
      playback.setIsPreviewPlayback(false)
    }
  }, [ffmpeg.isPreviewStale, playback])

  // Storyboard Handlers
  const handleAddStoryboardToTimeline = useCallback(
    (panel: IStoryboardPanel) => {
      if (!panel.videoUrl) return

      let mediaId = panel.mediaId
      if (!mediaId || !timeline.mediaMap[mediaId]) {
        mediaId = `media-sb-fallback-${panel.id}`
        const newMedia: MediaItem = {
          id: mediaId,
          url: panel.videoUrl,
          prompt: panel.prompt,
          duration: panel.duration || 5,
          aspectRatio: videoConfig.aspectRatio,
          status: "ready",
          type: "video",
          resolution: { width: 1280, height: 720 },
        }
        timeline.setMedia((prev) => [newMedia, ...prev])
      }

      timeline.pushToHistory()
      const trackId = "v1"
      const clipsOnTrack = timeline.timelineClips.filter((c) => c.trackId === trackId)
      const start = clipsOnTrack.length > 0 ? Math.max(...clipsOnTrack.map((c) => c.start + c.duration)) : 0
      const newClip: TimelineClip = {
        speed: 1,
        id: `clip-sb-${Date.now()}`,
        mediaId: mediaId!,
        trackId,
        start,
        duration: panel.duration || 5,
        offset: 0,
        volume: 1,
      }
      timeline.setTimelineClips((prev) => [...prev, newClip])
      timeline.setSelectedClipIds([newClip.id])
    },
    [timeline, videoConfig],
  )

  // Image generation state (for create panel)
  const [prompt, setPrompt] = useState("A beautiful landscape with mountains and a lake at sunset")
  const [useUrls, setUseUrls] = useState(false)
  const [isEnhancingMaster, setIsEnhancingMaster] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [apiKeyMissing, setApiKeyMissing] = useState(false)

  // Generated item state for CreatePanel
  const [generatedItem, setGeneratedItem] = useState<{ url: string; type: "video" | "image" } | null>(null)

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const {
    image1,
    image1Preview,
    image1Url,
    image2,
    image2Preview,
    image2Url,
    handleImageUpload,
    handleUrlChange, // Not used in the provided snippet, but kept for completeness
    clearImage, // Not used in the provided snippet, but kept for completeness
  } = useImageUpload()

  const { aspectRatio, setAspectRatio, availableAspectRatios } = useAspectRatio()

  const [persistedGenerations, setPersistedGenerations] = useState<Generation[]>([])
  const addGeneration = useCallback(async (generation: Generation) => {
    setPersistedGenerations((prev) => [...prev, generation])
  }, [])

  const {
    selectedGenerationId,
    setSelectedGenerationId,
    imageLoaded,
    setImageLoaded,
    generateImage: runGeneration,
    cancelGeneration,
    loadGeneratedAsInput,
  } = useImageGeneration({
    prompt,
    aspectRatio,
    image1,
    image2,
    image1Url,
    image2Url,
    useUrls,
    generations: persistedGenerations,
    setGenerations: setPersistedGenerations,
    addGeneration,
    onToast: showToast,
    onImageUpload: handleImageUpload,
    onOutOfCredits: () => { },
    onApiKeyMissing: () => setApiKeyMissing(true),
  })

  // Generation handler
  const handleGenerate = useCallback(
    async (prompt: string, aspectRatio: string, type: "video" | "image" = "video", model?: string, image?: string) => {
      const newId = Math.random().toString(36).substr(2, 9)
      const tempMedia: MediaItem = {
        id: newId,
        url: "",
        prompt: prompt,
        duration: type === "video" ? defaultDuration : 5,
        aspectRatio: aspectRatio,
        status: "generating",
        type: type,
        resolution: { width: 1280, height: 720 },
      }
      timeline.setMedia((prev) => [tempMedia, ...prev])
      setIsGenerating(true)

      try {
        let videoUrl = ""

        if (type === "video") {
          const response = await fetch("/api/generate-video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, aspectRatio, model, imageUrl: image }),
          })

          if (!response.ok) {
            const err = await response.json()
            throw new Error(err.error || "Generation failed")
          }

          const result = await response.json()
          setGeneratedItem({ url: result.url, type: "video" })
          videoUrl = result.url
        } else {
          // Image Generation
          let apiAspectRatio = "square"
          if (aspectRatio === "16:9") apiAspectRatio = "landscape"
          else if (aspectRatio === "9:16") apiAspectRatio = "portrait"

          const formData = new FormData()
          if (image) {
            formData.append("mode", "image-editing")
            formData.append("image1Url", image)
          } else {
            formData.append("mode", "text-to-image")
          }
          formData.append("prompt", prompt)
          formData.append("aspectRatio", apiAspectRatio)
          if (model) formData.append("model", model)

          const response = await fetch("/api/generate-image", { method: "POST", body: formData })

          if (!response.ok) {
            const err = await response.json()
            throw new Error(err.error || "Image generation failed")
          }

          const result = await response.json()
          setGeneratedItem({ url: result.url, type: "image" })
          videoUrl = result.url
        }

        if (!videoUrl) throw new Error("No URL received")

        if (isMountedRef.current) {
          timeline.setMedia((prev) => prev.map((m) => (m.id === newId ? { ...m, url: videoUrl, status: "ready" } : m)))
          setActiveView("library")

          if (videoUrl) {
            const readyItem = { ...tempMedia, url: videoUrl, status: "ready" as const }
            timeline.handleAddToTimeline(readyItem)
          }
        }
      } catch (error: any) {
        if (isMountedRef.current) {
          timeline.setMedia((prev) => prev.map((m) => (m.id === newId ? { ...m, status: "error" } : m)))
          alert(error.message || "Generation failed")
        }
      } finally {
        if (isMountedRef.current) setIsGenerating(false)
      }
    },
    [defaultDuration, timeline],
  )

  // Import handler
  const handleImport = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file)
      objectUrlsRef.current.push(url)
      const newId = Math.random().toString(36).substr(2, 9)
      const isAudio = file.type.startsWith("audio")
      const newMedia: MediaItem = {
        id: newId,
        url,
        prompt: file.name,
        duration: defaultDuration,
        aspectRatio: "16:9",
        status: "ready",
        type: isAudio ? "audio" : "video",
      }
      const el = isAudio ? document.createElement("audio") : document.createElement("video")
      el.crossOrigin = "anonymous"
      el.onloadedmetadata = () => {
        newMedia.duration = el.duration
        if (!isAudio) {
          const videoEl = el as HTMLVideoElement
          const r = videoEl.videoWidth / videoEl.videoHeight
          newMedia.resolution = { width: videoEl.videoWidth, height: videoEl.videoHeight }
          if (Math.abs(r - 16 / 9) < 0.1) newMedia.aspectRatio = "16:9"
          else if (Math.abs(r - 9 / 16) < 0.1) newMedia.aspectRatio = "9:16"
          else if (Math.abs(r - 1) < 0.1) newMedia.aspectRatio = "1:1"
          else newMedia.aspectRatio = "custom"
        }
        timeline.setMedia((prev) =>
          prev.map((m) =>
            m.id === newId
              ? { ...m, duration: el.duration, aspectRatio: newMedia.aspectRatio, resolution: newMedia.resolution }
              : m,
          ),
        )
      }
      el.src = url
      timeline.setMedia((prev) => [newMedia, ...prev])
    },
    [defaultDuration, timeline],
  )

  // Export handlers
  const startExport = useCallback(
    async (resolution: "720p" | "1080p", source: "all" | "selection") => {
      if (!ffmpeg.ffmpegRef.current) {
        console.error("FFmpeg not loaded")
        return
      }

      ffmpeg.exportCancelledRef.current = false
      ffmpeg.setIsExporting(true)
      ffmpeg.abortExportRef.current = false
      ffmpeg.setDownloadUrl(null)
      ffmpeg.setExportProgress(0)
      ffmpeg.setExportPhase("init")
      playback.setIsPlaying(false)

      const exportStartTime = source === "all" ? 0 : timeline.selectionBounds?.start || 0
      const exportEndTime =
        source === "all" ? timeline.contentDuration : timeline.selectionBounds?.end || timeline.contentDuration
      const exportDuration = exportEndTime - exportStartTime

      if (exportDuration <= 0) {
        alert("Export duration is too short or empty.")
        ffmpeg.setIsExporting(false)
        ffmpeg.setExportPhase("idle")
        return
      }

      const ffmpegInstance = ffmpeg.ffmpegRef.current!
      let width: number, height: number
      if (resolution === "1080p") {
        width = 1920
        height = 1080
      } else {
        width = 1280
        height = 720
      }

      const canReusePreview =
        ffmpeg.renderedPreviewUrl && !ffmpeg.isPreviewStale && source === "all" && resolution === "720p"

      if (canReusePreview) {
        ffmpeg.setExportPhase("encoding")
        ffmpeg.setExportProgress(10)

        try {
          const response = await fetch(ffmpeg.renderedPreviewUrl!)
          const previewBlob = await response.arrayBuffer()
          await ffmpegInstance.writeFile("preview_input.mp4", new Uint8Array(previewBlob))
          ffmpeg.setExportProgress(30)

          ffmpegInstance.on("progress", ({ progress }) => {
            ffmpeg.setExportProgress(30 + Math.round(progress * 65))
          })

          await ffmpegInstance.exec([
            "-i",
            "preview_input.mp4",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            String(FFMPEG_CONSTANTS.EXPORT_CRF),
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            "output.mp4",
          ])

          ffmpeg.setExportPhase("complete")
          ffmpeg.setExportProgress(95)

          const data = (await ffmpegInstance.readFile("output.mp4")) as any
          const url = URL.createObjectURL(new Blob([data], { type: "video/mp4" }))
          ffmpeg.setDownloadUrl(url)
          ffmpeg.setExportProgress(100)

          try {
            await ffmpegInstance.deleteFile("preview_input.mp4")
          } catch (e) { }
          try {
            await ffmpegInstance.deleteFile("output.mp4")
          } catch (e) { }
        } catch (err: any) {
          if (err.message !== "Export cancelled") {
            console.error("Export Failed", err)
            alert(`Export failed: ${err.message}`)
          }
        } finally {
          ffmpeg.setIsExporting(false)
          ffmpeg.setExportPhase("idle")
        }
        return
      }

      // Full render path
      try {
        const fps = 30
        const dt = 1 / fps

        // Audio render
        ffmpeg.setExportPhase("audio")
        const sampleRate = FFMPEG_CONSTANTS.AUDIO_SAMPLE_RATE
        const totalFrames = Math.ceil(exportDuration * sampleRate)
        // Find the webkitOfflineAudioContext usages and replace with typed version
        const OfflineCtx = window.OfflineAudioContext || (window as WebkitWindow).webkitOfflineAudioContext
        if (!OfflineCtx) {
          alert("Web Audio API OfflineAudioContext not supported.")
          ffmpeg.setIsExporting(false)
          ffmpeg.setExportPhase("idle")
          return
        }
        const offlineCtx = new OfflineCtx(2, totalFrames, sampleRate)
        const audioBufferMap = new Map<string, AudioBuffer>()
        const uniqueMediaIds = new Set(
          timeline.timelineClips.filter((c) => c.trackId.startsWith("a") || !c.isAudioDetached).map((c) => c.mediaId),
        )

        ffmpeg.setExportProgress(10)

        for (const mid of uniqueMediaIds) {
          if (ffmpeg.abortExportRef.current) throw new Error("Export cancelled")
          const item = timeline.mediaMap[mid]
          if (item?.url) {
            try {
              const response = await fetch(item.url)
              const arrayBuffer = await response.arrayBuffer()
              const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer)
              audioBufferMap.set(mid, audioBuffer)
            } catch (e) { }
          }
        }

        ffmpeg.setExportProgress(25)

        timeline.timelineClips.forEach((clip) => {
          if (ffmpeg.abortExportRef.current) return
          const track = timeline.tracks.find((t) => t.id === clip.trackId)
          if (track?.isMuted) return
          if (track?.type === "video" && clip.isAudioDetached) return

          let startInDest = clip.start - exportStartTime
          let clipOffset = clip.offset
          let clipDuration = clip.duration

          if (startInDest < 0) {
            const diff = -startInDest
            if (diff >= clipDuration) return
            clipOffset += diff
            clipDuration -= diff
            startInDest = 0
          }
          if (startInDest + clipDuration > exportDuration) {
            clipDuration -= startInDest + clipDuration - exportDuration
          }
          if (clipDuration <= 0) return

          const buffer = audioBufferMap.get(clip.mediaId)
          if (buffer) {
            const source = offlineCtx.createBufferSource()
            source.buffer = buffer
            const gainNode = offlineCtx.createGain()
            const baseVolume = (track?.volume ?? 1) * (clip.volume ?? 1)
            gainNode.gain.setValueAtTime(baseVolume, offlineCtx.currentTime + startInDest)
            source.connect(gainNode)
            gainNode.connect(offlineCtx.destination)
            source.start(startInDest, clipOffset, clipDuration)
          }
        })

        if (ffmpeg.abortExportRef.current) throw new Error("Export cancelled")
        const renderedBuffer = await offlineCtx.startRendering()
        const wavData = audioBufferToWav(renderedBuffer)
        await ffmpegInstance.writeFile("audio.wav", new Uint8Array(wavData))

        // Video render
        if (ffmpeg.abortExportRef.current || ffmpeg.exportCancelledRef.current) throw new Error("Export cancelled")
        ffmpeg.setExportPhase("video")

        let isVertical = false
        const firstClip = timeline.timelineClips.sort((a, b) => a.start - b.start)[0]
        if (firstClip) {
          const m = timeline.mediaMap[firstClip.mediaId]
          if (m?.resolution && m.resolution.height > m.resolution.width) isVertical = true
        }

        let targetW = width
        let targetH = height
        if (isVertical) {
          ;[targetW, targetH] = [targetH, targetW]
        }

        if (playback.canvasRef.current) {
          playback.canvasRef.current.width = targetW
          playback.canvasRef.current.height = targetH
        }
        const renderCtx = playback.canvasRef.current!.getContext("2d", { alpha: false })!
        renderCtx.imageSmoothingEnabled = true
        renderCtx.imageSmoothingQuality = "high"

        let exportTime = exportStartTime
        let frameCount = 0

        while (exportTime < exportEndTime && !ffmpeg.exportCancelledRef.current) {
          if (ffmpeg.abortExportRef.current) throw new Error("Export cancelled")

          playback.syncMediaToTime(exportTime, true)
          await Promise.all([
            playback.waitForVideoReady(playback.videoRefA.current!),
            playback.waitForVideoReady(playback.videoRefB.current!),
          ])

          playback.drawFrameToCanvas(renderCtx, targetW, targetH, exportTime)

          const blob: Blob = await new Promise((resolve, reject) => {
            playback.canvasRef.current!.toBlob(
              (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
              "image/jpeg",
              FFMPEG_CONSTANTS.JPEG_QUALITY,
            )
          })

          const buffer = await blob.arrayBuffer()
          await ffmpegInstance.writeFile(`frame${frameCount.toString().padStart(4, "0")}.jpg`, new Uint8Array(buffer))

          ffmpeg.setExportProgress(5 + ((exportTime - exportStartTime) / exportDuration) * 70)
          exportTime += dt
          frameCount++
          await new Promise<void>((resolve) => setTimeout(resolve, 0))
        }

        if (frameCount === 0) throw new Error("No frames were rendered.")

        // Encode
        if (ffmpeg.abortExportRef.current) throw new Error("Export cancelled")
        ffmpeg.setExportPhase("encoding")
        ffmpeg.setExportProgress(75)

        ffmpegInstance.on("progress", ({ progress }) => {
          ffmpeg.setExportProgress(75 + Math.round(progress * 23))
        })

        await ffmpegInstance.exec([
          "-framerate",
          "30",
          "-i",
          "frame%04d.jpg",
          "-i",
          "audio.wav",
          "-c:a",
          "aac",
          "-c:v",
          "libx264",
          "-pix_fmt",
          "yuv420p",
          "-shortest",
          "output.mp4",
        ])

        ffmpeg.setExportPhase("complete")
        ffmpeg.setExportProgress(98)

        const data = (await ffmpegInstance.readFile("output.mp4")) as any
        const url = URL.createObjectURL(new Blob([data], { type: "video/mp4" }))
        ffmpeg.setDownloadUrl(url)
        ffmpeg.setExportProgress(100)

        // Cleanup
        try {
          await ffmpegInstance.deleteFile("audio.wav")
        } catch (e) { }
        try {
          await ffmpegInstance.deleteFile("output.mp4")
        } catch (e) { }
        for (let i = 0; i < frameCount; i++) {
          try {
            await ffmpegInstance.deleteFile(`frame${i.toString().padStart(4, "0")}.jpg`)
          } catch (e) { }
        }
      } catch (err: any) {
        if (err.message !== "Export cancelled") {
          console.error("Export Failed", err)
          alert(`Export failed: ${err.message}`)
        }
        ffmpeg.setExportPhase("idle")
      } finally {
        ffmpeg.setIsExporting(false)
        playback.setCurrentTime(0)
        if (playback.videoRefA.current) playback.videoRefA.current.style.opacity = "1"
        if (playback.videoRefB.current) playback.videoRefB.current.style.opacity = "0"
        if (playback.videoRefA.current) playback.videoRefA.current.muted = false
      }
    },
    [ffmpeg, playback, timeline],
  )

  const handleCancelExport = useCallback(() => {
    ffmpeg.abortExportRef.current = true
    ffmpeg.exportCancelledRef.current = true
    ffmpeg.setIsExporting(false)
    setIsExportModalOpen(false)
    ffmpeg.setExportPhase("idle")
  }, [ffmpeg])

  // Render preview handler
  const handleRenderPreview = useCallback(async () => {
    ffmpeg.renderCancelledRef.current = false

    if (!ffmpeg.ffmpegLoaded || !ffmpeg.ffmpegRef.current) {
      try {
        await ffmpeg.loadFFmpeg()
      } catch (e) {
        alert("Failed to load render engine. Please try again.")
        return
      }
    }

    ffmpeg.setIsRendering(true)
    ffmpeg.setRenderProgress(0)
    playback.setIsPlaying(false)

    if (ffmpeg.renderedPreviewUrl) {
      URL.revokeObjectURL(ffmpeg.renderedPreviewUrl)
      ffmpeg.setRenderedPreviewUrl(null)
    }

    const contentDuration = timeline.contentDuration
    if (contentDuration <= 0) {
      alert("No content to render.")
      ffmpeg.setIsRendering(false)
      return
    }

    const ffmpegInstance = ffmpeg.ffmpegRef.current!

    try {
      // Audio render
      const sampleRate = FFMPEG_CONSTANTS.AUDIO_SAMPLE_RATE
      const totalFrames = Math.ceil(contentDuration * sampleRate)
      // Find the webkitOfflineAudioContext usages and replace with typed version
      const OfflineCtx = window.OfflineAudioContext || (window as WebkitWindow).webkitOfflineAudioContext
      if (!OfflineCtx) {
        alert("Web Audio API OfflineAudioContext not supported.")
        ffmpeg.setIsRendering(false)
        return
      }
      const offlineCtx = new OfflineCtx(2, totalFrames, sampleRate)
      const audioBufferMap = new Map<string, AudioBuffer>()

      ffmpeg.setRenderProgress(5)

      for (const mid of new Set(
        timeline.timelineClips.filter((c) => c.trackId.startsWith("a") || !c.isAudioDetached).map((c) => c.mediaId),
      )) {
        if (ffmpeg.renderCancelledRef.current) throw new Error("Render cancelled")
        const item = timeline.mediaMap[mid]
        if (item?.url) {
          try {
            const response = await fetch(item.url)
            const arrayBuffer = await response.arrayBuffer()
            audioBufferMap.set(mid, await offlineCtx.decodeAudioData(arrayBuffer))
          } catch (e) { }
        }
      }

      ffmpeg.setRenderProgress(15)

      timeline.timelineClips.forEach((clip) => {
        if (ffmpeg.renderCancelledRef.current) return
        const track = timeline.tracks.find((t) => t.id === clip.trackId)
        if (track?.isMuted) return
        if (track?.type === "video" && clip.isAudioDetached) return

        const buffer = audioBufferMap.get(clip.mediaId)
        if (buffer) {
          const source = offlineCtx.createBufferSource()
          source.buffer = buffer
          const gainNode = offlineCtx.createGain()
          source.connect(gainNode)
          gainNode.connect(offlineCtx.destination)
          source.start(clip.start, clip.offset, clip.duration)
        }
      })

      if (ffmpeg.renderCancelledRef.current) throw new Error("Render cancelled")
      const renderedBuffer = await offlineCtx.startRendering()
      await ffmpegInstance.writeFile("preview_audio.wav", new Uint8Array(audioBufferToWav(renderedBuffer)))

      ffmpeg.setRenderProgress(25)

      // Video render
      let isVertical = false
      const firstClip = timeline.timelineClips.sort((a, b) => a.start - b.start)[0]
      if (firstClip) {
        const m = timeline.mediaMap[firstClip.mediaId]
        if (m?.resolution && m.resolution.height > m.resolution.width) isVertical = true
      }

      let targetW = 1280,
        targetH = 720
      if (isVertical) [targetW, targetH] = [targetH, targetW]

      if (playback.canvasRef.current) {
        playback.canvasRef.current.width = targetW
        playback.canvasRef.current.height = targetH
      }
      const ctx = playback.canvasRef.current!.getContext("2d", { alpha: false })!

      const dt = 1 / 30
      let exportTime = 0
      let frameCount = 0

      while (exportTime < contentDuration && !ffmpeg.renderCancelledRef.current) {
        playback.syncMediaToTime(exportTime, true)
        await Promise.all([
          playback.waitForVideoReady(playback.videoRefA.current!),
          playback.waitForVideoReady(playback.videoRefB.current!),
        ])
        playback.drawFrameToCanvas(ctx, targetW, targetH, exportTime)

        const blob: Blob = await new Promise((resolve, reject) => {
          playback.canvasRef.current!.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
            "image/jpeg",
            FFMPEG_CONSTANTS.PREVIEW_JPEG_QUALITY,
          )
        })

        await ffmpegInstance.writeFile(
          `pframe${frameCount.toString().padStart(4, "0")}.jpg`,
          new Uint8Array(await blob.arrayBuffer()),
        )
        ffmpeg.setRenderProgress(5 + (exportTime / contentDuration) * 65)
        exportTime += dt
        frameCount++
        await new Promise<void>((resolve) => setTimeout(resolve, 0))
      }

      if (frameCount === 0) throw new Error("No frames were rendered.")

      // Encode
      ffmpeg.setRenderProgress(92)

      ffmpegInstance.on("progress", ({ progress }) => {
        ffmpeg.setRenderProgress(92 + Math.round(progress * 8))
      })

      await ffmpegInstance.exec([
        "-framerate",
        "30",
        "-i",
        "pframe%04d.jpg",
        "-i",
        "preview_audio.wav",
        "-c:a",
        "aac",
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-crf",
        String(FFMPEG_CONSTANTS.PREVIEW_CRF),
        "-pix_fmt",
        "yuv420p",
        "-shortest",
        "preview.mp4",
      ])

      const data = (await ffmpegInstance.readFile("preview.mp4")) as any
      ffmpeg.setRenderedPreviewUrl(URL.createObjectURL(new Blob([data], { type: "video/mp4" })))
      ffmpeg.setIsPreviewStale(false)
      ffmpeg.setRenderProgress(100)

      // Cleanup
      try {
        await ffmpegInstance.deleteFile("preview_audio.wav")
      } catch (e) { }
      try {
        await ffmpegInstance.deleteFile("preview.mp4")
      } catch (e) { }
      for (let i = 0; i < frameCount; i++) {
        try {
          await ffmpegInstance.deleteFile(`pframe${i.toString().padStart(4, "0")}.jpg`)
        } catch (e) { }
      }
    } catch (err: any) {
      if (err.message !== "Render cancelled") {
        console.error("Render Failed", err)
        alert(`Render failed: ${err.message}`)
      }
    } finally {
      ffmpeg.setIsRendering(false)
    }
  }, [ffmpeg, playback, timeline])

  const handleCancelRender = useCallback(() => {
    ffmpeg.renderCancelledRef.current = true
    ffmpeg.setIsRendering(false)
    ffmpeg.setRenderProgress(0)
  }, [ffmpeg])

  // Keyboard shortcuts
  useShortcuts(
    {
      onPlayPause: () => playback.setIsPlaying((p) => !p),
      onUndo: () => {
        if (timeline.history.length > 0) timeline.undo()
      },
      onRedo: () => {
        if (timeline.future.length > 0) timeline.redo()
      },
      onCut: () => timeline.setTool((t) => (t === "select" ? "razor" : "select")),
      onDuplicate: () => timeline.handleDuplicateClip(timeline.selectedClipIds),
      onDelete: () => timeline.handleDeleteClip(timeline.selectedClipIds),
      onRippleDelete: () => timeline.handleRippleDeleteClip(timeline.selectedClipIds),
      onSaveFrame: () => {
        // This functionality is now handled by the 'f' keydown event,
        // but kept here for potential future use or alternative trigger.
        // Call the high-quality frame capture function directly
        if (saveFrameRef.current) {
          saveFrameRef.current()
        }
      },
    },
    [timeline.history.length, timeline.future.length, timeline.selectedClipIds, ffmpeg, playback, toastCtx],
  )

  const handleSaveProject = useCallback(async () => {
    setIsSaving(true)
    try {
      const projectData = await serializeProject(
        timeline.media,
        timeline.timelineClips,
        timeline.tracks,
        storyboard.panels,
        videoConfig,
        storyboard.masterDescription,
      )
      await saveProjectToFile(projectData)
      toastCtx.success("Project saved successfully")
    } catch (error) {
      console.error("Save failed:", error)
      toastCtx.error("Failed to save project")
    } finally {
      setIsSaving(false)
    }
  }, [
    timeline.media,
    timeline.timelineClips,
    timeline.tracks,
    storyboard.panels,
    videoConfig,
    storyboard.masterDescription,
    toastCtx,
  ])

  const handleLoadProject = useCallback(async () => {
    try {
      const projectData = await loadProjectFromFile()
      if (!projectData) return

      const {
        media,
        timelineClips,
        tracks,
        storyboardPanels: loadedStoryboard,
        videoConfig: loadedConfig,
        masterDescription: loadedDescription,
      } = deserializeProject(projectData)

      // Update all state
      timeline.setMedia(media)
      timeline.setTimelineClips(timelineClips)
      timeline.setTracks(tracks)
      storyboard.setPanels(loadedStoryboard)
      setVideoConfig(loadedConfig)
      if (loadedDescription) storyboard.setMasterDescription(loadedDescription)

      toastCtx.success(`Loaded project: ${projectData.name}`)
    } catch (error) {
      console.error("Load failed:", error)
      toastCtx.error("Failed to load project")
    }
  }, [timeline, storyboard, toastCtx])

  useEffect(() => {
    if (hasAutosave() && !initialMedia?.length && !initialClips?.length) {
      const loadAutosavedProject = async () => {
        const confirmed = window.confirm("An autosaved project was found. Would you like to restore it?")
        if (confirmed) {
          const autosaveData = loadAutosave()
          if (autosaveData) {
            const {
              media,
              timelineClips,
              tracks,
              storyboardPanels: loadedStoryboard,
              videoConfig: loadedConfig,
              masterDescription: loadedDescription,
            } = deserializeProject(autosaveData)

            timeline.setMedia(media)
            timeline.setTimelineClips(timelineClips)
            timeline.setTracks(tracks)
            storyboard.setPanels(loadedStoryboard)
            setVideoConfig(loadedConfig)
            if (loadedDescription) storyboard.setMasterDescription(loadedDescription)

            toastCtx.info("Restored autosaved project")
          }
        } else {
          clearAutosave()
        }
      }
      loadAutosavedProject()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (timeline.timelineClips.length === 0 && timeline.media.length === 0) return

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current)
    }

    autosaveTimeoutRef.current = setTimeout(() => {
      autosaveProject(
        timeline.media,
        timeline.timelineClips,
        timeline.tracks,
        storyboard.panels,
        videoConfig,
        storyboard.masterDescription,
      )
    }, AUTOSAVE_CONSTANTS.DEBOUNCE_MS) // Autosave after 5 seconds of inactivity

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current)
      }
    }
  }, [
    timeline.media,
    timeline.timelineClips,
    timeline.tracks,
    storyboard.panels,
    videoConfig,
    storyboard.masterDescription,
  ])

  const handleLoadDemo = useCallback(() => {
    const hasExistingContent =
      timeline.media.length > 0 || timeline.timelineClips.length > 0 || storyboard.panels.length > 0

    if (hasExistingContent) {
      const confirmed = window.confirm("Loading the demo project will replace your current work. Continue?")
      if (!confirmed) return
    }

    const demoData = createDemoData()

    timeline.setMedia(demoData.initialMedia)
    timeline.setTimelineClips(demoData.initialClips)
    storyboard.setPanels(demoData.initialStoryboard)

    // Clear autosave since we're loading demo
    clearAutosave()

    toastCtx.success("Demo project loaded!")
  }, [timeline, storyboard, toastCtx])

  // View change handler
  const handleViewChange = useCallback((view: SidebarView) => {
    setActiveView(view)
    setIsPanelOpen(true)
  }, [])

  const handleAddMarker = useCallback((marker: Omit<Marker, "id">) => {
    const newMarker: Marker = {
      ...marker,
      id: `marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
    setMarkers((prev) => [...prev, newMarker].sort((a, b) => a.time - b.time))
  }, [])

  const handleMarkerClick = useCallback(
    (marker: Marker) => {
      playback.handleSeek(marker.time) // Use playback.handleSeek to update currentTime
    },
    [playback.handleSeek],
  ) // Depend on playback.handleSeek

  const handleMarkerDelete = useCallback((markerId: string) => {
    setMarkers((prev) => prev.filter((m) => m.id !== markerId))
  }, [])

  const handleMarkerUpdate = useCallback((markerId: string, changes: Partial<Marker>) => {
    setMarkers((prev) =>
      prev.map((m) => (m.id === markerId ? { ...m, ...changes } : m)).sort((a, b) => a.time - b.time),
    )
  }, [])

  const handleZoomToFit = useCallback(() => {
    // Ensure clips is accessed from timeline state
    const { timelineClips: clips, setZoomLevel } = timeline
    if (clips.length === 0) return
    const maxEnd = Math.max(...clips.map((c) => c.start + c.duration))
    if (maxEnd <= 0) return
    // Calculate zoom to fit content with some padding
    const containerWidth = 800 // approximate timeline width
    const newZoom = Math.max(10, Math.min(200, (containerWidth - 100) / maxEnd))
    setZoomLevel(newZoom)
  }, [timeline, timeline.setZoomLevel]) // Depend on timeline and timeline.setZoomLevel

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        handleSaveProject()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "o") {
        e.preventDefault()
        handleLoadProject()
      }
      if (e.key === "f" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        // Try to capture from the active video element for highest quality
        const videoElement = playback.isPreviewPlayback
          ? playback.previewVideoRef?.current
          : playback.videoRefA.current && Number.parseFloat(playback.videoRefA.current.style.opacity || "1") > 0
            ? playback.videoRefA?.current
            : playback.videoRefB?.current

        if (videoElement && videoElement.readyState >= 2) {
          const width = videoElement.videoWidth || 1920
          const height = videoElement.videoHeight || 1080

          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext("2d", {
            alpha: false,
            willReadFrequently: false,
          })

          if (ctx) {
            ctx.imageSmoothingEnabled = false
            ctx.drawImage(videoElement, 0, 0, width, height)

            const mins = Math.floor(playback.currentTime / 60)
            const secs = Math.floor(playback.currentTime % 60)
            const ms = Math.floor((playback.currentTime % 1) * 1000)
            const timecode = `${mins.toString().padStart(2, "0")}-${secs.toString().padStart(2, "0")}-${ms.toString().padStart(3, "0")}`
            const filename = `frame_${timecode}_${width}x${height}.png`

            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = filename
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
                toastCtx.success("Frame saved as PNG")
              }
            }, "image/png")
          }
        } else {
          toastCtx.error("No video frame available to capture")
        }
      }
      if (e.key === "m" || e.key === "M") {
        e.preventDefault()
        setShowAddMarkerDialog(true)
        return
      }

      if (e.key === "z" && e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        handleZoomToFit()
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    handleSaveProject,
    handleLoadProject,
    playback,
    toastCtx,
    handleZoomToFit, // Add handleZoomToFit to dependencies
    setShowAddMarkerDialog, // Add setShowAddMarkerDialog to dependencies
    timeline, // Ensure timeline is available for handleZoomToFit
  ])

  // Project Name State
  const [projectName, setProjectName] = useState<string>("Untitled Project")

  useEffect(() => {
    // Attempt to load project name from autosave or set a default
    const autosaveData = loadAutosave()
    if (autosaveData && autosaveData.name) {
      setProjectName(autosaveData.name)
    } else {
      // If no autosave, check for initial project name if provided (though initialProps don't include name)
      // For now, default to "Untitled Project"
      setProjectName("Untitled Project")
    }
  }, [initialMedia, initialClips]) // Rerun if initial props change, though unlikely

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#09090b] text-neutral-200 font-sans selection:bg-indigo-500/30">
      {/* Main editor row */}
      <div className="flex flex-1 min-h-0">
        {/* Modals */}
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => {
            if (!ffmpeg.isExporting) setIsExportModalOpen(false)
          }}
          onStartExport={(resolution) => startExport(resolution, "all")}
          isExporting={ffmpeg.isExporting}
          exportProgress={ffmpeg.exportProgress}
          exportPhase={ffmpeg.exportPhase}
          downloadUrl={ffmpeg.downloadUrl}
          onCancel={handleCancelExport}
          hasRenderedPreview={!!ffmpeg.renderedPreviewUrl && !ffmpeg.isPreviewStale}
          ffmpegError={ffmpeg.ffmpegError} // Added ffmpegError prop
        />
        <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />

        {/* Hidden audio elements */}
        {timeline.tracks
          .filter((t) => t.type === "audio")
          .map((track) => (
            <audio
              key={track.id}
              ref={(el) => {
                if (el) playback.audioRefs.current[track.id] = el
              }}
              className="hidden"
              crossOrigin="anonymous"
            />
          ))}
        <canvas ref={playback.canvasRef as React.RefObject<HTMLCanvasElement>} className="hidden" />

        <EditorSidebar
          activeView={activeView}
          isPanelOpen={isPanelOpen}
          onViewChange={handleViewChange}
          onTogglePanel={() => setIsPanelOpen(!isPanelOpen)}
          onBack={onBack}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <EditorHeader
            onBack={onBack}
            onUndo={timeline.undo}
            onRedo={timeline.redo}
            onExport={() => setIsExportModalOpen(true)}
            onShowShortcuts={() => setIsShortcutsOpen(true)}
            onSave={handleSaveProject}
            onLoad={handleLoadProject}
            onLoadDemo={handleLoadDemo}
            isSaving={isSaving}
            canUndo={timeline.history.length > 0}
            canRedo={timeline.future.length > 0}
          />

          <div className="flex-1 flex overflow-hidden relative">
            {/* Sidebar panel - Wrap each panel in PanelErrorBoundary */}
            {isPanelOpen && !isCinemaMode && (
              <div
                className="flex flex-col border-r border-neutral-800 bg-[#09090b] shrink-0 relative"
                style={{ width: sidebarWidth }}
              >
                {/* Wrap panel content in ErrorBoundary */}
                <ErrorBoundary>
                  {activeView === "library" && (
                    <PanelErrorBoundary fallbackTitle="Library Error">
                      <ProjectLibrary
                        media={timeline.media}
                        selectedId={timeline.selectedClipIds[0]}
                        onSelect={(m) => timeline.setSelectedClipIds([m.id])}
                        onAddToTimeline={timeline.handleAddToTimeline}
                        onImport={mediaGeneration.importFile}
                        onRemove={timeline.handleRemoveMedia}
                        onClose={() => setIsPanelOpen(false)}
                      />
                    </PanelErrorBoundary>
                  )}
                  {activeView === "create" && (
                    <PanelErrorBoundary fallbackTitle="Create Panel Error">
                      <CreatePanel
                        onGenerate={mediaGeneration.generate}
                        isGenerating={mediaGeneration.isGenerating}
                        onClose={() => setIsPanelOpen(false)}
                        generatedItem={mediaGeneration.generatedItem}
                      />
                    </PanelErrorBoundary>
                  )}
                  {activeView === "settings" && (
                    <PanelErrorBoundary fallbackTitle="Settings Error">
                      <SettingsPanel
                        onClose={() => setIsPanelOpen(false)}
                        onClearTimeline={() => timeline.setTimelineClips([])}
                        onClearLibrary={() => timeline.setMedia([])}
                        onClearAll={() => {
                          timeline.setTimelineClips([])
                          timeline.setMedia([])
                          storyboard.setPanels([])
                          storyboard.setMasterDescription("")
                          playback.setCurrentTime(0)
                          playback.setIsPlaying(false)
                          clearAutosave()
                          toastCtx.success("Started new project")
                        }}
                        defaultDuration={defaultDuration}
                        onDurationChange={setDefaultDuration}
                      />
                    </PanelErrorBoundary>
                  )}
                  {activeView === "transitions" && (
                    <PanelErrorBoundary fallbackTitle="Transitions Error">
                      <TransitionsPanel
                        onClose={() => setIsPanelOpen(false)}
                        clips={timeline.timelineClips}
                        selectedClipIds={timeline.selectedClipIds}
                        onUpdateClip={timeline.handleClipUpdate}
                        onApplyTransition={() => { }}
                        selectedClipId={timeline.selectedClipIds[0] ?? null}
                      />
                    </PanelErrorBoundary>
                  )}
                  {activeView === "inspector" && (
                    <PanelErrorBoundary fallbackTitle="Inspector Error">
                      <InspectorPanel
                        selectedClipId={timeline.selectedClipIds[0] ?? null}
                        clips={timeline.timelineClips}
                        mediaMap={timeline.mediaMap}
                        onUpdateClip={timeline.handleClipUpdate}
                        onClose={() => setIsPanelOpen(false)}
                        tracks={timeline.tracks}
                        onDeleteClip={(id) => timeline.handleDeleteClip([id])}
                        onDuplicateClip={(id) => timeline.handleDuplicateClip([id])}
                        onSplitClip={timeline.handleSplitClip}
                      />
                    </PanelErrorBoundary>
                  )}
                  {activeView === "storyboard" && (
                    <PanelErrorBoundary fallbackTitle="Storyboard Error">
                      <StoryboardPanelComponent
                        panels={storyboard.panels}
                        onAddPanel={storyboard.addPanel}
                        onUpdatePanel={storyboard.updatePanel}
                        onDeletePanel={storyboard.deletePanel}
                        onGenerateImage={storyboard.generateImage}
                        onGenerateVideo={storyboard.generateVideo}
                        onUpscaleImage={storyboard.upscaleImage}
                        onAddToTimeline={handleAddStoryboardToTimeline}
                        videoConfig={videoConfig}
                        onVideoConfigChange={setVideoConfig}
                        masterDescription={storyboard.masterDescription}
                        onMasterDescriptionChange={storyboard.setMasterDescription}
                        onClose={() => setIsPanelOpen(false)}
                        isEnhancingMaster={isEnhancingMaster}
                        setIsEnhancingMaster={setIsEnhancingMaster}
                        setIsEnhancing={setIsEnhancing}
                        setMasterDescription={storyboard.setMasterDescription}
                        setPrompt={setPrompt}
                        setVideoConfig={setVideoConfig}
                      />
                    </PanelErrorBoundary>
                  )}
                </ErrorBoundary>

                {/* Sidebar resize handle */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-indigo-500/50 transition-colors"
                  onMouseDown={(e) => {
                    setIsResizingSidebar(true)
                    sidebarResizeRef.current = { startX: e.clientX, startWidth: sidebarWidth }
                  }}
                />
              </div>
            )}

            {/* Main preview area */}
            <div className="flex-1 flex flex-col bg-[#09090b] min-w-0">
              {/* Preview Player - Wrap in PanelErrorBoundary */}
              <PanelErrorBoundary fallbackTitle="Preview Error">
                <PreviewPlayer
                  currentTime={playback.currentTime}
                  isPlaying={playback.isPlaying}
                  duration={timeline.timelineDuration}
                  onSeek={playback.handleSeek}
                  onTogglePlay={() => playback.setIsPlaying((p) => !p)}
                  videoRefA={playback.videoRefA}
                  videoRefB={playback.videoRefB}
                  whiteOverlayRef={playback.whiteOverlayRef}
                  previewVideoRef={playback.previewVideoRef}
                  renderedPreviewUrl={ffmpeg.renderedPreviewUrl}
                  isPreviewPlayback={playback.isPreviewPlayback}
                  isPreviewStale={ffmpeg.isPreviewStale}
                  onRenderPreview={handleRenderPreview}
                  isRendering={ffmpeg.isRendering}
                  renderProgress={ffmpeg.renderProgress}
                  onTogglePreviewPlayback={() => playback.setIsPreviewPlayback(!playback.isPreviewPlayback)}
                  playerZoom={playerZoom}
                  onZoomChange={setPlayerZoom}
                  isCinemaMode={isCinemaMode}
                  onToggleCinemaMode={() => setIsCinemaMode((p) => !p)}
                  isSafeGuidesVisible={isSafeGuidesVisible}
                  onToggleSafeGuides={() => setIsSafeGuidesVisible((p) => !p)}
                  ffmpegLoaded={ffmpeg.ffmpegLoaded}
                  ffmpegLoading={ffmpeg.ffmpegLoading}
                  onLoadFFmpeg={ffmpeg.loadFFmpeg}
                  timelineClips={timeline.timelineClips}
                  mediaMap={timeline.mediaMap}
                  isExporting={ffmpeg.isExporting}
                  onPlay={() => playback.setIsPlaying(true)}
                  onZoomReset={() => setPlayerZoom(1)}
                  activeClip={timeline.timelineClips.find(
                    (c) =>
                      c.trackId.startsWith("video") &&
                      playback.currentTime >= c.start &&
                      playback.currentTime < c.start + c.duration,
                  )}
                  // Pass text clips to preview player for rendering text overlays
                  textClips={timeline.timelineClips.filter((c) => {
                    const track = timeline.tracks.find((t) => t.id === c.trackId)
                    return track?.type === "text" && c.textOverlay
                  })}
                />
              </PanelErrorBoundary>

              {/* Timeline - Wrap in PanelErrorBoundary */}
              {!isCinemaMode && (
                <PanelErrorBoundary fallbackTitle="Timeline Error">
                  <div
                    className="border-t border-neutral-800 flex flex-col shrink-0"
                    style={{ height: timelineHeight }}
                  >
                    {/* Resize handle */}
                    <div
                      className="h-1 cursor-ns-resize hover:bg-indigo-500/50 transition-colors"
                      onMouseDown={(e) => {
                        setIsResizingTimeline(true)
                        resizeRef.current = { startY: e.clientY, startHeight: timelineHeight }
                      }}
                    />
                    <Timeline
                      tracks={timeline.tracks}
                      clips={timeline.timelineClips}
                      mediaMap={timeline.mediaMap}
                      currentTime={playback.currentTime}
                      duration={timeline.timelineDuration}
                      zoomLevel={timeline.zoomLevel}
                      selectedClipIds={timeline.selectedClipIds}
                      tool={timeline.tool}
                      isPlaying={playback.isPlaying}
                      isLooping={isLooping}
                      onPlayPause={() => playback.setIsPlaying((p) => !p)}
                      onToggleLoop={() => setIsLooping((l) => !l)}
                      onSeek={playback.handleSeek}
                      onZoomChange={timeline.setZoomLevel}
                      onToolChange={timeline.setTool}
                      onSelectClips={timeline.handleSelectClips}
                      onClipUpdate={timeline.handleClipUpdate}
                      onTrackUpdate={timeline.handleTrackUpdate}
                      onSplitClip={timeline.handleSplitClip}
                      onDeleteClip={timeline.handleDeleteClip}
                      onRippleDeleteClip={timeline.handleRippleDeleteClip}
                      onDuplicateClip={timeline.handleDuplicateClip}
                      onDragStart={timeline.pushToHistory}
                      onDetachAudio={timeline.handleDetachAudio}
                      onExportAudio={handleExportAudio}
                      isRendering={ffmpeg.isRendering}
                      renderProgress={ffmpeg.renderProgress}
                      renderedPreviewUrl={ffmpeg.renderedPreviewUrl}
                      isPreviewStale={ffmpeg.isPreviewStale}
                      onRenderPreview={handleRenderPreview}
                      onCancelRender={handleCancelRender}
                      isPreviewPlayback={playback.isPreviewPlayback}
                      onTogglePreviewPlayback={playback.handleTogglePreviewPlayback}
                      historyCount={timeline.history.length}
                      futureCount={timeline.future.length}
                      onUndo={timeline.undo}
                      onRedo={timeline.redo}
                      onShowShortcuts={() => setIsShortcutsOpen(true)}
                      markers={markers}
                      onAddMarker={() => setShowAddMarkerDialog(true)}
                      onMarkerClick={handleMarkerClick}
                      onMarkerDelete={handleMarkerDelete}
                      onMarkerUpdate={handleMarkerUpdate}
                      onZoomToFit={handleZoomToFit}
                      onOverwriteClips={timeline.handleOverwriteClips}
                    />
                  </div>
                </PanelErrorBoundary>
              )}
            </div>
          </div>
        </div>
      </div>

      <StatusBar
        projectName={projectName}
        totalDuration={timeline.timelineDuration}
        clipCount={timeline.timelineClips.length}
        trackCount={timeline.tracks.length}
        isSaving={isSaving}
        isExporting={ffmpeg.isExporting}
        isGenerating={mediaGeneration.isGenerating}
        isRendering={ffmpeg.isRendering}
        zoomLevel={timeline.zoomLevel}
      />

      {/* Add marker dialog */}
      <AddMarkerDialog
        isOpen={showAddMarkerDialog}
        onClose={() => setShowAddMarkerDialog(false)}
        onAdd={handleAddMarker}
        time={playback.currentTime} // Use playback.currentTime for the marker time
      />
    </div>
  )
}

export default Editor
