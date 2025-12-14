"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import type { TimelineClip, Track } from "../types"

interface SelectionBox {
  x: number
  y: number
  w: number
  h: number
}

interface UseTimelineSelectionOptions {
  clips: TimelineClip[]
  tracks: Track[]
  zoomLevel: number
  tool: "select" | "razor"
  onSelectClips: (clipIds: string[]) => void
  onToolChange: (tool: "select" | "razor") => void
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
}

export function useTimelineSelection({
  clips,
  tracks,
  zoomLevel,
  tool,
  onSelectClips,
  onToolChange,
  scrollContainerRef,
}: UseTimelineSelectionOptions) {
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null)
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null)

  // Refs for callbacks
  const clipsRef = useRef(clips)
  clipsRef.current = clips
  const tracksRef = useRef(tracks)
  tracksRef.current = tracks
  const zoomRef = useRef(zoomLevel)
  zoomRef.current = zoomLevel
  const onSelectClipsRef = useRef(onSelectClips)
  onSelectClipsRef.current = onSelectClips

  const handleMouseDownBackground = useCallback(
    (e: React.MouseEvent) => {
      const container = scrollContainerRef.current
      if (!container) return

      // Ignore scrollbar clicks
      const rect = container.getBoundingClientRect()
      if (e.clientY > rect.bottom - 12) return

      // Ignore ruler clicks
      const isRuler = (e.target as HTMLElement).closest("canvas")
      if (isRuler) return

      // Ignore clip clicks
      if ((e.target as HTMLElement).closest(".clip-item")) return

      // Exit razor mode on background click
      if (tool === "razor") {
        onToolChange("select")
        return
      }

      // Start marquee selection
      const x = e.clientX - rect.left + container.scrollLeft
      const y = e.clientY - rect.top + container.scrollTop

      selectionStartRef.current = { x, y }
      setIsSelecting(true)
      setSelectionBox({ x, y, w: 0, h: 0 })

      // Clear selection unless modifier held
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
        onSelectClips([])
      }
    },
    [tool, onToolChange, onSelectClips, scrollContainerRef],
  )

  const handleSelectionMove = useCallback(
    (e: MouseEvent) => {
      if (!selectionStartRef.current) return
      const container = scrollContainerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const currentX = e.clientX - rect.left + container.scrollLeft
      const currentY = e.clientY - rect.top + container.scrollTop
      const startX = selectionStartRef.current.x
      const startY = selectionStartRef.current.y

      const x = Math.min(startX, currentX)
      const y = Math.min(startY, currentY)
      const w = Math.abs(currentX - startX)
      const h = Math.abs(currentY - startY)

      setSelectionBox({ x, y, w, h })

      // Find intersecting clips
      const intersectingIds: string[] = []
      let currentTrackY = 32 // Ruler height

      tracksRef.current.forEach((track) => {
        const trackHeight = track.type === "audio" ? 64 : 96
        const trackTop = currentTrackY
        const trackBottom = trackTop + trackHeight

        if (y < trackBottom && y + h > trackTop) {
          const trackClips = clipsRef.current.filter((c) => c.trackId === track.id)
          trackClips.forEach((clip) => {
            const clipX = clip.start * zoomRef.current
            const clipW = clip.duration * zoomRef.current

            if (x < clipX + clipW && x + w > clipX) {
              intersectingIds.push(clip.id)
            }
          })
        }
        currentTrackY += trackHeight
      })

      if (intersectingIds.length > 0) {
        onSelectClipsRef.current(intersectingIds)
      }
    },
    [scrollContainerRef],
  )

  const handleSelectionEnd = useCallback(() => {
    setIsSelecting(false)
    setSelectionBox(null)
    selectionStartRef.current = null
  }, [])

  return {
    isSelecting,
    selectionBox,
    handleMouseDownBackground,
    handleSelectionMove,
    handleSelectionEnd,
  }
}
