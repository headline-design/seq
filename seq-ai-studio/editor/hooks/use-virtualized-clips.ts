"use client"

import type React from "react"

import { useMemo, useRef, useEffect, useState, useCallback } from "react"
import type { TimelineClip } from "../types"

interface VirtualizedClipOptions {
  clips: TimelineClip[]
  zoomLevel: number
  scrollLeft: number
  viewportWidth: number
  buffer?: number // Extra pixels to render beyond viewport
}

interface VirtualizedResult {
  visibleClips: TimelineClip[]
  totalWidth: number
  visibleRange: { start: number; end: number }
}

/**
 * Hook to virtualize timeline clips - only returns clips that are visible
 * in the current viewport plus a buffer for smooth scrolling
 */
export function useVirtualizedClips({
  clips,
  zoomLevel,
  scrollLeft,
  viewportWidth,
  buffer = 200,
}: VirtualizedClipOptions): VirtualizedResult {
  // Calculate visible time range
  const visibleRange = useMemo(() => {
    const startTime = Math.max(0, (scrollLeft - buffer) / zoomLevel)
    const endTime = (scrollLeft + viewportWidth + buffer) / zoomLevel
    return { start: startTime, end: endTime }
  }, [scrollLeft, viewportWidth, buffer, zoomLevel])

  // Filter clips that are visible in the viewport
  const visibleClips = useMemo(() => {
    return clips.filter((clip) => {
      const clipEnd = clip.start + clip.duration
      // Clip is visible if it overlaps with the visible range
      return clipEnd >= visibleRange.start && clip.start <= visibleRange.end
    })
  }, [clips, visibleRange])

  // Calculate total timeline width
  const totalWidth = useMemo(() => {
    if (clips.length === 0) return 2000
    const maxEnd = Math.max(...clips.map((c) => c.start + c.duration))
    return Math.max(maxEnd * zoomLevel + 500, 2000)
  }, [clips, zoomLevel])

  return {
    visibleClips,
    totalWidth,
    visibleRange,
  }
}

/**
 * Hook to track scroll position with requestAnimationFrame throttling
 */
export function useScrollPosition(scrollContainerRef: React.RefObject<HTMLElement | null>) {
  const [scrollLeft, setScrollLeft] = useState(0)
  const [viewportWidth, setViewportWidth] = useState(800)
  const rafRef = useRef<number | null>(null)

  const updateScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      setScrollLeft(scrollContainerRef.current.scrollLeft)
      setViewportWidth(scrollContainerRef.current.clientWidth)
    }
    rafRef.current = null
  }, [scrollContainerRef])

  const handleScroll = useCallback(() => {
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(updateScroll)
    }
  }, [updateScroll])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    // Initial measurement
    setScrollLeft(el.scrollLeft)
    setViewportWidth(el.clientWidth)

    el.addEventListener("scroll", handleScroll, { passive: true })

    // Resize observer for viewport changes
    const resizeObserver = new ResizeObserver(() => {
      if (el) {
        setViewportWidth(el.clientWidth)
      }
    })
    resizeObserver.observe(el)

    return () => {
      el.removeEventListener("scroll", handleScroll)
      resizeObserver.disconnect()
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [scrollContainerRef, handleScroll])

  return { scrollLeft, viewportWidth }
}
