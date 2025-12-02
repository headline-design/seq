"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { checkApiKey, generateVideo, selectApiKey } from "../services/gemini-service"
import type { MediaItem, TimelineClip, Track } from "../types"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { toBlobURL } from "@ffmpeg/util"
import {
    SettingsIcon,
    DownloadIcon,
    PlayIcon,
    GridIcon,
    PlusIcon,
    MaximizeIcon,
    TransitionIcon,
    UndoIcon,
    RedoIcon,
    LogoIcon,
    KeyboardIcon,
    Grid3x3Icon,
    InfoIcon,
} from "./icons"
import { ProjectLibrary } from "./project-library"
import { CreatePanel } from "./create-panel"
import { SettingsPanel } from "./settings-panel"
import { TransitionsPanel } from "./transitions-panel"
import { InspectorPanel } from "./inspector-panel"
import { ExportModal } from "./export-modal"
import { ShortcutsModal } from "./shortcuts-modal"
import { Timeline } from "./timeline"

const INITIAL_TRACKS: Track[] = [
    { id: "v1", name: "Video 1", type: "video", volume: 1 },
    { id: "v2", name: "Video 2", type: "video", volume: 1 },
    { id: "a1", name: "Audio 1", type: "audio", volume: 1 },
    { id: "a2", name: "Audio 2", type: "audio", volume: 1 },
]

// Audio Wav Helper functions remain the same
function audioBufferToWav(buffer: AudioBuffer, opt?: any): ArrayBuffer {
    opt = opt || {}
    var numChannels = buffer.numberOfChannels
    var sampleRate = buffer.sampleRate
    var format = opt.float32 ? 3 : 1
    var bitDepth = format === 3 ? 32 : 16
    var result
    if (numChannels === 2) {
        result = interleave(buffer.getChannelData(0), buffer.getChannelData(1))
    } else {
        result = buffer.getChannelData(0)
    }
    return encodeWAV(result, format, sampleRate, numChannels, bitDepth)
}

function encodeWAV(
    samples: Float32Array,
    format: number,
    sampleRate: number,
    numChannels: number,
    bitDepth: number,
): ArrayBuffer {
    var bytesPerSample = bitDepth / 8
    var blockAlign = numChannels * bytesPerSample
    var buffer = new ArrayBuffer(44 + samples.length * bytesPerSample)
    var view = new DataView(buffer)
    writeString(view, 0, "RIFF")
    view.setUint32(4, 36 + samples.length * bytesPerSample, true)
    writeString(view, 8, "WAVE")
    writeString(view, 12, "fmt ")
    view.setUint32(16, 16, true)
    view.setUint16(20, format, true)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * blockAlign, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitDepth, true)
    writeString(view, 36, "data")
    view.setUint32(40, samples.length * bytesPerSample, true)
    if (format === 1) floatTo16BitPCM(view, 44, samples)
    else writeFloat32(view, 44, samples)
    return buffer
}

function interleave(inputL: Float32Array, inputR: Float32Array): Float32Array {
    var length = inputL.length + inputR.length
    var result = new Float32Array(length)
    var index = 0
    var inputIndex = 0
    while (index < length) {
        result[index++] = inputL[inputIndex]
        result[index++] = inputR[inputIndex]
        inputIndex++
    }
    return result
}

function writeFloat32(output: DataView, offset: number, input: Float32Array) {
    for (var i = 0; i < input.length; i++, offset += 4) {
        output.setFloat32(offset, input[i], true)
    }
}

function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
    for (var i = 0; i < input.length; i++, offset += 2) {
        var s = Math.max(-1, Math.min(1, input[i]))
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    }
}

function writeString(view: DataView, offset: number, string: string) {
    for (var i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
    }
}

interface EditorProps {
    initialMedia?: MediaItem[]
    initialClips?: TimelineClip[]
    onBack: () => void
}

export const Editor: React.FC<EditorProps> = ({ initialMedia, initialClips, onBack }) => {
    // FFmpeg Local State
    const ffmpegRef = useRef<FFmpeg | null>(null)
    const [ffmpegLoaded, setFfmpegLoaded] = useState(false)
    const [ffmpegLoading, setFfmpegLoading] = useState(false)

    // --- State ---
    const [media, setMedia] = useState<MediaItem[]>(initialMedia || [])
    const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS)

    // Timeline State
    const [timelineClips, setTimelineClips] = useState<TimelineClip[]>(initialClips || [])
    const [history, setHistory] = useState<TimelineClip[][]>([])
    const [future, setFuture] = useState<TimelineClip[][]>([])

    const [currentTime, setCurrentTime] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [zoomLevel, setZoomLevel] = useState(40)
    const [selectedClipIds, setSelectedClipIds] = useState<string[]>([])
    const [tool, setTool] = useState<"select" | "razor">("select")

    // UI State
    const [activeView, setActiveView] = useState<"library" | "create" | "settings" | "transitions" | "inspector">(
        "library",
    )
    const [isPanelOpen, setIsPanelOpen] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [apiKeyReady, setApiKeyReady] = useState(false)
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
    const [isExportModalOpen, setIsExportModalOpen] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [exportProgress, setExportProgress] = useState(0)
    const [exportPhase, setExportPhase] = useState<"idle" | "init" | "audio" | "video" | "encoding" | "complete">("idle")
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
    const abortExportRef = useRef(false)
    const exportCancelledRef = useRef(false) // This is the correct variable

    // Render Preview State
    const [isRendering, setIsRendering] = useState(false)
    const [renderProgress, setRenderProgress] = useState(0)
    const [renderedPreviewUrl, setRenderedPreviewUrl] = useState<string | null>(null)
    const [isPreviewStale, setIsPreviewStale] = useState(false)
    const renderCancelledRef = useRef(false)

    // Refs for rendering
    const videoRefA = useRef<HTMLVideoElement>(null)
    const videoRefB = useRef<HTMLVideoElement>(null)
    const whiteOverlayRef = useRef<HTMLDivElement>(null)
    const audioRefs = useRef<Record<string, HTMLAudioElement>>({})
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Audio Context
    const audioContextRef = useRef<AudioContext | null>(null)
    const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null)
    const sourceNodesRef = useRef<Map<string, MediaElementAudioSourceNode>>(new Map())

    const requestRef = useRef<number | null>(null)
    const lastTimeRef = useRef<number | null>(null)
    const resizeRef = useRef<{ startY: number; startHeight: number } | null>(null)
    const sidebarResizeRef = useRef<{ startX: number; startWidth: number } | null>(null)

    const objectUrlsRef = useRef<string[]>([])
    const isMountedRef = useRef(true)

    const mediaMap = useMemo(() => {
        return media.reduce((acc, item) => ({ ...acc, [item.id]: item }), {} as Record<string, MediaItem>)
    }, [media])

    // Derived Stats
    const contentDuration = Math.max(0, ...timelineClips.map((c) => c.start + c.duration))
    const timelineDuration = Math.max(30, contentDuration) + 5

    const selectionBounds = useMemo(() => {
        if (selectedClipIds.length === 0) return null
        const selectedClips = timelineClips.filter((c) => selectedClipIds.includes(c.id))
        if (selectedClips.length === 0) return null
        const start = Math.min(...selectedClips.map((c) => c.start))
        const end = Math.max(...selectedClips.map((c) => c.start + c.duration))
        return { start, end }
    }, [selectedClipIds, timelineClips])

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

    // History Actions
    const pushToHistory = useCallback(() => {
        setHistory((prev) => [...prev, timelineClips])
        setFuture([])
    }, [timelineClips])

    const undo = useCallback(() => {
        if (history.length === 0) return
        const previousState = history[history.length - 1]
        const newHistory = history.slice(0, -1)
        setFuture((prev) => [timelineClips, ...prev])
        setTimelineClips(previousState)
        setHistory(newHistory)
    }, [history, timelineClips])

    const redo = useCallback(() => {
        if (future.length === 0) return
        const nextState = future[0]
        const newFuture = future.slice(1)
        setHistory((prev) => [...prev, timelineClips])
        setTimelineClips(nextState)
        setFuture(newFuture)
    }, [future, timelineClips])

    const handleClipUpdate = useCallback((id: string, chg: Partial<TimelineClip>) => {
        setTimelineClips((prev) => prev.map((c) => (c.id === id ? { ...c, ...chg } : c)))
        setIsPreviewStale(true) // Mark preview as needing re-render
    }, [])

    const handleTrackUpdate = useCallback((id: string, chg: Partial<Track>) => {
        setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, ...chg } : t)))
    }, [])

    const handleAddTrack = useCallback((type: "video" | "audio") => {
        setTracks((prev) => {
            const count = prev.filter((t) => t.type === type).length + 1
            const prefix = type === "video" ? "v" : "a"
            const newId = `${prefix}${Date.now()}`
            return [
                ...prev,
                {
                    id: newId,
                    name: `${type === "video" ? "Video" : "Audio"} ${count}`,
                    type,
                    volume: 1,
                },
            ]
        })
    }, [])

    const handleSeek = useCallback((time: number) => {
        setCurrentTime(time)
    }, [])

    const handleZoomChange = useCallback((zoom: number) => {
        setZoomLevel(zoom)
    }, [])

    const handleSelectClips = useCallback((ids: string[]) => {
        setSelectedClipIds(ids)
    }, [])

    const setupAudioGraph = () => {
        if (typeof window === "undefined") return

        if (!audioContextRef.current) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
            if (AudioCtx) {
                audioContextRef.current = new AudioCtx()
                audioDestRef.current = audioContextRef.current.createMediaStreamDestination()
            }
        }
        const ctx = audioContextRef.current
        const dest = audioDestRef.current
        if (!ctx || !dest) return
            ;[videoRefA, videoRefB].forEach((ref, idx) => {
                const id = `video-${idx}`
                if (ref.current && !sourceNodesRef.current.has(id)) {
                    try {
                        const source = ctx.createMediaElementSource(ref.current)
                        source.connect(dest)
                        source.connect(ctx.destination)
                        sourceNodesRef.current.set(id, source)
                    } catch (e) { }
                }
            })
        Object.entries(audioRefs.current).forEach(([trackId, el]) => {
            if (el && !sourceNodesRef.current.has(trackId)) {
                try {
                    const source = ctx.createMediaElementSource(el)
                    source.connect(dest)
                    source.connect(ctx.destination)
                    sourceNodesRef.current.set(trackId, source)
                } catch (e) { }
            }
        })
    }

    useEffect(() => {
        checkApiKey().then((ready) => {
            if (isMountedRef.current) setApiKeyReady(ready)
        })
        return () => {
            isMountedRef.current = false
        }
    }, [])

    useEffect(() => {
        return () => {
            objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
        }
    }, [])

    useEffect(() => {
        const initAudio = () => {
            if (!audioContextRef.current) setupAudioGraph()
            if (audioContextRef.current?.state === "suspended") {
                audioContextRef.current.resume()
            }
        }
        window.addEventListener("click", initAudio, { once: true })
        window.addEventListener("keydown", initAudio, { once: true })
        return () => {
            window.removeEventListener("click", initAudio)
            window.removeEventListener("keydown", initAudio)
        }
    }, [])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizingTimeline && resizeRef.current) {
                const deltaY = resizeRef.current.startY - e.clientY
                const maxH = typeof window !== "undefined" ? window.innerHeight - 300 : 800
                const newHeight = Math.max(200, Math.min(maxH, resizeRef.current.startHeight + deltaY))
                setTimelineHeight(newHeight)
            }
            if (isResizingSidebar && sidebarResizeRef.current) {
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
        }
        const handleMouseUp = () => {
            setIsResizingTimeline(false)
            setIsResizingSidebar(false)
        }
        if (isResizingTimeline || isResizingSidebar) {
            window.addEventListener("mousemove", handleMouseMove)
            window.addEventListener("mouseup", handleMouseUp)
        }
        return () => {
            if (typeof window !== "undefined") {
                window.removeEventListener("mousemove", handleMouseMove)
                window.removeEventListener("mouseup", handleMouseUp)
            }
        }
    }, [isResizingTimeline, isResizingSidebar])

    const syncMediaToTime = useCallback(
        (time: number, isExporting = false) => {
            const playerA = videoRefA.current
            const playerB = videoRefB.current
            const whiteOverlay = whiteOverlayRef.current
            if (!playerA || !playerB) return

            playerB.style.clipPath = "none"
            playerA.style.clipPath = "none"
            if (whiteOverlay) whiteOverlay.style.opacity = "0"

            const activeClip = tracks
                .filter((t) => t.type === "video")
                .reverse()
                .map((t) => timelineClips.find((c) => c.trackId === t.id && time >= c.start && time < c.start + c.duration))
                .find((c) => c !== undefined)

            const activeTrack = tracks.find((t) => t.id === activeClip?.trackId)
            const trackVolume = activeTrack?.volume ?? 1
            const clipVolume = activeClip?.volume ?? 1
            const isMuted = activeTrack?.isMuted || activeClip?.isAudioDetached
            const effectiveVolume = isMuted ? 0 : trackVolume * clipVolume

            const setPlayerState = (player: HTMLVideoElement, clip: TimelineClip | undefined, opacity: number) => {
                if (clip) {
                    const mediaItem = mediaMap[clip.mediaId]
                    if (mediaItem) {
                        if (!player.src.includes(mediaItem.url)) {
                            player.src = mediaItem.url
                        }
                        const timeInClip = time - clip.start + clip.offset
                        if (isExporting || Math.abs(player.currentTime - timeInClip) > 0.1) {
                            player.currentTime = timeInClip
                        }
                        if (isExporting) {
                            player.pause()
                        } else if (isPlaying) {
                            player.play().catch(() => { })
                        } else {
                            player.pause()
                        }
                        player.muted = effectiveVolume === 0
                        player.volume = effectiveVolume
                    }
                } else {
                    if (!clip) player.pause()
                }
                player.style.opacity = opacity.toString()
            }

            if (activeClip && activeClip.transition && activeClip.transition.type !== "none") {
                const transDuration = activeClip.transition.duration
                const progress = (time - activeClip.start) / transDuration

                if (progress < 1.0 && progress >= 0) {
                    const sameTrackClips = timelineClips
                        .filter((c) => c.trackId === activeClip.trackId)
                        .sort((a, b) => a.start - b.start)
                    const idx = sameTrackClips.findIndex((c) => c.id === activeClip.id)
                    const prevClip = sameTrackClips[idx - 1]

                    if (prevClip) {
                        const type = activeClip.transition.type
                        if (type === "cross-dissolve") {
                            setPlayerState(playerA, prevClip, 1 - progress)
                            setPlayerState(playerB, activeClip, progress)
                        } else if (type === "fade-black") {
                            setPlayerState(playerA, prevClip, 1)
                            setPlayerState(playerB, activeClip, 1)
                            if (progress < 0.5) {
                                playerA.style.opacity = (1 - progress * 2).toString()
                                playerB.style.opacity = "0"
                            } else {
                                playerA.style.opacity = "0"
                                playerB.style.opacity = ((progress - 0.5) * 2).toString()
                            }
                        } else if (type === "fade-white") {
                            const whiteOpacity = 1 - Math.abs((progress - 0.5) * 2)
                            if (whiteOverlay) whiteOverlay.style.opacity = whiteOpacity.toString()
                            if (progress < 0.5) {
                                setPlayerState(playerA, prevClip, 1)
                                setPlayerState(playerB, activeClip, 0)
                                playerB.style.opacity = "0"
                            } else {
                                setPlayerState(playerA, prevClip, 0)
                                setPlayerState(playerB, activeClip, 1)
                                playerA.style.opacity = "0"
                            }
                        } else if (type === "wipe-left") {
                            setPlayerState(playerA, prevClip, 1)
                            setPlayerState(playerB, activeClip, 1)
                            const percent = (1 - progress) * 100
                            playerB.style.clipPath = `inset(0 ${percent}% 0 0)`
                        } else if (type === "wipe-right") {
                            setPlayerState(playerA, prevClip, 1)
                            setPlayerState(playerB, activeClip, 1)
                            const percent = (1 - progress) * 100
                            playerB.style.clipPath = `inset(0 0 0 ${percent}%)`
                        }
                    } else {
                        setPlayerState(playerB, activeClip, progress)
                        playerA.style.opacity = "0"
                    }
                } else {
                    setPlayerState(playerA, activeClip, activeClip ? 1 : 0)
                    playerB.style.opacity = "0"
                }
            } else {
                setPlayerState(playerA, activeClip, activeClip ? 1 : 0)
                playerB.style.opacity = "0"
            }

            tracks
                .filter((t) => t.type === "audio")
                .forEach((track) => {
                    const audioEl = audioRefs.current[track.id]
                    if (!audioEl) return
                    const activeAudioClip = timelineClips.find(
                        (c) => c.trackId === track.id && time >= c.start && time < c.start + c.duration,
                    )
                    if (activeAudioClip) {
                        const mediaItem = mediaMap[activeAudioClip.mediaId]
                        if (mediaItem) {
                            if (!audioEl.src.includes(mediaItem.url)) {
                                audioEl.src = mediaItem.url
                            }
                            const timeInClip = time - activeAudioClip.start + activeAudioClip.offset
                            if (isExporting || Math.abs(audioEl.currentTime - timeInClip) > 0.1) {
                                audioEl.currentTime = timeInClip
                            }
                            if (isPlaying && !isExporting) {
                                audioEl.play().catch(() => { })
                            } else {
                                audioEl.pause()
                            }
                            const clipVol = activeAudioClip.volume ?? 1
                            audioEl.volume = track.isMuted ? 0 : (track.volume ?? 1) * clipVol
                        }
                    } else {
                        audioEl.pause()
                    }
                })
        },
        [timelineClips, mediaMap, tracks, isPlaying],
    )

    const animate = useCallback(
        (time: number) => {
            if (isExporting || isRendering) return // Stop animation during export/render
            if (lastTimeRef.current !== null) {
                const deltaTime = (time - lastTimeRef.current) / 1000
                setCurrentTime((prev) => {
                    const nextTime = prev + deltaTime
                    if (nextTime >= timelineDuration) {
                        setIsPlaying(false)
                        return 0
                    }
                    return nextTime
                })
            }
            lastTimeRef.current = time
            if (isPlaying) {
                requestRef.current = requestAnimationFrame(animate)
            }
        },
        [isPlaying, timelineDuration, isExporting, isRendering],
    )

    useEffect(() => {
        if (!isExporting && !isRendering) {
            syncMediaToTime(currentTime, false)
        }
    }, [currentTime, syncMediaToTime, isExporting, isRendering])

    useEffect(() => {
        if (isPlaying && !isExporting && !isRendering) {
            requestRef.current = requestAnimationFrame(animate)
        } else {
            lastTimeRef.current = null
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current)
        }
    }, [isPlaying, animate, isExporting, isRendering])

    const drawFrameToCanvas = useCallback(
        (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
            ctx.fillStyle = "#000000"
            ctx.fillRect(0, 0, width, height)

            const drawScaled = (video: HTMLVideoElement) => {
                const vW = video.videoWidth
                const vH = video.videoHeight
                if (!vW || !vH) return
                const scale = Math.min(width / vW, height / vH)
                const dw = vW * scale
                const dh = vH * scale
                const dx = (width - dw) / 2
                const dy = (height - dh) / 2
                ctx.drawImage(video, dx, dy, dw, dh)
            }

            const opacityA = Number.parseFloat(videoRefA.current?.style.opacity || "0")
            const opacityB = Number.parseFloat(videoRefB.current?.style.opacity || "0")
            const clipPathB = videoRefB.current?.style.clipPath || "none"

            if (opacityA > 0 && videoRefA.current) {
                ctx.globalAlpha = opacityA
                drawScaled(videoRefA.current)
            }

            if (opacityB > 0 && videoRefB.current) {
                ctx.globalAlpha = opacityB
                if (clipPathB !== "none" && clipPathB.startsWith("inset")) {
                    const match = clipPathB.match(/inset$$([^)]+)$$/)
                    if (match) {
                        ctx.save()
                        ctx.beginPath()
                        const vals = match[1].split(" ").map((s) => Number.parseFloat(s))
                        const rightPct = vals.length === 4 ? vals[1] : 0
                        const leftPct = vals.length === 4 ? vals[3] : 0
                        const x = (leftPct / 100) * width
                        const w = width - x - (rightPct / 100) * width
                        ctx.rect(x, 0, w, height)
                        ctx.clip()
                        drawScaled(videoRefB.current)
                        ctx.restore()
                    } else {
                        drawScaled(videoRefB.current)
                    }
                } else {
                    drawScaled(videoRefB.current)
                }
            }

            const activeClip = timelineClips.find(
                (c) =>
                    c.trackId.startsWith("v") &&
                    time >= c.start &&
                    time < c.start + c.duration &&
                    c.transition?.type === "fade-white",
            )
            if (activeClip) {
                const transDuration = activeClip.transition!.duration
                const progress = (time - activeClip.start) / transDuration
                if (progress >= 0 && progress <= 1) {
                    const whiteOpacity = 1 - Math.abs((progress - 0.5) * 2)
                    if (whiteOpacity > 0) {
                        ctx.globalAlpha = whiteOpacity
                        ctx.fillStyle = "#FFFFFF"
                        ctx.fillRect(0, 0, width, height)
                    }
                }
            }
            ctx.globalAlpha = 1
        },
        [timelineClips],
    )

    const waitForVideoReady = useCallback(async (video: HTMLVideoElement) => {
        if (!video || !video.src || video.style.opacity === "0") return
        if (video.readyState < 1) {
            await new Promise((resolve) => {
                const h = () => {
                    video.removeEventListener("loadedmetadata", h)
                    resolve(null)
                }
                video.addEventListener("loadedmetadata", h, { once: true })
                setTimeout(() => {
                    video.removeEventListener("loadedmetadata", h)
                    resolve(null)
                }, 2000)
            })
        }
        if (video.seeking) {
            await new Promise((resolve) => {
                const h = () => {
                    video.removeEventListener("seeked", h)
                    resolve(null)
                }
                video.addEventListener("seeked", h, { once: true })
                setTimeout(() => {
                    video.removeEventListener("seeked", h)
                    resolve(null)
                }, 2000)
            })
        }
        if (video.readyState < 2) {
            await new Promise((resolve) => {
                const h = () => {
                    video.removeEventListener("canplay", h)
                    resolve(null)
                }
                video.addEventListener("canplay", h, { once: true })
                setTimeout(() => {
                    video.removeEventListener("canplay", h)
                    resolve(null)
                }, 2000)
            })
        }
    }, [])

    const startExport = useCallback(
        async (resolution: "720p" | "1080p", source: "all" | "selection") => {
            if (!ffmpegRef.current) {
                console.error("FFmpeg not loaded")
                return
            }

            exportCancelledRef.current = false
            setIsExporting(true)
            abortExportRef.current = false
            setDownloadUrl(null)
            setExportProgress(0)
            setExportPhase("init")
            setIsPlaying(false)

            const exportStartTime = source === "all" ? 0 : selectionBounds?.start || 0
            const exportEndTime = source === "all" ? contentDuration : selectionBounds?.end || contentDuration
            const exportDuration = exportEndTime - exportStartTime

            if (exportDuration <= 0) {
                alert("Export duration is too short or empty.")
                setIsExporting(false)
                setExportPhase("idle")
                return
            }

            console.log(`Starting export: ${resolution}, ${exportDuration.toFixed(2)}s`)

            const ffmpeg = ffmpegRef.current!
            let width: number, height: number
            if (resolution === "1080p") {
                width = 1920
                height = 1080
            } else {
                width = 1280
                height = 720
            }

            const canReusePreview = renderedPreviewUrl && !isPreviewStale && source === "all" && resolution === "720p"

            if (canReusePreview) {
                console.log("Reusing rendered preview for export...")
                setExportPhase("encoding")
                setExportProgress(10)

                try {
                    // Fetch the preview blob and write to FFmpeg
                    const response = await fetch(renderedPreviewUrl)
                    const previewBlob = await response.arrayBuffer()
                    await ffmpeg.writeFile("preview_input.mp4", new Uint8Array(previewBlob))
                    setExportProgress(30)

                    // Re-encode with higher quality settings
                    console.log("Re-encoding preview with export quality...")

                    ffmpeg.on("progress", ({ progress }) => {
                        setExportProgress(30 + Math.round(progress * 65))
                    })

                    await ffmpeg.exec([
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

                    console.log("Export re-encoding complete")
                    setExportProgress(95)
                    setExportPhase("complete") // Changed this line

                    const data = (await ffmpeg.readFile("output.mp4")) as any
                    const url = URL.createObjectURL(new Blob([data], { type: "video/mp4" }))
                    setDownloadUrl(url)
                    setExportProgress(100)

                    // Cleanup
                    try {
                        await ffmpeg.deleteFile("preview_input.mp4")
                    } catch (e) { }
                    try {
                        await ffmpeg.deleteFile("output.mp4")
                    } catch (e) { }

                    console.log("Export complete (reused preview)!")
                } catch (err: any) {
                    if (err.message !== "Export cancelled") {
                        console.error("Export Failed", err)
                        alert(`Export failed: ${err.message}`)
                    }
                } finally {
                    setIsExporting(false)
                    setExportPhase("idle")
                }
                return
            }

            // Full render path
            try {
                const fps = 30
                const dt = 1 / fps
                const offscreen = document.createElement("canvas")
                offscreen.width = width
                offscreen.height = height
                const ctx = offscreen.getContext("2d", { alpha: false })
                if (!ctx) throw new Error("Could not create canvas context")

                // PASS 1: Audio
                setExportPhase("audio")
                console.log("Starting audio render...")
                const sampleRate = 44100
                const totalFrames = Math.ceil(exportDuration * sampleRate)
                const OfflineCtx = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext
                const offlineCtx = new OfflineCtx(2, totalFrames, sampleRate)
                const audioBufferMap = new Map<string, AudioBuffer>()
                const uniqueMediaIds = new Set(
                    timelineClips.filter((c) => c.trackId.startsWith("a") || !c.isAudioDetached).map((c) => c.mediaId),
                )

                setExportProgress(10)

                for (const mid of uniqueMediaIds) {
                    if (abortExportRef.current) throw new Error("Export cancelled")
                    const item = mediaMap[mid]
                    if (item && item.url) {
                        try {
                            const response = await fetch(item.url)
                            const arrayBuffer = await response.arrayBuffer()
                            const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer)
                            audioBufferMap.set(mid, audioBuffer)
                        } catch (e) {
                            console.warn("Skipping corrupt audio:", e)
                        }
                    }
                }

                setExportProgress(25)

                timelineClips.forEach((clip) => {
                    if (abortExportRef.current) return
                    const track = tracks.find((t) => t.id === clip.trackId)
                    const isVideoTrack = track?.type === "video"
                    if (track?.isMuted) return
                    if (isVideoTrack && clip.isAudioDetached) return

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
                        const diff = startInDest + clipDuration - exportDuration
                        clipDuration -= diff
                    }
                    if (clipDuration <= 0) return

                    const buffer = audioBufferMap.get(clip.mediaId)
                    if (buffer) {
                        const source = offlineCtx.createBufferSource()
                        source.buffer = buffer
                        const gainNode = offlineCtx.createGain()
                        const trackVol = track?.volume ?? 1
                        const clipVol = clip.volume ?? 1
                        const baseVolume = trackVol * clipVol

                        if (
                            clip.transition &&
                            clip.transition.type !== "none" &&
                            clip.transition.type !== "wipe-left" &&
                            clip.transition.type !== "wipe-right"
                        ) {
                            const transDuration = Math.min(clip.transition.duration, clipDuration)
                            gainNode.gain.setValueAtTime(0, offlineCtx.currentTime + startInDest)
                            gainNode.gain.linearRampToValueAtTime(baseVolume, offlineCtx.currentTime + startInDest + transDuration)
                        } else {
                            gainNode.gain.setValueAtTime(baseVolume, offlineCtx.currentTime + startInDest)
                        }
                        const nextClip = timelineClips.find(
                            (c) =>
                                c.trackId === clip.trackId &&
                                Math.abs(c.start - (clip.start + clip.duration)) < 0.05 &&
                                c.transition &&
                                c.transition.type !== "none",
                        )
                        if (
                            nextClip &&
                            nextClip.transition &&
                            (nextClip.transition.type === "cross-dissolve" || nextClip.transition.type === "fade-black")
                        ) {
                            const fadeOutDuration = Math.min(nextClip.transition.duration, clipDuration)
                            gainNode.gain.setValueAtTime(
                                baseVolume,
                                offlineCtx.currentTime + startInDest + clipDuration - fadeOutDuration,
                            )
                            gainNode.gain.linearRampToValueAtTime(0, offlineCtx.currentTime + startInDest + clipDuration)
                        } else {
                            gainNode.gain.setValueAtTime(baseVolume, offlineCtx.currentTime + startInDest + clipDuration - 0.01)
                        }
                        source.connect(gainNode)
                        gainNode.connect(offlineCtx.destination)
                        source.start(startInDest, clipOffset, clipDuration)
                    }
                })

                if (abortExportRef.current) throw new Error("Export cancelled")
                const renderedBuffer = await offlineCtx.startRendering()
                const wavData = audioBufferToWav(renderedBuffer)
                await ffmpeg.writeFile("audio.wav", new Uint8Array(wavData))
                console.log("Audio render complete")
                // Audio rendering complete section
                console.log("Audio render complete")
                setExportProgress(5)

                // PASS 2: VIDEO RENDER (Frame by Frame)
                if (abortExportRef.current || exportCancelledRef.current) throw new Error("Export cancelled")
                setExportPhase("video")
                console.log("Starting video rendering loop...")

                let isVertical = false
                const firstClip = timelineClips.sort((a, b) => a.start - b.start)[0]
                if (firstClip) {
                    const m = mediaMap[firstClip.mediaId]
                    if (m && m.resolution && m.resolution.height > m.resolution.width) isVertical = true
                }

                let targetW = width
                let targetH = height
                if (isVertical) {
                    const tmp = targetW
                    targetW = targetH
                    targetH = tmp
                }

                if (canvasRef.current) {
                    canvasRef.current.width = targetW
                    canvasRef.current.height = targetH
                }
                const renderCtx = canvasRef.current!.getContext("2d", { alpha: false })! // Redeclared ctx to renderCtx
                renderCtx.imageSmoothingEnabled = true
                renderCtx.imageSmoothingQuality = "high"

                const renderWidth = canvasRef.current!.width
                const renderHeight = canvasRef.current!.height
                const framerate = 30
                // const dt = 1 / framerate // Corrected dt redeclaration

                let exportTime = exportStartTime
                let frameCount = 0

                console.log("[v0] Loop conditions:", {
                    exportTime,
                    exportEndTime,
                    exportCancelled: exportCancelledRef.current,
                    willEnterLoop: exportTime < exportEndTime && !exportCancelledRef.current,
                })

                // Start from frame 0
                while (exportTime < exportEndTime && !exportCancelledRef.current) {
                    if (abortExportRef.current) throw new Error("Export cancelled")

                    // Sync UI to time
                    syncMediaToTime(exportTime, true)

                    // Wait for frames to be ready (critical for scrubbing)
                    await Promise.all([waitForVideoReady(videoRefA.current!), waitForVideoReady(videoRefB.current!)])

                    // Draw to canvas
                    drawFrameToCanvas(renderCtx, renderWidth, renderHeight, exportTime) // Use renderCtx

                    // Create blob
                    const blob: Blob = await new Promise((resolve, reject) => {
                        try {
                            canvasRef.current!.toBlob(
                                (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
                                "image/jpeg",
                                0.9,
                            )
                        } catch (e) {
                            reject(e)
                        }
                    })

                    const buffer = await blob.arrayBuffer()
                    const fileName = `frame${frameCount.toString().padStart(4, "0")}.jpg`

                    // Use Uint8Array to be explicit for ffmpeg.wasm
                    await ffmpeg.writeFile(fileName, new Uint8Array(buffer))

                    if (frameCount % 30 === 0) {
                        console.log(`Rendered frame ${frameCount} at ${exportTime.toFixed(2)}s`)
                    }

                    const progress = 5 + ((exportTime - exportStartTime) / exportDuration) * 70
                    setExportProgress(progress)

                    exportTime += dt
                    frameCount++

                    // Yield to main thread to allow UI updates and prevent blocking
                    await new Promise<void>((resolve) => setTimeout(resolve, 0))
                }

                console.log(`Video render complete. Total frames: ${frameCount}`)

                if (frameCount === 0) {
                    throw new Error("No frames were rendered. Check timeline duration.")
                }

                // PASS 3: FFmpeg Compile
                if (abortExportRef.current) throw new Error("Export cancelled")
                setExportPhase("encoding")
                setExportProgress(75)

                console.log("Starting FFmpeg encoding...")

                ffmpeg.on("progress", ({ progress }) => {
                    setExportProgress(75 + Math.round(progress * 23))
                })

                await ffmpeg.exec([
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

                console.log("FFmpeg encoding complete")
                setExportPhase("complete") // Changed this line
                setExportProgress(98)

                const data = (await ffmpeg.readFile("output.mp4")) as any
                const url = URL.createObjectURL(new Blob([data], { type: "video/mp4" }))
                setDownloadUrl(url)
                setExportProgress(100)

                // Cleanup
                try {
                    await ffmpeg.deleteFile("audio.wav")
                } catch (e) { }
                try {
                    await ffmpeg.deleteFile("output.mp4")
                } catch (e) { }

                // Cleanup frames in batches to avoid blocking
                for (let i = 0; i < frameCount; i++) {
                    try {
                        await ffmpeg.deleteFile(`frame${i.toString().padStart(4, "0")}.jpg`)
                    } catch (e) { }
                }
            } catch (err: any) {
                if (err.message !== "Export cancelled") {
                    console.error("Export Failed", err)
                    alert(`Export failed: ${err.message}`)
                }
                setExportPhase("idle")
            } finally {
                setIsExporting(false)
                setCurrentTime(0)
                if (videoRefA.current) videoRefA.current.style.opacity = "1"
                if (videoRefB.current) videoRefB.current.style.opacity = "0"
                if (videoRefA.current) videoRefA.current.muted = false
            }
        },
        [
            ffmpegLoaded,
            selectionBounds,
            contentDuration,
            renderedPreviewUrl,
            isPreviewStale,
            timelineClips,
            mediaMap,
            tracks,
            setDownloadUrl,
            setIsExporting,
            abortExportRef,
            exportCancelledRef,
            setExportProgress,
            setExportPhase,
            setIsPlaying,
            loadFFmpeg,
            syncMediaToTime,
            waitForVideoReady,
            drawFrameToCanvas,
        ],
    )

    const handleGenerate = useCallback(
        async (prompt: string, aspectRatio: string) => {
            if (!apiKeyReady) {
                await selectApiKey()
                setApiKeyReady(await checkApiKey())
            }
            const newId = Math.random().toString(36).substr(2, 9)
            const tempMedia: MediaItem = {
                id: newId,
                url: "",
                prompt: prompt,
                duration: defaultDuration,
                aspectRatio: aspectRatio,
                status: "generating",
                type: "video",
                resolution: { width: 1280, height: 720 },
            }
            setMedia((prev) => [tempMedia, ...prev])
            setIsGenerating(true)
            try {
                const videoUrl = await generateVideo(prompt, aspectRatio)
                if (isMountedRef.current) {
                    setMedia((prev) => prev.map((m) => (m.id === newId ? { ...m, url: videoUrl, status: "ready" } : m)))
                    setActiveView("library")
                }
            } catch (error) {
                console.error(error)
                if (isMountedRef.current) {
                    setMedia((prev) => prev.map((m) => (m.id === newId ? { ...m, status: "error" } : m)))
                }
            } finally {
                if (isMountedRef.current) setIsGenerating(false)
            }
        },
        [apiKeyReady, defaultDuration],
    )

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
                setMedia((prev) =>
                    prev.map((m) =>
                        m.id === newId
                            ? { ...m, duration: el.duration, aspectRatio: newMedia.aspectRatio, resolution: newMedia.resolution }
                            : m,
                    ),
                )
            }
            el.src = url
            setMedia((prev) => [newMedia, ...prev])
        },
        [defaultDuration],
    )

    const handleRemoveMedia = useCallback(
        (item: MediaItem) => {
            const isUsed = timelineClips.some((c) => c.mediaId === item.id)
            if (isUsed) {
                if (!window.confirm("This media is used in the timeline. Removing it will delete associated clips. Continue?"))
                    return
            }
            pushToHistory()
            setTimelineClips((prev) => prev.filter((c) => c.mediaId !== item.id))
            setMedia((prev) => prev.filter((m) => m.id !== item.id))
            if (item.url.startsWith("blob:")) URL.revokeObjectURL(item.url)
            if (selectedClipIds.length > 0) {
                const stillExists = timelineClips.some((c) => selectedClipIds.includes(c.id))
                if (!stillExists) setSelectedClipIds([])
            }
        },
        [timelineClips, selectedClipIds, pushToHistory],
    )

    const handleAddToTimeline = useCallback(
        (item: MediaItem) => {
            pushToHistory()
            const trackId = item.type === "audio" ? "a1" : "v1"
            const clipsOnTrack = timelineClips.filter((c) => c.trackId === trackId)
            const start = clipsOnTrack.length > 0 ? Math.max(...clipsOnTrack.map((c) => c.start + c.duration)) : 0
            const newClip: TimelineClip = {
                id: `clip-${Date.now()}`,
                mediaId: item.id,
                trackId,
                start,
                duration: item.duration,
                offset: 0,
                volume: 1,
            }
            setTimelineClips((prev) => [...prev, newClip])
            setSelectedClipIds([newClip.id])
            setIsPreviewStale(true) // Mark preview as needing re-render
        },
        [pushToHistory, timelineClips],
    )

    const handleSplitClip = useCallback(
        (clipId: string, splitTime: number) => {
            const clip = timelineClips.find((c) => c.id === clipId)
            if (!clip) return
            pushToHistory()
            const relativeSplit = splitTime - clip.start
            const firstDuration = relativeSplit
            const secondDuration = clip.duration - relativeSplit
            if (firstDuration < 0.1 || secondDuration < 0.1) return
            const clip1: TimelineClip = { ...clip, duration: firstDuration }
            const clip2: TimelineClip = {
                ...clip,
                id: `clip-${Date.now()}-split`,
                start: splitTime,
                duration: secondDuration,
                offset: clip.offset + relativeSplit,
            }
            setTimelineClips((prev) => prev.map((c) => (c.id === clipId ? clip1 : c)).concat(clip2))
            setIsPreviewStale(true) // Mark preview as needing re-render
        },
        [pushToHistory, timelineClips],
    )

    const handleDetachAudio = useCallback(
        (clipId: string) => {
            const clip = timelineClips.find((c) => c.id === clipId)
            if (!clip) return
            pushToHistory()
            const targetTrackId =
                ["a1", "a2"].find((tid) => {
                    const collisions = timelineClips.filter(
                        (c) => c.trackId === tid && !(c.start >= clip.start + clip.duration || c.start + c.duration <= clip.start),
                    )
                    return collisions.length === 0
                }) || "a1"
            const audioClip: TimelineClip = {
                id: `audio-${Date.now()}`,
                mediaId: clip.mediaId,
                trackId: targetTrackId,
                start: clip.start,
                duration: clip.duration,
                offset: clip.offset,
                volume: 1,
            }
            setTimelineClips((prev) => [
                ...prev.map((c) => (c.id === clipId ? { ...c, isAudioDetached: true } : c)),
                audioClip,
            ])
            setIsPreviewStale(true) // Mark preview as needing re-render
        },
        [pushToHistory, timelineClips],
    )

    const handleDeleteClip = useCallback(
        (clipIds: string[]) => {
            pushToHistory()
            setTimelineClips((prev) => prev.filter((c) => !clipIds.includes(c.id)))
            setSelectedClipIds([])
            setIsPreviewStale(true) // Mark preview as needing re-render
        },
        [pushToHistory],
    )

    const handleRippleDeleteClip = useCallback(
        (clipIds: string[]) => {
            if (clipIds.length === 0) return
            pushToHistory()
            const clipsToDelete = timelineClips.filter((c) => clipIds.includes(c.id))
            const tracksAffected = new Set(clipsToDelete.map((c) => c.trackId))
            setTimelineClips((prev) => {
                let current = prev.filter((c) => !clipIds.includes(c.id))
                tracksAffected.forEach((tid) => {
                    const deletedOnTrack = clipsToDelete.filter((c) => c.trackId === tid).sort((a, b) => b.start - a.start)
                    deletedOnTrack.forEach((dc) => {
                        current = current.map((c) => {
                            if (c.trackId === tid && c.start > dc.start) {
                                return { ...c, start: c.start - dc.duration }
                            }
                            return c
                        })
                    })
                })
                return current
            })
            setSelectedClipIds([])
            setIsPreviewStale(true) // Mark preview as needing re-render
        },
        [pushToHistory, timelineClips],
    )

    const handleDuplicateClip = useCallback(
        (clipIds: string[]) => {
            if (clipIds.length === 0) return
            pushToHistory()
            const newClips: TimelineClip[] = []
            const clipsToDuplicate = timelineClips.filter((c) => clipIds.includes(c.id))
            clipsToDuplicate.forEach((clip) => {
                const insertPoint = clip.start + clip.duration
                newClips.push({
                    ...clip,
                    id: `clip-${Date.now()}-${Math.random()}`,
                    start: insertPoint,
                    transition: undefined,
                    volume: clip.volume ?? 1,
                })
            })
            setTimelineClips((prev) => {
                let updated = [...prev]
                newClips.forEach((newClip) => {
                    updated = updated.map((c) => {
                        if (c.trackId === newClip.trackId && c.start >= newClip.start) {
                            return { ...c, start: c.start + newClip.duration }
                        }
                        return c
                    })
                    updated.push(newClip)
                })
                return updated
            })
            setIsPreviewStale(true) // Mark preview as needing re-render
        },
        [pushToHistory, timelineClips],
    )

    const onToolChange = useCallback((newTool: "select" | "razor") => {
        setTool(newTool)
    }, [])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                document.activeElement?.tagName === "INPUT" ||
                document.activeElement?.tagName === "TEXTAREA" ||
                isExporting ||
                isRendering
            )
                return
            if (e.code === "Space") {
                e.preventDefault()
                setIsPlaying((p) => !p)
            }
            if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ") {
                e.preventDefault()
                if (e.shiftKey) redo()
                else undo()
            }
            if ((e.ctrlKey || e.metaKey) && e.code === "KeyC") {
                e.preventDefault()
                setTool((t) => (t === "select" ? "razor" : "select"))
            }
            if ((e.ctrlKey || e.metaKey) && e.code === "KeyD" && selectedClipIds.length > 0) {
                e.preventDefault()
                handleDuplicateClip(selectedClipIds)
            }
            if (e.code === "Delete" && selectedClipIds.length > 0) {
                handleDeleteClip(selectedClipIds)
            }
            if (e.shiftKey && e.code === "Delete" && selectedClipIds.length > 0) {
                handleRippleDeleteClip(selectedClipIds)
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [
        selectedClipIds,
        isExporting,
        isRendering,
        pushToHistory,
        timelineClips,
        undo,
        redo,
        handleDuplicateClip,
        handleDeleteClip,
        handleRippleDeleteClip,
    ])

    const handleCancelExport = () => {
        abortExportRef.current = true
        exportCancelledRef.current = true // This is the correct variable to set to true
        setIsExporting(false)
        setIsExportModalOpen(false)
        setExportPhase("idle")
    }

    const startRenderPreview = useCallback(async () => {
        renderCancelledRef.current = false

        if (!ffmpegLoaded || !ffmpegRef.current) {
            console.log("FFmpeg not loaded, attempting lazy load...")
            try {
                await loadFFmpeg()
            } catch (e) {
                alert("Failed to load render engine. Please try again.")
                return
            }
        }

        setIsRendering(true)
        setRenderProgress(0)
        setIsPlaying(false)

        // Revoke old preview URL if exists
        if (renderedPreviewUrl) {
            URL.revokeObjectURL(renderedPreviewUrl)
            setRenderedPreviewUrl(null)
        }

        const exportStartTime = 0
        const exportEndTime = contentDuration

        if (contentDuration <= 0) {
            alert("No content to render.")
            setIsRendering(false)
            return
        }

        console.log(`Starting render preview: ${contentDuration.toFixed(2)}s`)

        const ffmpeg = ffmpegRef.current!

        try {
            // PASS 1: AUDIO RENDER
            const sampleRate = 44100
            const totalFrames = Math.ceil(contentDuration * sampleRate)
            const OfflineCtx = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext
            const offlineCtx = new OfflineAudioContext(2, totalFrames, sampleRate)
            const audioBufferMap = new Map<string, AudioBuffer>()
            const uniqueMediaIds = new Set(
                timelineClips.filter((c) => c.trackId.startsWith("a") || !c.isAudioDetached).map((c) => c.mediaId),
            )

            setRenderProgress(5)

            for (const mid of uniqueMediaIds) {
                if (renderCancelledRef.current) throw new Error("Render cancelled")
                const item = mediaMap[mid]
                if (item && item.url) {
                    try {
                        const response = await fetch(item.url)
                        const arrayBuffer = await response.arrayBuffer()
                        const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer)
                        audioBufferMap.set(mid, audioBuffer)
                    } catch (e) {
                        console.warn("Skipping corrupt audio:", e)
                    }
                }
            }

            setRenderProgress(15)

            timelineClips.forEach((clip) => {
                if (renderCancelledRef.current) return
                const track = tracks.find((t) => t.id === clip.trackId)
                const isVideoTrack = track?.type === "video"
                if (track?.isMuted) return
                if (isVideoTrack && clip.isAudioDetached) return

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
                if (startInDest + clipDuration > contentDuration) {
                    const diff = startInDest + clipDuration - contentDuration
                    clipDuration -= diff
                }
                if (clipDuration <= 0) return

                const buffer = audioBufferMap.get(clip.mediaId)
                if (buffer) {
                    const source = offlineCtx.createBufferSource()
                    source.buffer = buffer
                    const gainNode = offlineCtx.createGain()
                    const trackVol = track?.volume ?? 1
                    const clipVol = clip.volume ?? 1
                    const baseVolume = trackVol * clipVol

                    if (
                        clip.transition &&
                        clip.transition.type !== "none" &&
                        clip.transition.type !== "wipe-left" &&
                        clip.transition.type !== "wipe-right"
                    ) {
                        const transDuration = Math.min(clip.transition.duration, clipDuration)
                        gainNode.gain.setValueAtTime(0, offlineCtx.currentTime + startInDest)
                        gainNode.gain.linearRampToValueAtTime(baseVolume, offlineCtx.currentTime + startInDest + transDuration)
                    } else {
                        gainNode.gain.setValueAtTime(baseVolume, offlineCtx.currentTime + startInDest)
                    }
                    const nextClip = timelineClips.find(
                        (c) =>
                            c.trackId === clip.trackId &&
                            Math.abs(c.start - (clip.start + clip.duration)) < 0.05 &&
                            c.transition &&
                            c.transition.type !== "none",
                    )
                    if (
                        nextClip &&
                        nextClip.transition &&
                        (nextClip.transition.type === "cross-dissolve" || nextClip.transition.type === "fade-black")
                    ) {
                        const fadeOutDuration = Math.min(nextClip.transition.duration, clipDuration)
                        gainNode.gain.setValueAtTime(
                            baseVolume,
                            offlineCtx.currentTime + startInDest + clipDuration - fadeOutDuration,
                        )
                        gainNode.gain.linearRampToValueAtTime(0, offlineCtx.currentTime + startInDest + clipDuration)
                    } else {
                        gainNode.gain.setValueAtTime(baseVolume, offlineCtx.currentTime + startInDest + clipDuration - 0.01)
                    }
                    source.connect(gainNode)
                    gainNode.connect(offlineCtx.destination)
                    source.start(startInDest, clipOffset, clipDuration)
                }
            })

            if (renderCancelledRef.current) throw new Error("Render cancelled")
            const renderedBuffer = await offlineCtx.startRendering()
            const wavData = audioBufferToWav(renderedBuffer)
            await ffmpeg.writeFile("preview_audio.wav", new Uint8Array(wavData))

            setRenderProgress(25)
            console.log("Audio render complete for preview")

            // PASS 2: VIDEO RENDER (720p for preview, faster)
            let isVertical = false
            const firstClip = timelineClips.sort((a, b) => a.start - b.start)[0]
            if (firstClip) {
                const m = mediaMap[firstClip.mediaId]
                if (m && m.resolution && m.resolution.height > m.resolution.width) isVertical = true
            }

            let targetW = 1280
            let targetH = 720
            if (isVertical) {
                const tmp = targetW
                targetW = targetH
                targetH = tmp
            }

            if (canvasRef.current) {
                canvasRef.current.width = targetW
                canvasRef.current.height = targetH
            }
            const ctx = canvasRef.current!.getContext("2d", { alpha: false })!
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = "high"

            const width = canvasRef.current!.width
            const height = canvasRef.current!.height
            const framerate = 30
            const dt = 1 / framerate // Corrected dt redeclaration

            let exportTime = 0
            let frameCount = 0

            console.log("Starting preview video rendering loop...")

            while (exportTime < contentDuration && !renderCancelledRef.current) {
                syncMediaToTime(exportTime, true)
                await Promise.all([waitForVideoReady(videoRefA.current!), waitForVideoReady(videoRefB.current!)])
                drawFrameToCanvas(ctx, width, height, exportTime)

                const blob: Blob = await new Promise((resolve, reject) => {
                    try {
                        canvasRef.current!.toBlob(
                            (b) => (b ? resolve(b) : reject(new Error("Canvas toBlob failed"))),
                            "image/jpeg",
                            0.85,
                        )
                    } catch (e) {
                        reject(e)
                    }
                })

                const buffer = await blob.arrayBuffer()
                const fileName = `pframe${frameCount.toString().padStart(4, "0")}.jpg`
                await ffmpeg.writeFile(fileName, new Uint8Array(buffer))

                const progress = 5 + (exportTime / contentDuration) * 65
                setRenderProgress(progress)

                exportTime += dt
                frameCount++

                await new Promise<void>((resolve) => setTimeout(resolve, 0))
            }

            console.log(`Preview video render complete. Total frames: ${frameCount}`)

            if (frameCount === 0) {
                throw new Error("No frames were rendered.")
            }

            // PASS 3: FFmpeg Compile
            if (renderCancelledRef.current) throw new Error("Render cancelled")
            setRenderProgress(92)

            console.log("Starting preview FFmpeg encoding...")

            ffmpeg.on("progress", ({ progress }) => {
                setRenderProgress(92 + Math.round(progress * 8))
            })

            await ffmpeg.exec([
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

            console.log("Preview FFmpeg encoding complete")

            const data = (await ffmpeg.readFile("preview.mp4")) as any
            const url = URL.createObjectURL(new Blob([data], { type: "video/mp4" }))
            setRenderedPreviewUrl(url)
            setIsPreviewStale(false)

            setRenderProgress(100)

            // Cleanup
            try {
                await ffmpeg.deleteFile("preview_audio.wav")
            } catch (e) { }
            try {
                await ffmpeg.deleteFile("preview.mp4")
            } catch (e) { }
            for (let i = 0; i < frameCount; i++) {
                try {
                    await ffmpeg.deleteFile(`pframe${i.toString().padStart(4, "0")}.jpg`)
                } catch (e) { }
            }

            console.log("Preview render complete!")
        } catch (err: any) {
            if (err.message !== "Render cancelled") {
                console.error("Render Failed", err)
                alert(`Render failed: ${err.message}`)
            }
        } finally {
            setIsRendering(false)
        }
    }, [
        ffmpegLoaded,
        loadFFmpeg,
        contentDuration,
        timelineClips,
        mediaMap,
        tracks,
        syncMediaToTime,
        waitForVideoReady,
        drawFrameToCanvas,
    ])

    const handleCancelRender = () => {
        renderCancelledRef.current = true
        setIsRendering(false)
        setRenderProgress(0)
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#09090b] text-neutral-200 font-sans selection:bg-indigo-500/30">
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => {
                    if (!isExporting) setIsExportModalOpen(false)
                }}
                onStartExport={(resolution) => startExport(resolution, "all")}
                isExporting={isExporting}
                exportProgress={exportProgress}
                exportPhase={exportPhase}
                downloadUrl={downloadUrl}
                onCancel={handleCancelExport}
                hasRenderedPreview={!!renderedPreviewUrl && !isPreviewStale}
            />
            <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
            {tracks
                .filter((t) => t.type === "audio")
                .map((track) => (
                    <audio
                        key={track.id}
                        ref={(el) => {
                            if (el) audioRefs.current[track.id] = el
                        }}
                        className="hidden"
                        crossOrigin="anonymous"
                    />
                ))}
            <canvas ref={canvasRef} className="hidden" />

            {/* Sidebar & Left Controls */}
            <div className="w-[72px] flex flex-col items-center py-6 border-r border-neutral-800 bg-[#09090b] z-50 shrink-0">
                <div
                    onClick={onBack}
                    className="w-10 h-10 bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] rounded-xl flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-105 transition-transform mb-8"
                >
                    <LogoIcon className="w-6 h-6" />
                </div>
                <div className="flex flex-col gap-6 w-full items-center">
                    {["create", "library", "transitions", "inspector", "settings"].map((v) => (
                        <div
                            key={v}
                            onClick={() => {
                                if (activeView === v) {
                                    setIsPanelOpen(!isPanelOpen)
                                } else {
                                    setActiveView(v as any)
                                    setIsPanelOpen(true)
                                }
                            }}
                            className={`flex flex-col items-center gap-1 cursor-pointer ${activeView === v && isPanelOpen ? "text-indigo-400" : "text-neutral-500"}`}
                        >
                            <div
                                className={`p-2 rounded-lg ${activeView === v && isPanelOpen ? "bg-indigo-500/10" : "hover:bg-neutral-800"}`}
                            >
                                {v === "create" && <PlusIcon className="w-5 h-5" />}
                                {v === "library" && <GridIcon className="w-5 h-5" />}
                                {v === "transitions" && <TransitionIcon className="w-5 h-5" />}
                                {v === "inspector" && <InfoIcon className="w-5 h-5" />}
                                {v === "settings" && <SettingsIcon className="w-5 h-5" />}
                            </div>
                            <span className="text-[10px] capitalize">{v}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-14 border-b border-neutral-800 bg-[#09090b] flex items-center justify-between px-6 z-40 shrink-0">
                    <div className="flex items-center gap-2">
                        <button onClick={onBack} className="text-xs text-neutral-500 hover:text-white flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            Back
                        </button>
                        <div className="h-4 w-px bg-neutral-800 mx-2"></div>
                        <span className="text-white font-semibold">Timeline</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsShortcutsOpen(true)} className="text-neutral-500 hover:text-white">
                            <KeyboardIcon className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded p-1">
                            <button
                                onClick={undo}
                                disabled={history.length === 0}
                                className="p-1 text-neutral-400 hover:text-white disabled:opacity-30"
                            >
                                <UndoIcon className="w-4 h-4" />
                            </button>
                            <button
                                onClick={redo}
                                disabled={future.length === 0}
                                className="p-1 text-neutral-400 hover:text-white disabled:opacity-30"
                            >
                                <RedoIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <button
                            onClick={() => setIsExportModalOpen(true)}
                            className="bg-white text-black px-4 py-2 rounded text-xs font-bold flex items-center gap-2 hover:bg-neutral-200"
                        >
                            <DownloadIcon className="w-3.5 h-3.5" /> Export
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden relative">
                    {isPanelOpen && !isCinemaMode && (
                        <div
                            className="flex flex-col border-r border-neutral-800 bg-[#09090b] shrink-0 overflow-hidden relative"
                            style={{ width: sidebarWidth }}
                        >
                            {activeView === "library" && (
                                <ProjectLibrary
                                    media={media}
                                    selectedId={selectedClipIds[0]}
                                    onSelect={(m) => setSelectedClipIds([m.id])}
                                    onAddToTimeline={handleAddToTimeline}
                                    onImport={handleImport}
                                    onRemove={handleRemoveMedia}
                                    onClose={() => setIsPanelOpen(false)}
                                />
                            )}
                            {activeView === "create" && (
                                <CreatePanel
                                    onGenerate={handleGenerate}
                                    isGenerating={isGenerating}
                                    onClose={() => setIsPanelOpen(false)}
                                />
                            )}
                            {activeView === "settings" && (
                                <SettingsPanel
                                    onClose={() => setIsPanelOpen(false)}
                                    onClearTimeline={() => setTimelineClips([])}
                                    defaultDuration={defaultDuration}
                                    onDurationChange={setDefaultDuration}
                                />
                            )}
                            {activeView === "transitions" && (
                                <TransitionsPanel
                                    onClose={() => setIsPanelOpen(false)}
                                    onApplyTransition={(t) => {
                                        if (selectedClipIds.length > 0) {
                                            const clip = timelineClips.find((c) => c.id === selectedClipIds[0])
                                            if (clip) {
                                                const safeDuration = Math.min(1.0, clip.duration / 2)
                                                handleClipUpdate(clip.id, { transition: { type: t, duration: safeDuration } })
                                            }
                                        }
                                    }}
                                    selectedClipId={selectedClipIds[0]}
                                />
                            )}
                            {activeView === "inspector" && (
                                <InspectorPanel
                                    onClose={() => setIsPanelOpen(false)}
                                    selectedClipId={selectedClipIds[0]}
                                    clips={timelineClips}
                                    mediaMap={mediaMap}
                                    tracks={tracks}
                                    onUpdateClip={handleClipUpdate}
                                />
                            )}
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

                    <div className="flex-1 flex flex-col bg-[#09090b] min-w-0 relative">
                        <div className="flex-1 w-full bg-[#050505] relative flex items-center justify-center p-6 overflow-hidden min-h-[200px]">
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
                                    <button
                                        onClick={() => setPlayerZoom(1)}
                                        className="text-[10px] text-neutral-400 hover:text-white px-2"
                                    >
                                        Fit
                                    </button>
                                    <button
                                        onClick={() => setIsSafeGuidesVisible(!isSafeGuidesVisible)}
                                        className={`p-1 ${isSafeGuidesVisible ? "text-indigo-400" : "text-neutral-400"}`}
                                    >
                                        <Grid3x3Icon className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setIsCinemaMode(!isCinemaMode)}
                                        className="p-1 text-neutral-400 hover:text-white"
                                    >
                                        <MaximizeIcon className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}

                            <div
                                className="relative aspect-video w-full max-h-full shadow-2xl bg-black flex items-center justify-center overflow-hidden"
                                style={{ transform: `scale(${playerZoom})` }}
                            >
                                <video
                                    ref={videoRefA}
                                    className="absolute inset-0 w-full h-full object-contain bg-black transition-transform"
                                    crossOrigin="anonymous"
                                    onClick={() => !isExporting && !isRendering && setIsPlaying(!isPlaying)}
                                />
                                <video
                                    ref={videoRefB}
                                    className="absolute inset-0 w-full h-full object-contain bg-black transition-transform opacity-0"
                                    crossOrigin="anonymous"
                                    onClick={() => !isExporting && !isRendering && setIsPlaying(!isPlaying)}
                                />
                                <div
                                    ref={whiteOverlayRef}
                                    className="absolute inset-0 bg-white pointer-events-none z-20"
                                    style={{ opacity: 0 }}
                                />

                                {!isPlaying && !isExporting && !isRendering && (
                                    <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                                        <div
                                            className="w-16 h-16 bg-white/10 backdrop-blur rounded-full flex items-center justify-center cursor-pointer pointer-events-auto hover:scale-105 transition-transform"
                                            onClick={() => setIsPlaying(true)}
                                        >
                                            <PlayIcon className="w-6 h-6 text-white ml-1" />
                                        </div>
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

                        <Timeline
                            className={isCinemaMode ? "border-t-0" : ""}
                            style={{ height: isCinemaMode ? 40 : timelineHeight }}
                            tracks={tracks}
                            clips={timelineClips}
                            mediaMap={mediaMap}
                            currentTime={currentTime}
                            duration={timelineDuration}
                            zoomLevel={zoomLevel}
                            isPlaying={isPlaying}
                            selectedClipIds={selectedClipIds}
                            tool={tool}
                            onSeek={handleSeek}
                            onSelectClips={handleSelectClips}
                            onZoomChange={handleZoomChange}
                            onClipUpdate={handleClipUpdate}
                            onTrackUpdate={handleTrackUpdate}
                            onSplitClip={handleSplitClip}
                            onDetachAudio={handleDetachAudio}
                            onDeleteClip={handleDeleteClip}
                            onRippleDeleteClip={handleRippleDeleteClip}
                            onRenderPreview={startRenderPreview}
                            onDuplicateClip={handleDuplicateClip}
                            onToolChange={onToolChange}
                            onDragStart={pushToHistory}
                            onAddTrack={handleAddTrack}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Editor
