"use client"

import { useEffect, useCallback, useRef } from "react"
import type { TimelineClip, Track } from "../types"

interface UseTimelineKeyboardOptions {
  clips: TimelineClip[]
  tracks: Track[]
  selectedClipIds: string[]
  currentTime: number
  duration: number
  zoomLevel: number
  isPlaying: boolean
  onSelectClips: (clipIds: string[]) => void
  onDeleteClip: (clipIds: string[]) => void
  onDuplicateClip: (clipIds: string[]) => void
  onClipUpdate: (clipId: string, changes: Partial<TimelineClip>) => void
  onSeek: (time: number) => void
  onTogglePlayback: () => void
  onUndo?: () => void
  onRedo?: () => void
}

export function useTimelineKeyboard({
  clips,
  tracks,
  selectedClipIds,
  currentTime,
  duration,
  zoomLevel,
  isPlaying,
  onSelectClips,
  onDeleteClip,
  onDuplicateClip,
  onClipUpdate,
  onSeek,
  onTogglePlayback,
  onUndo,
  onRedo,
}: UseTimelineKeyboardOptions) {
  // Use refs to avoid stale closures
  const clipsRef = useRef(clips)
  clipsRef.current = clips
  const selectedRef = useRef(selectedClipIds)
  selectedRef.current = selectedClipIds
  const currentTimeRef = useRef(currentTime)
  currentTimeRef.current = currentTime

  // Find adjacent clip for navigation
  const findAdjacentClip = useCallback(
    (direction: "left" | "right" | "up" | "down"): string | null => {
      const selected = selectedRef.current
      const allClips = clipsRef.current

      if (selected.length === 0) {
        // No selection - select first clip by start time
        if (allClips.length > 0) {
          const sorted = [...allClips].sort((a, b) => a.start - b.start)
          return sorted[0].id
        }
        return null
      }

      const currentClip = allClips.find((c) => c.id === selected[0])
      if (!currentClip) return null

      const currentTrackIndex = tracks.findIndex((t) => t.id === currentClip.trackId)

      if (direction === "left" || direction === "right") {
        // Find clips on same track
        const trackClips = allClips.filter((c) => c.trackId === currentClip.trackId).sort((a, b) => a.start - b.start)

        const currentIndex = trackClips.findIndex((c) => c.id === currentClip.id)
        const nextIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1

        if (nextIndex >= 0 && nextIndex < trackClips.length) {
          return trackClips[nextIndex].id
        }
      } else {
        // Up/Down - find clip on adjacent track at similar position
        const nextTrackIndex = direction === "up" ? currentTrackIndex - 1 : currentTrackIndex + 1

        if (nextTrackIndex >= 0 && nextTrackIndex < tracks.length) {
          const nextTrack = tracks[nextTrackIndex]
          const trackClips = allClips.filter((c) => c.trackId === nextTrack.id)

          // Find clip that overlaps with current clip's position
          const overlapping = trackClips.find(
            (c) => c.start <= currentClip.start + currentClip.duration / 2 && c.start + c.duration >= currentClip.start,
          )

          if (overlapping) return overlapping.id

          // If no overlap, find nearest clip
          if (trackClips.length > 0) {
            const nearest = trackClips.reduce((prev, curr) => {
              const prevDist = Math.abs(prev.start - currentClip.start)
              const currDist = Math.abs(curr.start - currentClip.start)
              return currDist < prevDist ? curr : prev
            })
            return nearest.id
          }
        }
      }

      return null
    },
    [tracks],
  )

  // Nudge clip position
  const nudgeClip = useCallback(
    (direction: "left" | "right", large: boolean) => {
      const selected = selectedRef.current
      const allClips = clipsRef.current

      if (selected.length === 0) return

      const amount = large ? 1 : 0.1 // 1 second or 0.1 second

      selected.forEach((clipId) => {
        const clip = allClips.find((c) => c.id === clipId)
        if (!clip) return

        const newStart = direction === "left" ? Math.max(0, clip.start - amount) : clip.start + amount

        onClipUpdate(clipId, { start: newStart })
      })
    },
    [onClipUpdate],
  )

  // Seek playhead
  const seekPlayhead = useCallback(
    (direction: "left" | "right", large: boolean) => {
      const amount = large ? 5 : 1 // 5 seconds or 1 second
      const newTime =
        direction === "left"
          ? Math.max(0, currentTimeRef.current - amount)
          : Math.min(duration, currentTimeRef.current + amount)
      onSeek(newTime)
    },
    [duration, onSeek],
  )

  // Main keyboard handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return
      }

      const { key, shiftKey, metaKey, ctrlKey, altKey } = e
      const cmdOrCtrl = metaKey || ctrlKey

      switch (key) {
        // Playback
        case " ":
          e.preventDefault()
          onTogglePlayback()
          break

        // Navigation with arrow keys
        case "ArrowLeft":
          e.preventDefault()
          if (altKey && selectedRef.current.length > 0) {
            // Alt+Arrow: nudge clip
            nudgeClip("left", shiftKey)
          } else if (selectedRef.current.length > 0 && !cmdOrCtrl) {
            // Arrow: navigate clips
            const nextClip = findAdjacentClip("left")
            if (nextClip) {
              onSelectClips(shiftKey ? [...selectedRef.current, nextClip] : [nextClip])
            }
          } else {
            // Seek playhead
            seekPlayhead("left", shiftKey)
          }
          break

        case "ArrowRight":
          e.preventDefault()
          if (altKey && selectedRef.current.length > 0) {
            nudgeClip("right", shiftKey)
          } else if (selectedRef.current.length > 0 && !cmdOrCtrl) {
            const nextClip = findAdjacentClip("right")
            if (nextClip) {
              onSelectClips(shiftKey ? [...selectedRef.current, nextClip] : [nextClip])
            }
          } else {
            seekPlayhead("right", shiftKey)
          }
          break

        case "ArrowUp":
          e.preventDefault()
          if (selectedRef.current.length > 0) {
            const nextClip = findAdjacentClip("up")
            if (nextClip) {
              onSelectClips(shiftKey ? [...selectedRef.current, nextClip] : [nextClip])
            }
          }
          break

        case "ArrowDown":
          e.preventDefault()
          if (selectedRef.current.length > 0) {
            const nextClip = findAdjacentClip("down")
            if (nextClip) {
              onSelectClips(shiftKey ? [...selectedRef.current, nextClip] : [nextClip])
            }
          }
          break

        // Delete
        case "Delete":
        case "Backspace":
          if (selectedRef.current.length > 0) {
            e.preventDefault()
            onDeleteClip(selectedRef.current)
          }
          break

        // Select all
        case "a":
          if (cmdOrCtrl) {
            e.preventDefault()
            onSelectClips(clipsRef.current.map((c) => c.id))
          }
          break

        // Duplicate
        case "d":
          if (cmdOrCtrl && selectedRef.current.length > 0) {
            e.preventDefault()
            onDuplicateClip(selectedRef.current)
          }
          break

        // Undo/Redo
        case "z":
          if (cmdOrCtrl) {
            e.preventDefault()
            if (shiftKey) {
              onRedo?.()
            } else {
              onUndo?.()
            }
          }
          break

        // Deselect
        case "Escape":
          if (selectedRef.current.length > 0) {
            e.preventDefault()
            onSelectClips([])
          }
          break

        // Home/End - jump to start/end
        case "Home":
          e.preventDefault()
          onSeek(0)
          break

        case "End":
          e.preventDefault()
          onSeek(duration)
          break
      }
    },
    [
      findAdjacentClip,
      nudgeClip,
      seekPlayhead,
      onSelectClips,
      onDeleteClip,
      onDuplicateClip,
      onTogglePlayback,
      onSeek,
      onUndo,
      onRedo,
      duration,
    ],
  )

  // Attach keyboard listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  return {
    findAdjacentClip,
    nudgeClip,
    seekPlayhead,
  }
}
