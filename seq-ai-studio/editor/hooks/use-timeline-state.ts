"use client"

import type React from "react"

import { useState, useCallback, useMemo } from "react"
import type { TimelineClip, Track, MediaItem, StoryboardPanel } from "../types"

const INITIAL_TRACKS: Track[] = [
  { id: "v1", name: "Video 1", type: "video", volume: 1 },
  { id: "v2", name: "Video 2", type: "video", volume: 1 },
  { id: "a1", name: "Audio 1", type: "audio", volume: 1 },
  { id: "a2", name: "Audio 2", type: "audio", volume: 1 },
]

export interface UseTimelineStateOptions {
  initialMedia?: MediaItem[]
  initialClips?: TimelineClip[]
  initialStoryboard?: StoryboardPanel[]
  onPreviewStale?: () => void
}

export interface UseTimelineStateResult {
  // Media
  media: MediaItem[]
  setMedia: React.Dispatch<React.SetStateAction<MediaItem[]>>
  mediaMap: Record<string, MediaItem>

  // Tracks
  tracks: Track[]
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>

  // Clips
  timelineClips: TimelineClip[]
  setTimelineClips: React.Dispatch<React.SetStateAction<TimelineClip[]>>

  // Selection
  selectedClipIds: string[]
  setSelectedClipIds: React.Dispatch<React.SetStateAction<string[]>>
  selectionBounds: { start: number; end: number } | null

  // Tool
  tool: "select" | "razor"
  setTool: React.Dispatch<React.SetStateAction<"select" | "razor">>

  // Zoom
  zoomLevel: number
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>

  // Derived values
  contentDuration: number
  timelineDuration: number

  // History
  history: TimelineClip[][]
  future: TimelineClip[][]
  pushToHistory: () => void
  undo: () => void
  redo: () => void

  // Handlers
  handleClipUpdate: (id: string, chg: Partial<TimelineClip>) => void
  handleTrackUpdate: (id: string, chg: Partial<Track>) => void
  handleAddTrack: (type: "video" | "audio") => void
  handleSelectClips: (ids: string[]) => void
  handleZoomChange: (zoom: number) => void
  handleAddToTimeline: (item: MediaItem) => void
  handleRemoveMedia: (item: MediaItem) => void
  handleSplitClip: (clipId: string, splitTime: number) => void
  handleDetachAudio: (clipId: string) => void
  handleDeleteClip: (clipIds: string[]) => void
  handleRippleDeleteClip: (clipIds: string[]) => void
  handleDuplicateClip: (clipIds: string[]) => void
  onToolChange: (newTool: "select" | "razor") => void
}

export function useTimelineState({
  initialMedia,
  initialClips,
  initialStoryboard,
  onPreviewStale,
}: UseTimelineStateOptions): UseTimelineStateResult {
  // Media state
  const [media, setMedia] = useState<MediaItem[]>(initialMedia || [])
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS)
  const [timelineClips, setTimelineClips] = useState<TimelineClip[]>(initialClips || [])

  // History for undo/redo
  const [history, setHistory] = useState<TimelineClip[][]>([])
  const [future, setFuture] = useState<TimelineClip[][]>([])

  // UI state
  const [zoomLevel, setZoomLevel] = useState(40)
  const [selectedClipIds, setSelectedClipIds] = useState<string[]>([])
  const [tool, setTool] = useState<"select" | "razor">("select")

  // Derived values
  const mediaMap = useMemo(() => {
    return media.reduce((acc, item) => ({ ...acc, [item.id]: item }), {} as Record<string, MediaItem>)
  }, [media])

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

  const markPreviewStale = useCallback(() => {
    onPreviewStale?.()
  }, [onPreviewStale])

  // History actions
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

  // Clip/track handlers
  const handleClipUpdate = useCallback(
    (id: string, chg: Partial<TimelineClip>) => {
      setTimelineClips((prev) => prev.map((c) => (c.id === id ? { ...c, ...chg } : c)))
      markPreviewStale()
    },
    [markPreviewStale],
  )

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

  const handleSelectClips = useCallback((ids: string[]) => {
    setSelectedClipIds(ids)
  }, [])

  const handleZoomChange = useCallback((zoom: number) => {
    setZoomLevel(zoom)
  }, [])

  const handleAddToTimeline = useCallback(
    (item: MediaItem) => {
      pushToHistory()
      const trackId = item.type === "audio" ? "a1" : "v1"
      const clipsOnTrack = timelineClips.filter((c) => c.trackId === trackId)
      const start = clipsOnTrack.length > 0 ? Math.max(...clipsOnTrack.map((c) => c.start + c.duration)) : 0
      const newClip: TimelineClip = {
        speed: 1,
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
      markPreviewStale()
    },
    [pushToHistory, timelineClips, markPreviewStale],
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
      markPreviewStale()
    },
    [pushToHistory, timelineClips, markPreviewStale],
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
        speed: 1,
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
      markPreviewStale()
    },
    [pushToHistory, timelineClips, markPreviewStale],
  )

  const handleDeleteClip = useCallback(
    (clipIds: string[]) => {
      pushToHistory()
      setTimelineClips((prev) => prev.filter((c) => !clipIds.includes(c.id)))
      setSelectedClipIds([])
      markPreviewStale()
    },
    [pushToHistory, markPreviewStale],
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
      markPreviewStale()
    },
    [pushToHistory, timelineClips, markPreviewStale],
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
      markPreviewStale()
    },
    [pushToHistory, timelineClips, markPreviewStale],
  )

  const onToolChange = useCallback((newTool: "select" | "razor") => {
    setTool(newTool)
  }, [])

  return {
    media,
    setMedia,
    mediaMap,
    tracks,
    setTracks,
    timelineClips,
    setTimelineClips,
    selectedClipIds,
    setSelectedClipIds,
    selectionBounds,
    tool,
    setTool,
    zoomLevel,
    setZoomLevel,
    contentDuration,
    timelineDuration,
    history,
    future,
    pushToHistory,
    undo,
    redo,
    handleClipUpdate,
    handleTrackUpdate,
    handleAddTrack,
    handleSelectClips,
    handleZoomChange,
    handleAddToTimeline,
    handleRemoveMedia,
    handleSplitClip,
    handleDetachAudio,
    handleDeleteClip,
    handleRippleDeleteClip,
    handleDuplicateClip,
    onToolChange,
  }
}
