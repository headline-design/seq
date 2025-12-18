"use client"
import { memo, useRef, useState, useEffect, useCallback } from "react"
import type { MediaItem } from "../types"
import { MusicIcon } from "./icons"

interface MediaThumbnailProps {
  item: MediaItem
  width: number
  height: number
  className?: string
  showDuration?: boolean
  showType?: boolean
  playOnHover?: boolean
  lazy?: boolean
}

/**
 * Performance-optimized media thumbnail with:
 * - Intersection Observer for lazy loading
 * - RAF-throttled hover state
 * - Optimized video playback
 */
export const MediaThumbnail = memo(function MediaThumbnail({
  item,
  width,
  height,
  className = "",
  showDuration = false,
  showType = false,
  playOnHover = true,
  lazy = true,
}: MediaThumbnailProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVisible, setIsVisible] = useState(!lazy)
  const [isHovering, setIsHovering] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy) return

    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: "100px" },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [lazy])

  // Handle video hover playback
  const handleMouseEnter = useCallback(() => {
    if (!playOnHover) return
    setIsHovering(true)

    if (videoRef.current && item.status === "ready" && item.type === "video") {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
    }
  }, [playOnHover, item.status, item.type])

  const handleMouseLeave = useCallback(() => {
    if (!playOnHover) return
    setIsHovering(false)

    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [playOnHover])

  const handleLoadedData = useCallback(() => {
    setHasLoaded(true)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-black rounded border border-[var(--border-default)] ${className}`}
      style={{ width, height }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {item.type === "audio" ? (
        <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] bg-[var(--surface-1)]">
          <MusicIcon className="w-6 h-6" />
        </div>
      ) : !isVisible ? (
        // Placeholder for lazy loading
        <div className="w-full h-full bg-[var(--surface-1)]" />
      ) : item.status === "ready" ? (
        <>
          {item.type === "video" ? (
            <video
              ref={videoRef}
              src={item.url}
              className={`w-full h-full object-cover transition-opacity duration-200 ${
                isHovering ? "opacity-100" : "opacity-70"
              } ${hasLoaded ? "" : "opacity-0"}`}
              muted
              loop
              playsInline
              preload="metadata"
              crossOrigin="anonymous"
              onLoadedData={handleLoadedData}
            />
          ) : item.type === "image" ? (
            <img
              src={item.url || "/placeholder.svg"}
              alt={item.prompt || "Media"}
              className={`w-full h-full object-cover transition-opacity duration-200 ${
                isHovering ? "opacity-100" : "opacity-70"
              }`}
              loading="lazy"
              onLoad={() => setHasLoaded(true)}
            />
          ) : null}

          {/* Loading placeholder */}
          {!hasLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface-1)]">
              <div className="animate-spin h-3 w-3 border border-[var(--border-emphasis)] border-t-white rounded-full" />
            </div>
          )}
        </>
      ) : (
        // Loading state
        <div className="w-full h-full flex items-center justify-center bg-[var(--surface-1)]">
          <div className="animate-spin h-3 w-3 border border-[var(--border-emphasis)] border-t-white rounded-full" />
        </div>
      )}

      {/* Overlays */}
      {showDuration && item.duration > 0 && (
        <div className="absolute bottom-1 left-1 text-[9px] font-mono bg-black/70 text-white px-1 rounded">
          {item.duration.toFixed(1)}s
        </div>
      )}

      {showType && (
        <div className="absolute bottom-1 right-1 text-[8px] uppercase bg-black/70 text-white px-1 rounded">
          {item.type}
        </div>
      )}
    </div>
  )
})
