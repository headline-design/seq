"use client"

import { useSearchParams } from "next/navigation"

import type React from "react"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { TimelineClip } from "./timeline-clip"
import type { TimelineState, TimelineClipData } from "./types"
import { DEMO_FINAL_SEQUENCE } from "@/lib/demo-data"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  Square,
  SkipBack,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
  Home,
  SkipForward,
  Magnet,
  Undo,
  Redo,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import Link from "next/link"

const SNAP_THRESHOLD = 10
const MAX_HISTORY = 50
const TRACK_HEIGHT = 84
const MIN_ZOOM = 10
const MAX_ZOOM = 200

interface TimelineEditorProps {
  initialClips?: TimelineClipData[]
}

interface VideoMetadata {
  duration: number
  width: number
  height: number
}

export function TimelineEditor({ initialClips }: TimelineEditorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isDemoMode = searchParams.get("demo") === "true"

  const [mounted, setMounted] = useState(false)

  const [timelineState, setTimelineState] = useState<TimelineState>({
    clips: [],
    zoom: 40,
    playheadPosition: 0,
    selectedClipId: null,
    scrollOffset: 0,
  })

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [magneticMode, setMagneticMode] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [history, setHistory] = useState<TimelineState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null)
  const [snapIndicator, setSnapIndicator] = useState<number | null>(null)

  const timelineRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const playbackStartTimeRef = useRef<number>(0)
  const playbackStartPositionRef = useRef<number>(0)
  const hasInitialized = useRef(false)

  const sortedClips = useMemo(() => {
    return [...timelineState.clips].sort((a, b) => a.startTime - b.startTime)
  }, [timelineState.clips])

  const totalDuration = useMemo(() => {
    if (sortedClips.length === 0) return 0
    return Math.max(...sortedClips.map((c) => c.startTime + (c.duration - c.trimStart - c.trimEnd)))
  }, [sortedClips])

  const findClipAtTime = useCallback(
    (time: number): { clip: TimelineClipData; clipTime: number } | null => {
      for (const clip of sortedClips) {
        const clipDuration = clip.duration - clip.trimStart - clip.trimEnd
        if (time >= clip.startTime && time < clip.startTime + clipDuration) {
          const clipTime = clip.trimStart + (time - clip.startTime)
          return { clip, clipTime }
        }
      }
      return null
    },
    [sortedClips],
  )

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const frames = Math.floor((seconds % 1) * 30)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`
  }

  const formatRulerTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (hasInitialized.current) return
    hasInitialized.current = true

    const loadClips = async () => {
      setIsLoading(true)
      console.log("[v0] Timeline loadClips starting, isDemoMode:", isDemoMode)

      let clipsToLoad: TimelineClipData[] = []

      if (initialClips && initialClips.length > 0) {
        console.log("[v0] Using initialClips prop")
        clipsToLoad = initialClips
      } else if (isDemoMode) {
        // Load from demo data - use the video URLs directly from DEMO_FINAL_SEQUENCE
        console.log("[v0] Loading from demo data, panels count:", DEMO_FINAL_SEQUENCE.panels.length)
        let startTime = 0
        clipsToLoad = DEMO_FINAL_SEQUENCE.panels.map((panel, index) => {
          const clip: TimelineClipData = {
            id: `demo-${index}`,
            videoUrl: panel.videoUrl || "",
            thumbnailUrl: panel.imageUrl,
            name: panel.linkedImageUrl
              ? `Transition ${Math.floor(index / 2) + 1}`
              : `Scene ${Math.ceil((index + 1) / 2)}`,
            duration: 5,
            trimStart: 0,
            trimEnd: 0,
            startTime: startTime,
            track: 0,
          }
          startTime += 5
          console.log(`[v0] Demo clip ${index}:`, clip.name, "videoUrl:", clip.videoUrl ? "present" : "MISSING")
          return clip
        })
        // Filter out clips without video URLs
        const validClips = clipsToLoad.filter((c) => c.videoUrl && c.videoUrl.length > 0)
        console.log("[v0] Valid clips with video URLs:", validClips.length)
        clipsToLoad = validClips
      } else {
        // Try to load from localStorage (where storyboard saves)
        try {
          console.log("[v0] Trying to load from localStorage")
          const storedVideoUrls = localStorage.getItem("storyboard_video_urls")
          const storedPanels = localStorage.getItem("storyboard_panels")

          console.log("[v0] storedVideoUrls:", storedVideoUrls)
          console.log("[v0] storedPanels:", storedPanels)

          if (storedVideoUrls) {
            const videoUrls = JSON.parse(storedVideoUrls) as Record<string, string>
            let startTime = 0

            Object.entries(videoUrls).forEach(([index, url]) => {
              if (url) {
                clipsToLoad.push({
                  id: `clip-${index}`,
                  videoUrl: url,
                  thumbnailUrl: "",
                  name: `Clip ${Number.parseInt(index) + 1}`,
                  duration: 5,
                  trimStart: 0,
                  trimEnd: 0,
                  startTime: startTime,
                  track: 0,
                })
                startTime += 5
              }
            })
            console.log("[v0] Loaded from localStorage videoUrls:", clipsToLoad.length)
          }

          // Also try sessionStorage timeline_clips as fallback
          if (clipsToLoad.length === 0) {
            const stored = sessionStorage.getItem("timeline_clips")
            if (stored) {
              clipsToLoad = JSON.parse(stored)
              console.log("[v0] Loaded from sessionStorage timeline_clips:", clipsToLoad.length)
            }
          }
        } catch (e) {
          console.error("[v0] Failed to load from storage:", e)
        }
      }

      console.log("[v0] Final clipsToLoad count:", clipsToLoad.length)

      if (clipsToLoad.length > 0) {
        setTimelineState((prev) => ({ ...prev, clips: clipsToLoad }))
      }

      setIsLoading(false)
    }

    loadClips()
  }, [mounted, isDemoMode, initialClips])

  useEffect(() => {
    if (!mounted) return
    const result = findClipAtTime(timelineState.playheadPosition)
    if (result && result.clip.videoUrl !== activeVideoUrl) {
      setActiveVideoUrl(result.clip.videoUrl)
    }
  }, [timelineState.playheadPosition, findClipAtTime, activeVideoUrl, mounted])

  useEffect(() => {
    if (!isPlaying || !mounted) return

    const animate = () => {
      const elapsed = (performance.now() - playbackStartTimeRef.current) / 1000
      const newPosition = playbackStartPositionRef.current + elapsed

      if (newPosition >= totalDuration) {
        setIsPlaying(false)
        setTimelineState((prev) => ({ ...prev, playheadPosition: 0 }))
        if (videoRef.current) {
          videoRef.current.pause()
        }
        return
      }

      setTimelineState((prev) => ({ ...prev, playheadPosition: newPosition }))

      // Update video element with proper trim-aware seeking
      const result = findClipAtTime(newPosition)
      if (result && videoRef.current) {
        const video = videoRef.current

        // If video source changed, load new video
        if (video.src !== result.clip.videoUrl) {
          video.src = result.clip.videoUrl
          video.currentTime = result.clipTime
          video.play().catch(() => {})
        } else {
          // Keep video time synced with the expected clip time (handles trim)
          // Only seek if we're more than 0.1s out of sync to avoid constant seeking
          const expectedTime = result.clipTime
          const drift = Math.abs(video.currentTime - expectedTime)
          if (drift > 0.15) {
            video.currentTime = expectedTime
          }
        }

        // Check if we've reached the trim end point for this clip
        const trimEndTime = result.clip.duration - result.clip.trimEnd
        if (video.currentTime >= trimEndTime) {
          // Find next clip and switch to it
          const nextClipResult = findClipAtTime(newPosition + 0.1)
          if (nextClipResult && nextClipResult.clip.id !== result.clip.id) {
            video.src = nextClipResult.clip.videoUrl
            video.currentTime = nextClipResult.clipTime
            video.play().catch(() => {})
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    playbackStartTimeRef.current = performance.now()
    playbackStartPositionRef.current = timelineState.playheadPosition

    // Start video playback from correct position
    const initialResult = findClipAtTime(timelineState.playheadPosition)
    if (initialResult && videoRef.current) {
      videoRef.current.src = initialResult.clip.videoUrl
      videoRef.current.currentTime = initialResult.clipTime
      videoRef.current.play().catch(() => {})
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, totalDuration, findClipAtTime, mounted])

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false)
      if (videoRef.current) {
        videoRef.current.pause()
      }
    } else {
      if (timelineState.playheadPosition >= totalDuration) {
        setTimelineState((prev) => ({ ...prev, playheadPosition: 0 }))
      }
      setIsPlaying(true)
      if (videoRef.current) {
        videoRef.current.play().catch(() => {})
      }
    }
  }, [isPlaying, timelineState.playheadPosition, totalDuration])

  const stopPlayback = useCallback(() => {
    setIsPlaying(false)
    setTimelineState((prev) => ({ ...prev, playheadPosition: 0 }))
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [])

  const seekToStart = useCallback(() => {
    setTimelineState((prev) => ({ ...prev, playheadPosition: 0 }))
  }, [])

  const seekToEnd = useCallback(() => {
    setTimelineState((prev) => ({ ...prev, playheadPosition: totalDuration }))
  }, [totalDuration])

  const saveToHistory = useCallback(
    (state: TimelineState) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1)
        newHistory.push(state)
        if (newHistory.length > MAX_HISTORY) newHistory.shift()
        return newHistory
      })
      setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1))
    },
    [historyIndex],
  )

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1)
      setTimelineState(history[historyIndex - 1])
    }
  }, [historyIndex, history])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1)
      setTimelineState(history[historyIndex + 1])
    }
  }, [historyIndex, history])

  const handleClipUpdate = useCallback(
    (clipId: string, updates: Partial<TimelineClipData>) => {
      setTimelineState((prev) => {
        const newState = {
          ...prev,
          clips: prev.clips.map((c) => (c.id === clipId ? { ...c, ...updates } : c)),
        }
        saveToHistory(newState)
        return newState
      })
    },
    [saveToHistory],
  )

  const handleClipSelect = useCallback((clipId: string | null) => {
    setTimelineState((prev) => ({ ...prev, selectedClipId: clipId }))
  }, [])

  const handleZoom = useCallback((delta: number) => {
    setTimelineState((prev) => ({
      ...prev,
      zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.zoom + delta)),
    }))
  }, [])

  const handleRulerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left + timelineState.scrollOffset
      const time = x / timelineState.zoom
      setTimelineState((prev) => ({ ...prev, playheadPosition: Math.max(0, time) }))
    },
    [timelineState.zoom, timelineState.scrollOffset],
  )

  const autoArrangeClips = useCallback(() => {
    let currentTime = 0
    const arranged = sortedClips.map((clip) => {
      const newClip = { ...clip, startTime: currentTime }
      currentTime += clip.duration - clip.trimStart - clip.trimEnd
      return newClip
    })

    setTimelineState((prev) => {
      const newState = { ...prev, clips: arranged }
      saveToHistory(newState)
      return newState
    })
  }, [sortedClips, saveToHistory])

  // Keyboard shortcuts
  useEffect(() => {
    if (!mounted) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key) {
        case " ":
          e.preventDefault()
          togglePlayback()
          break
        case "Home":
          seekToStart()
          break
        case "End":
          seekToEnd()
          break
        case "z":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            if (e.shiftKey) redo()
            else undo()
          }
          break
        case "y":
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            redo()
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [mounted, togglePlayback, seekToStart, seekToEnd, undo, redo])

  // Generate ruler marks
  const rulerMarks = useMemo(() => {
    const marks: { time: number; label: string; major: boolean }[] = []
    const duration = Math.max(totalDuration, 30)
    const interval = timelineState.zoom > 60 ? 1 : timelineState.zoom > 30 ? 2 : 5

    for (let t = 0; t <= duration; t += interval) {
      marks.push({
        time: t,
        label: formatRulerTime(t),
        major: t % (interval * 2) === 0,
      })
    }
    return marks
  }, [totalDuration, timelineState.zoom])

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const time = Math.max(0, Math.min(x / timelineState.zoom, totalDuration))
      setTimelineState((prev) => ({ ...prev, playheadPosition: time }))

      // Update video preview to show correct trimmed frame
      const result = findClipAtTime(time)
      if (result && videoRef.current) {
        videoRef.current.src = result.clip.videoUrl
        videoRef.current.currentTime = result.clipTime
      }
    },
    [timelineState.zoom, totalDuration, findClipAtTime],
  )

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="text-zinc-400">Loading...</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="text-lg text-zinc-300 mb-2">Loading Timeline...</div>
          <div className="text-sm text-zinc-500">Preparing video clips</div>
        </div>
      </div>
    )
  }

  const timelineWidth = Math.max(totalDuration * timelineState.zoom + 200, 1000)

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Sequence Editor</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex <= 0}>
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
            <Redo className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-zinc-700 mx-2" />
          <Button
            variant={magneticMode ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMagneticMode(!magneticMode)}
          >
            <Magnet className="w-4 h-4 mr-1" />
            Snap
          </Button>
          <Button variant="ghost" size="sm" onClick={autoArrangeClips}>
            Auto-Arrange
          </Button>
        </div>
      </div>

      {/* Preview and Info Panel */}
      <div className="flex flex-1 min-h-0">
        {/* Video Preview */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-black">
          <div className="relative w-full max-w-3xl aspect-video bg-zinc-900 rounded-lg overflow-hidden">
            {activeVideoUrl ? (
              <video
                ref={videoRef}
                src={activeVideoUrl}
                className="w-full h-full object-contain"
                muted={isMuted}
                playsInline
              />
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500">No video at playhead position</div>
            )}
          </div>

          {/* Time display */}
          <div className="mt-4 font-mono text-2xl text-zinc-300">
            {formatTime(timelineState.playheadPosition)}
            <span className="text-zinc-600 text-lg ml-2">/ {formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Clip Info */}
        <div className="w-72 border-l border-zinc-800 bg-zinc-900 p-4 overflow-y-auto">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Clip Info</h3>
          {timelineState.selectedClipId ? (
            (() => {
              const clip = timelineState.clips.find((c) => c.id === timelineState.selectedClipId)
              if (!clip) return <div className="text-zinc-500 text-sm">Clip not found</div>
              return (
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-zinc-500">Name</div>
                    <div className="text-sm">{clip.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">Duration</div>
                    <div className="text-sm">{(clip.duration - clip.trimStart - clip.trimEnd).toFixed(2)}s</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">Start Time</div>
                    <div className="text-sm">{clip.startTime.toFixed(2)}s</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">Trim</div>
                    <div className="text-sm">
                      Start: {clip.trimStart.toFixed(2)}s, End: {clip.trimEnd.toFixed(2)}s
                    </div>
                  </div>
                  {clip.thumbnailUrl && (
                    <img
                      src={clip.thumbnailUrl || "/placeholder.svg"}
                      alt={clip.name}
                      className="w-full rounded border border-zinc-700"
                    />
                  )}
                </div>
              )
            })()
          ) : (
            <div className="text-zinc-500 text-sm">Select a clip to view details</div>
          )}
        </div>
      </div>

      {/* Transport Controls */}
      <div className="flex items-center justify-center gap-2 py-3 border-t border-zinc-800 bg-zinc-900">
        <Button variant="ghost" size="sm" onClick={seekToStart}>
          <SkipBack className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={stopPlayback}>
          <Square className="w-4 h-4" />
        </Button>
        <Button variant="default" size="sm" onClick={togglePlayback} className="w-20">
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="sm" onClick={seekToEnd}>
          <SkipForward className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-zinc-700 mx-4" />
        <Button variant="ghost" size="sm" onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
        <div className="w-px h-6 bg-zinc-700 mx-4" />
        <Button variant="ghost" size="sm" onClick={() => handleZoom(-10)}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <div className="w-24">
          <Slider
            value={[timelineState.zoom]}
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={5}
            onValueChange={([v]) => setTimelineState((prev) => ({ ...prev, zoom: v }))}
          />
        </div>
        <Button variant="ghost" size="sm" onClick={() => handleZoom(10)}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <span className="text-xs text-zinc-500 ml-2">{timelineState.zoom}px/s</span>
      </div>

      {/* Timeline */}
      <div className="h-48 border-t border-zinc-800 bg-zinc-900 flex flex-col">
        {/* Ruler */}
        <div className="h-6 bg-zinc-800 relative cursor-pointer overflow-hidden" onClick={handleRulerClick}>
          <div
            className="absolute top-0 left-0 h-full flex"
            style={{ transform: `translateX(-${timelineState.scrollOffset}px)` }}
          >
            {rulerMarks.map((mark, i) => (
              <div
                key={i}
                className="absolute top-0 flex flex-col items-center"
                style={{ left: mark.time * timelineState.zoom }}
              >
                <div className={cn("w-px bg-zinc-600", mark.major ? "h-4" : "h-2")} />
                {mark.major && <span className="text-[10px] text-zinc-500 mt-0.5">{mark.label}</span>}
              </div>
            ))}
          </div>

          {/* Playhead on ruler */}
          <div
            className="absolute top-0 w-0.5 h-full bg-red-500 z-10"
            style={{ left: timelineState.playheadPosition * timelineState.zoom - timelineState.scrollOffset }}
          />
        </div>

        {/* Track area */}
        <div
          ref={timelineRef}
          className="flex-1 relative overflow-x-auto overflow-y-hidden"
          onScroll={(e) =>
            setTimelineState((prev) => ({
              ...prev,
              scrollOffset: e.currentTarget.scrollLeft,
            }))
          }
        >
          <div className="relative h-full" style={{ width: timelineWidth, minHeight: TRACK_HEIGHT }}>
            {/* Track background */}
            <div className="absolute inset-0 bg-zinc-850" style={{ height: TRACK_HEIGHT }}>
              <div className="absolute left-0 top-0 bottom-0 w-16 bg-zinc-800 border-r border-zinc-700 flex items-center justify-center">
                <span className="text-xs text-zinc-500">Video</span>
              </div>
            </div>

            {/* Clips */}
            {sortedClips.map((clip) => (
              <TimelineClip
                key={clip.id}
                clip={clip}
                zoom={timelineState.zoom}
                isSelected={timelineState.selectedClipId === clip.id}
                onSelect={() => handleClipSelect(clip.id)}
                onUpdate={(updates) => handleClipUpdate(clip.id, updates)}
                magneticMode={magneticMode}
                allClips={timelineState.clips}
                snapThreshold={SNAP_THRESHOLD}
                onSnapIndicator={setSnapIndicator}
              />
            ))}

            {/* Snap indicator */}
            {snapIndicator !== null && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-20 pointer-events-none"
                style={{ left: snapIndicator * timelineState.zoom }}
              />
            )}

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
              style={{ left: timelineState.playheadPosition * timelineState.zoom }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rotate-45" />
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="h-6 px-4 flex items-center justify-between bg-zinc-900 border-t border-zinc-800 text-xs text-zinc-500">
        <div>{sortedClips.length} clips</div>
        <div>Total: {formatTime(totalDuration)}</div>
        <div>Space: Play/Pause | Home: Start | End: End | Cmd+Z: Undo</div>
      </div>
    </div>
  )
}
