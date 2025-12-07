"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import type { MediaItem, TimelineClip, Track, StoryboardPanel as IStoryboardPanel, VideoConfig } from "../types"
import type { Generation } from "@/components/image-combiner/types" // Added import for Generation

import { useFFmpeg } from "../hooks/use-ffmpeg"
import { usePlayback } from "../hooks/use-playback"
import { useTimelineState } from "../hooks/use-timeline-state"
import { useRafCallback } from "../hooks/use-debounced-callback"
import { useTimelineKeyboard } from "../hooks/use-timeline-keyboard"

import { PreviewPlayer } from "./preview-player"
import { EditorHeader } from "./editor-header"
import { EditorSidebar, type SidebarView } from "./editor-sidebar"
import { ErrorBoundary } from "./error-boundary"

import { ProjectLibrary } from "./project-library"
import { CreatePanel } from "./create-panel"
import { SettingsPanel } from "./settings-panel"
import { TransitionsPanel } from "./transitions-panel"
import { InspectorPanel } from "./inspector-panel"
import { StoryboardPanel } from "./storyboard-panel"
import { ExportModal } from "./export-modal"
import { ShortcutsModal } from "./shortcuts-modal"
import { Timeline } from "./timeline"
import { audioBufferToWav } from "../utils/audio-processing"
import { useShortcuts } from "../hooks/use-shortcuts"
import { useImageGeneration } from "@/components/image-combiner/hooks/use-image-generation"
import { useImageUpload } from "@/components/image-combiner/hooks/use-image-upload"
import { useAspectRatio } from "@/components/image-combiner/hooks/use-aspect-ratio"
import { useMobile } from "@/hooks/use-mobile"
import { useToastContext } from "@/components/ui/sonner"

const INITIAL_TRACKS: Track[] = [
  { id: "v1", name: "Video 1", type: "video", volume: 1 },
  { id: "v2", name: "Video 2", type: "video", volume: 1 },
  { id: "a1", name: "Audio 1", type: "audio", volume: 1 },
  { id: "a2", name: "Audio 2", type: "audio", volume: 1 },
]

interface EditorProps {
  initialMedia?: MediaItem[]
  initialClips?: TimelineClip[]
  initialStoryboard?: IStoryboardPanel[]
  onBack: () => void
}

export const Editor: React.FC<EditorProps> = ({ initialMedia, initialClips, initialStoryboard, onBack }) => {
  // FFmpeg Local State
  // const ffmpegRef = useRef<FFmpeg | null>(null) // REMOVED, now handled by useFFmpeg
  // const [ffmpegLoaded, setFfmpegLoaded] = useState(false) // REMOVED, now handled by useFFmpeg
  // const [ffmpegLoading, setFfmpegLoading] = useState(false) // REMOVED, now handled by useFFmpeg

  const isMobile = useMobile()
  const { toast: toastCtx } = useToastContext()

  const ffmpeg = useFFmpeg()

  const timeline = useTimelineState({
    initialMedia,
    initialClips,
    initialStoryboard,
    onPreviewStale: () => ffmpeg.setIsPreviewStale(true),
  })

  const handleExportAudio = useCallback(
    async (clipId: string) => {
      const clip = timeline.timelineClips.find((c) => c.id === clipId)
      if (!clip) return

      const media = timeline.mediaMap[clip.mediaId]
      if (!media?.url) {
        toastCtx.error("No audio source found for this clip")
        return
      }

      try {
        toastCtx.info("Processing audio clip...")

        // Fetch the audio data
        const response = await fetch(media.url)
        const arrayBuffer = await response.arrayBuffer()

        // Create offline audio context to decode and extract the audio segment
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

        // Calculate the segment to extract based on clip offset and duration
        const sampleRate = audioBuffer.sampleRate
        const startSample = Math.floor(clip.offset * sampleRate)
        const durationSamples = Math.floor(clip.duration * sampleRate)
        const endSample = Math.min(startSample + durationSamples, audioBuffer.length)
        const actualDurationSamples = endSample - startSample

        // Create a new buffer for the segment
        const segmentBuffer = audioContext.createBuffer(audioBuffer.numberOfChannels, actualDurationSamples, sampleRate)

        // Copy the segment data
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          const sourceData = audioBuffer.getChannelData(channel)
          const destData = segmentBuffer.getChannelData(channel)
          for (let i = 0; i < actualDurationSamples; i++) {
            destData[i] = sourceData[startSample + i]
          }
        }

        // Convert to WAV
        const wavData = audioBufferToWav(segmentBuffer)
        const blob = new Blob([wavData], { type: "audio/wav" })
        const url = URL.createObjectURL(blob)

        // Trigger download
        const a = document.createElement("a")
        a.href = url
        a.download = `audio_export_${Date.now()}.wav`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        // Cleanup
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        audioContext.close()

        toastCtx.success("Audio file downloaded successfully")
      } catch (error) {
        console.error("Audio export failed:", error)
        toastCtx.error("Failed to export audio clip")
      }
    },
    [timeline.timelineClips, timeline.mediaMap, toastCtx],
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

  // --- State ---
  // const [media, setMedia] = useState<MediaItem[]>(initialMedia || []) // REMOVED, now handled by useTimelineState
  // const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS) // REMOVED, now handled by useTimelineState

  // Storyboard State
  const [storyboardPanels, setStoryboardPanels] = useState<IStoryboardPanel[]>(initialStoryboard || [])
  const [masterDescription, setMasterDescription] = useState(
    'A live-action flashback scene inspired by the "zoom out to the past" effect from Ratatouille.',
  )
  const [videoConfig, setVideoConfig] = useState<VideoConfig>({ aspectRatio: "16:9", useFastModel: true })

  // Timeline State
  // const [timelineClips, setTimelineClips] = useState<TimelineClip[]>(initialClips || []) // REMOVED, now handled by useTimelineState
  // const [history, setFuture] = useState<TimelineClip[][]>([]) // REMOVED, now handled by useTimelineState
  // const [future, setFuture] = useState<TimelineClip[][]>([]) // REMOVED, now handled by useTimelineState

  // const [currentTime, setCurrentTime] = useState(0) // REMOVED, now handled by usePlayback
  // const [isPlaying, setIsPlaying] = useState(false) // REMOVED, now handled by usePlayback
  // const [zoomLevel, setZoomLevel] = useState(40) // REMOVED, now handled by useTimelineState
  // const [selectedClipIds, setSelectedClipIds] = useState<string[]>([]) // REMOVED, now handled by useTimelineState
  // const [tool, setTool] = useState<"select" | "razor">("select") // REMOVED, now handled by useTimelineState

  // UI State
  const [activeView, setActiveView] = useState<SidebarView>("library")
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [apiKeyReady, setApiKeyReady] = useState(false) // Was not in updates, keeping it
  const [defaultDuration, setDefaultDuration] = useState(5)
  const [playerZoom, setPlayerZoom] = useState(1)
  const [isCinemaMode, setIsCinemaMode] = useState(false)
  const [timelineHeight, setTimelineHeight] = useState(320)
  const [isResizingTimeline, setIsResizingTimeline] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(360)
  const [isResizingSidebar, setIsResizingSidebar] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [isSafeGuidesVisible, setIsSafeGuidesVisible] = useState(false)

  // Export State
  // const [isExportModalOpen, setIsExportModalOpen] = useState(false) // REMOVED, now handled by useFFmpeg
  // const [isExporting, setIsExporting] = useState(false) // REMOVED, now handled by useFFmpeg
  // const [exportProgress, setExportProgress] = useState(0) // REMOVED, now handled by useFFmpeg
  // const [exportPhase, setExportPhase] = useState<"idle" | "init" | "audio" | "video" | "encoding" | "complete">("idle") // REMOVED, now handled by useFFmpeg
  // const [downloadUrl, setDownloadUrl] = useState<string | null>(null) // REMOVED, now handled by useFFmpeg
  // const abortExportRef = useRef(false) // REMOVED, now handled by useFFmpeg
  // const exportCancelledRef = useRef(false) // REMOVED, now handled by useFFmpeg
  const [isExportModalOpen, setIsExportModalOpen] = useState(false) // Added back for the modal itself

  // Render Preview State
  // const [isRendering, setIsRendering] = useState(false) // REMOVED, now handled by useFFmpeg
  // const [renderProgress, setRenderProgress] = useState(0) // REMOVED, now handled by useFFmpeg
  // const [renderedPreviewUrl, setRenderedPreviewUrl] = useState<string | null>(null) // REMOVED, now handled by useFFmpeg
  // const [isPreviewStale, setIsPreviewStale] = useState(false) // REMOVED, now handled by useFFmpeg
  // const renderCancelledRef = useRef(false) // REMOVED, now handled by useFFmpeg
  // const [isPreviewPlayback, setIsPreviewPlayback] = useState(false) // REMOVED, now handled by usePlayback

  // Refs for rendering
  // const videoRefA = useRef<HTMLVideoElement>(null) // REMOVED, now handled by usePlayback
  // const videoRefB = useRef<HTMLVideoElement>(null) // REMOVED, now handled by usePlayback
  // const whiteOverlayRef = useRef<HTMLDivElement>(null) // REMOVED, now handled by usePlayback
  // const previewVideoRef = useRef<HTMLVideoElement>(null) // REMOVED, now handled by usePlayback
  // const audioRefs = useRef<Record<string, HTMLAudioElement>>({}) // REMOVED, now handled by usePlayback
  // const canvasRef = useRef<HTMLCanvasElement>(null) // REMOVED, now handled by usePlayback

  // Audio Context // REMOVED, now handled by usePlayback
  // const audioContextRef = useRef<AudioContext | null>(null)
  // const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  // const sourceNodesRef = useRef<Map<string, MediaElementAudioSourceNode>>(new Map())

  // const requestRef = useRef<number | null>(null) // REMOVED, now handled by usePlayback
  // const lastTimeRef = useRef<number | null>(null) // REMOVED, now handled by usePlayback
  const resizeRef = useRef<{ startY: number; startHeight: number } | null>(null)
  const sidebarResizeRef = useRef<{ startX: number; startWidth: number } | null>(null)

  const objectUrlsRef = useRef<string[]>([])
  const isMountedRef = useRef(true)

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
      const maxH = typeof window !== "undefined" ? window.innerHeight - 300 : 800
      const newHeight = Math.max(200, Math.min(maxH, resizeRef.current.startHeight + deltaY))
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
        const newWidth = Math.max(240, Math.min(600, proposedWidth))
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

  // const mediaMap = useMemo(() => { // REMOVED, now handled by useTimelineState
  //   return media.reduce((acc, item) => ({ ...acc, [item.id]: item }), {} as Record<string, MediaItem>)
  // }, [media])

  // Derived Stats
  // const contentDuration = Math.max(0, ...timelineClips.map((c) => c.start + c.duration)) // REMOVED, now handled by useTimelineState
  // const timelineDuration = Math.max(30, contentDuration) + 5 // REMOVED, now handled by useTimelineState

  // const selectionBounds = useMemo(() => { // REMOVED, now handled by useTimelineState
  //   if (selectedClipIds.length === 0) return null
  //   const selectedClips = timelineClips.filter((c) => selectedClipIds.includes(c.id))
  //   if (selectedClips.length === 0) return null
  //   const start = Math.min(...selectedClips.map((c) => c.start))
  //   const end = Math.max(...selectedClips.map((c) => c.start + c.duration))
  //   return { start, end }
  // }, [selectedClipIds, timelineClips])

  // FFmpeg Loading Logic // REMOVED, now handled by useFFmpeg
  // const loadFFmpeg = useCallback(async () => {
  //   if (ffmpegLoaded) return
  //   if (ffmpegLoading) return

  //   setFfmpegLoading(true)

  //   if (!ffmpegRef.current) {
  //     ffmpegRef.current = new FFmpeg()
  //   }
  //   const ffmpeg = ffmpegRef.current

  //   ffmpeg.on("log", ({ message }) => {
  //     console.log("[FFmpeg]", message)
  //   })

  //   try {
  //     const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd"
  //     await ffmpeg.load({
  //       coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
  //       wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  //     })
  //     setFfmpegLoaded(true)
  //   } catch (e) {
  //     console.error("FFmpeg load failed:", e)
  //     throw e
  //   } finally {
  //     setFfmpegLoading(false)
  //   }
  // }, [ffmpegLoaded, ffmpegLoading])

  // History Actions // REMOVED, now handled by useTimelineState
  // const pushToHistory = useCallback(() => {
  //   setHistory((prev) => [...prev, timelineClips])
  //   setFuture([])
  // }, [timelineClips])

  // const undo = useCallback(() => {
  //   if (history.length === 0) return
  //   const previousState = history[history.length - 1]
  //   const newHistory = history.slice(0, -1)
  //   setFuture((prev) => [timelineClips, ...prev])
  //   setTimelineClips(previousState)
  //   setHistory(newHistory)
  // }, [history, timelineClips])

  // const redo = useCallback(() => {
  //   if (future.length === 0) return
  //   const nextState = future[0]
  //   const newFuture = future.slice(1)
  //   setHistory((prev) => [...prev, timelineClips])
  //   setTimelineClips(nextState)
  //   setFuture(newFuture)
  // }, [future, timelineClips])

  // const handleClipUpdate = useCallback((id: string, chg: Partial<TimelineClip>) => {
  //   setTimelineClips((prev) => prev.map((c) => (c.id === id ? { ...c, ...chg } : c)))
  //   setIsPreviewStale(true) // Mark preview as needing re-render
  // }, [])

  // const handleTrackUpdate = useCallback((id: string, chg: Partial<Track>) => {
  //   setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, ...chg } : t)))
  // }, [])

  // const handleAddTrack = useCallback((type: "video" | "audio") => {
  //   setTracks((prev) => {
  //     const count = prev.filter((t) => t.type === type).length + 1
  //     const prefix = type === "video" ? "v" : "a"
  //     const newId = `${prefix}${Date.now()}`
  //     return [
  //       ...prev,
  //       {
  //         id: newId,
  //         name: `${type === "video" ? "Video" : "Audio"} ${count}`,
  //         type,
  //         volume: 1,
  //       },
  //     ]
  //   })
  // }, [])

  // const handleSeek = useCallback((time: number) => {
  //   setCurrentTime(time)
  // }, [])

  // const handleZoomChange = useCallback((zoom: number) => {
  //   setZoomLevel(zoom)
  // }, [])

  // const handleSelectClips = useCallback((ids: string[]) => {
  //   setSelectedClipIds(ids)
  // }, [])

  // Storyboard Handlers
  const handleAddStoryboardPanel = useCallback(() => {
    setStoryboardPanels((prev) => [
      ...prev,
      { id: `sb-${Date.now()}`, prompt: "", status: "idle", type: "scene", duration: 5 },
    ])
  }, [])

  const handleUpdateStoryboardPanel = useCallback((id: string, changes: Partial<IStoryboardPanel>) => {
    setStoryboardPanels((prev) => prev.map((p) => (p.id === id ? { ...p, ...changes } : p)))
  }, [])

  const handleDeleteStoryboardPanel = useCallback((id: string) => {
    setStoryboardPanels((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const handleStoryboardImageGenerate = useCallback(
    async (panelId: string, prompt: string) => {
      if (!prompt.trim()) return
      handleUpdateStoryboardPanel(panelId, { status: "generating-image", error: undefined })

      try {
        let apiAspectRatio = "landscape"
        if (videoConfig.aspectRatio === "9:16") apiAspectRatio = "portrait"
        else if (videoConfig.aspectRatio === "1:1") apiAspectRatio = "square"

        const formData = new FormData()
        formData.append("mode", "text-to-image")
        formData.append("prompt", prompt)
        formData.append("aspectRatio", apiAspectRatio)

        const response = await fetch("/api/generate-image", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.error || "Image generation failed")
        }

        const result = await response.json()
        handleUpdateStoryboardPanel(panelId, { imageUrl: result.url, status: "idle" })
      } catch (error: any) {
        handleUpdateStoryboardPanel(panelId, { status: "error", error: error.message || "Image generation failed" })
      }
    },
    [videoConfig.aspectRatio, handleUpdateStoryboardPanel],
  )

  const handleStoryboardVideoGenerate = useCallback(
    async (panelId: string, prompt: string, image1Base64?: string, image2Base64?: string, useFastModel?: boolean) => {
      handleUpdateStoryboardPanel(panelId, { status: "generating-video", error: undefined })
      const panel = storyboardPanels.find((p) => p.id === panelId)

      try {
        const body = {
          prompt: prompt || "A smooth cinematic motion sequence",
          imageUrl: image1Base64 || panel?.imageUrl,
          linkedImageUrl: image2Base64 || panel?.linkedImageUrl,
          aspectRatio: videoConfig.aspectRatio,
          duration: panel?.duration || 5,
          useFastModel: useFastModel ?? videoConfig.useFastModel,
        }

        const response = await fetch("/api/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Video generation failed")
        }

        const result = await response.json()

        if (result.data?.video?.url) {
          const videoUrl = result.data.video.url
          const mediaId = `media-sb-${panelId}-${Date.now()}`
          const newMedia: MediaItem = {
            id: mediaId,
            url: videoUrl,
            prompt: prompt,
            duration: panel?.duration || 5,
            aspectRatio: videoConfig.aspectRatio,
            status: "ready",
            type: "video",
            resolution: { width: 1280, height: 720 },
          }
          timeline.setMedia((prev) => [newMedia, ...prev])
          handleUpdateStoryboardPanel(panelId, { videoUrl, status: "idle", mediaId })
        } else {
          throw new Error("No video URL in response")
        }
      } catch (error: any) {
        handleUpdateStoryboardPanel(panelId, { status: "error", error: error.message || "Video generation failed" })
      }
    },
    [videoConfig, storyboardPanels, handleUpdateStoryboardPanel, timeline],
  )

  const handleStoryboardImageUpscale = useCallback(
    async (panelId: string, imageUrl: string, isLinkedImage = false) => {
      if (!imageUrl) return
      handleUpdateStoryboardPanel(panelId, { status: "enhancing", error: undefined })

      try {
        const response = await fetch("/api/upscale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl, scale: 2 }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Upscale failed")
        }

        const result = await response.json()

        if (result.url) {
          if (isLinkedImage) {
            handleUpdateStoryboardPanel(panelId, { linkedImageUrl: result.url, status: "idle" })
          } else {
            handleUpdateStoryboardPanel(panelId, { imageUrl: result.url, status: "idle" })
          }
          toastCtx.success("Image upscaled successfully!")
        } else {
          throw new Error("No upscaled URL in response")
        }
      } catch (error: any) {
        handleUpdateStoryboardPanel(panelId, { status: "error", error: error.message || "Upscale failed" })
        toastCtx.error("Failed to upscale image")
      }
    },
    [handleUpdateStoryboardPanel, toastCtx],
  )

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
    onOutOfCredits: () => {},
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
            "23",
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
          } catch (e) {}
          try {
            await ffmpegInstance.deleteFile("output.mp4")
          } catch (e) {}
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

      // Full render path (condensed for brevity - same logic as before)
      try {
        const fps = 30
        const dt = 1 / fps

        // Audio render
        ffmpeg.setExportPhase("audio")
        const sampleRate = 44100
        const totalFrames = Math.ceil(exportDuration * sampleRate)
        const OfflineCtx = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext
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
            } catch (e) {}
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
              0.9,
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
        } catch (e) {}
        try {
          await ffmpegInstance.deleteFile("output.mp4")
        } catch (e) {}
        for (let i = 0; i < frameCount; i++) {
          try {
            await ffmpegInstance.deleteFile(`frame${i.toString().padStart(4, "0")}.jpg`)
          } catch (e) {}
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
      // Audio render (condensed)
      const sampleRate = 44100
      const totalFrames = Math.ceil(contentDuration * sampleRate)
      const OfflineCtx = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext
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
          } catch (e) {}
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
          gainNode.gain.setValueAtTime((track?.volume ?? 1) * (clip.volume ?? 1), offlineCtx.currentTime + clip.start)
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
            0.85,
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
        "28",
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
      } catch (e) {}
      try {
        await ffmpegInstance.deleteFile("preview.mp4")
      } catch (e) {}
      for (let i = 0; i < frameCount; i++) {
        try {
          await ffmpegInstance.deleteFile(`pframe${i.toString().padStart(4, "0")}.jpg`)
        } catch (e) {}
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
    },
    [timeline.history.length, timeline.future.length, timeline.selectedClipIds],
  )

  // View change handler
  const handleViewChange = useCallback((view: SidebarView) => {
    setActiveView(view)
    setIsPanelOpen(true)
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b] text-neutral-200 font-sans selection:bg-indigo-500/30">
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
      <canvas ref={playback.canvasRef} className="hidden" />

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
          canUndo={timeline.history.length > 0}
          canRedo={timeline.future.length > 0}
        />

        <div className="flex-1 flex overflow-hidden relative">
          {/* Sidebar panel */}
          {isPanelOpen && !isCinemaMode && (
            <div
              className="flex flex-col border-r border-neutral-800 bg-[#09090b] shrink-0 relative"
              style={{ width: sidebarWidth }}
            >
              {/* Wrap panel content in ErrorBoundary */}
              <ErrorBoundary>
                {activeView === "library" && (
                  <ProjectLibrary
                    media={timeline.media}
                    selectedId={timeline.selectedClipIds[0]}
                    onSelect={(m) => timeline.setSelectedClipIds([m.id])}
                    onAddToTimeline={timeline.handleAddToTimeline}
                    onImport={handleImport}
                    onRemove={timeline.handleRemoveMedia}
                    onClose={() => setIsPanelOpen(false)}
                  />
                )}
                {activeView === "create" && (
                  <CreatePanel
                    onGenerate={handleGenerate}
                    isGenerating={isGenerating}
                    onClose={() => setIsPanelOpen(false)}
                    generatedItem={generatedItem}
                  />
                )}
                {activeView === "settings" && (
                  <SettingsPanel
                    onClose={() => setIsPanelOpen(false)}
                    onClearTimeline={() => timeline.setTimelineClips([])}
                    onClearLibrary={() => timeline.setMedia([])}
                    defaultDuration={defaultDuration}
                    onDurationChange={setDefaultDuration}
                  />
                )}
                {activeView === "transitions" && (
                  <TransitionsPanel
                    onClose={() => setIsPanelOpen(false)}
                    onApplyTransition={(t, duration) => {
                      if (timeline.selectedClipIds.length > 0) {
                        const clip = timeline.timelineClips.find((c) => c.id === timeline.selectedClipIds[0])
                        if (clip) {
                          if (t === "none") {
                            // Remove transition entirely
                            timeline.handleClipUpdate(clip.id, { transition: undefined })
                          } else {
                            // Apply transition with specified or safe duration
                            const safeDuration = duration
                              ? Math.min(duration, clip.duration / 2)
                              : Math.min(1.0, clip.duration / 2)
                            timeline.handleClipUpdate(clip.id, { transition: { type: t, duration: safeDuration } })
                          }
                        }
                      }
                    }}
                    selectedClipId={timeline.selectedClipIds[0]}
                    currentTransition={
                      timeline.selectedClipIds.length > 0
                        ? timeline.timelineClips.find((c) => c.id === timeline.selectedClipIds[0])?.transition
                        : undefined
                    }
                  />
                )}
                {activeView === "inspector" && (
                  <InspectorPanel
                    onClose={() => setIsPanelOpen(false)}
                    selectedClipId={timeline.selectedClipIds[0]}
                    clips={timeline.timelineClips}
                    mediaMap={timeline.mediaMap}
                    tracks={timeline.tracks}
                    onUpdateClip={timeline.handleClipUpdate}
                  />
                )}
                {activeView === "storyboard" && (
                  <StoryboardPanel
                    panels={storyboardPanels}
                    masterDescription={masterDescription}
                    setMasterDescription={setMasterDescription}
                    videoConfig={videoConfig}
                    setVideoConfig={setVideoConfig}
                    onClose={() => setIsPanelOpen(false)}
                    onAddPanel={handleAddStoryboardPanel}
                    onUpdatePanel={handleUpdateStoryboardPanel}
                    onDeletePanel={handleDeleteStoryboardPanel}
                    onGenerateImage={handleStoryboardImageGenerate}
                    onGenerateVideo={handleStoryboardVideoGenerate}
                    onUpscaleImage={handleStoryboardImageUpscale}
                    onAddToTimeline={handleAddStoryboardToTimeline}
                    isEnhancingMaster={isEnhancingMaster}
                    setIsEnhancingMaster={setIsEnhancingMaster}
                    setIsEnhancing={setIsEnhancing}
                    setPrompt={setPrompt}
                  />
                )}
              </ErrorBoundary>

              {/* Sidebar resize handle */}
              <div
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 z-50"
                onMouseDown={(e) => {
                  e.preventDefault()
                  setIsResizingSidebar(true)
                  sidebarResizeRef.current = { startX: e.clientX, startWidth: sidebarWidth }
                }}
              />
            </div>
          )}

          {/* Main preview area */}
          <div className="flex-1 flex flex-col bg-[#09090b] min-w-0 relative">
            <PreviewPlayer
              videoRefA={playback.videoRefA}
              videoRefB={playback.videoRefB}
              whiteOverlayRef={playback.whiteOverlayRef}
              previewVideoRef={playback.previewVideoRef}
              isPlaying={playback.isPlaying}
              isExporting={ffmpeg.isExporting}
              isRendering={ffmpeg.isRendering}
              isPreviewPlayback={playback.isPreviewPlayback}
              renderProgress={ffmpeg.renderProgress}
              renderedPreviewUrl={ffmpeg.renderedPreviewUrl}
              playerZoom={playerZoom}
              isSafeGuidesVisible={isSafeGuidesVisible}
              onPlay={() => playback.setIsPlaying(true)}
              onTogglePlay={() => playback.setIsPlaying(!playback.isPlaying)}
              onZoomReset={() => setPlayerZoom(1)}
              onToggleSafeGuides={() => setIsSafeGuidesVisible(!isSafeGuidesVisible)}
              onToggleCinemaMode={() => setIsCinemaMode(!isCinemaMode)}
            />

            {/* Timeline resize handle */}
            {!isCinemaMode && (
              <div
                className="h-1.5 bg-[#09090b] hover:bg-indigo-500/50 cursor-row-resize z-50 w-full border-y border-neutral-900"
                onMouseDown={(e) => {
                  e.preventDefault()
                  setIsResizingTimeline(true)
                  resizeRef.current = { startY: e.clientY, startHeight: timelineHeight }
                }}
              />
            )}

            {/* Timeline */}
            <Timeline
              className={isCinemaMode ? "border-t-0" : ""}
              style={{ height: isCinemaMode ? 40 : timelineHeight }}
              tracks={timeline.tracks}
              clips={timeline.timelineClips}
              mediaMap={timeline.mediaMap}
              currentTime={playback.currentTime}
              duration={timeline.timelineDuration}
              zoomLevel={timeline.zoomLevel}
              isPlaying={playback.isPlaying}
              selectedClipIds={timeline.selectedClipIds}
              tool={timeline.tool}
              onSeek={playback.handleSeek}
              onSelectClips={timeline.handleSelectClips}
              onZoomChange={timeline.handleZoomChange}
              onClipUpdate={timeline.handleClipUpdate}
              onTrackUpdate={timeline.handleTrackUpdate}
              onSplitClip={timeline.handleSplitClip}
              onDetachAudio={timeline.handleDetachAudio}
              onDeleteClip={timeline.handleDeleteClip}
              onRippleDeleteClip={timeline.handleRippleDeleteClip}
              onDuplicateClip={timeline.handleDuplicateClip}
              onToolChange={timeline.onToolChange}
              onDragStart={playback.handleDragStart}
              onAddTrack={timeline.handleAddTrack}
              isRendering={ffmpeg.isRendering}
              renderProgress={ffmpeg.renderProgress}
              renderedPreviewUrl={ffmpeg.renderedPreviewUrl}
              isPreviewStale={ffmpeg.isPreviewStale}
              isPreviewPlayback={playback.isPreviewPlayback}
              onRenderPreview={handleRenderPreview}
              onCancelRender={handleCancelRender}
              onTogglePreviewPlayback={() => playback.setIsPreviewPlayback((p) => !p)}
              onExportAudio={handleExportAudio}
              className="shrink-0"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Editor
