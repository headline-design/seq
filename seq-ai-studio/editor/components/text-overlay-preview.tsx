"use client"

import type React from "react"

import { memo, useMemo } from "react"
import type { TimelineClip, TextOverlayStyle } from "../types"

interface TextOverlayPreviewProps {
  clips: TimelineClip[]
  currentTime: number
  containerWidth: number
  containerHeight: number
}

function getAnimationStyle(
  animation: TextOverlayStyle["animation"],
  progress: number,
  clipDuration: number,
): React.CSSProperties {
  const fadeInDuration = 0.3
  const fadeOutStart = 1 - 0.3 / clipDuration

  switch (animation) {
    case "fade-in":
      return {
        opacity: Math.min(1, progress / fadeInDuration),
      }
    case "fade-out":
      return {
        opacity: progress > fadeOutStart ? 1 - (progress - fadeOutStart) / (1 - fadeOutStart) : 1,
      }
    case "slide-up":
      const slideProgress = Math.min(1, progress / fadeInDuration)
      return {
        opacity: slideProgress,
        transform: `translateY(${(1 - slideProgress) * 20}px)`,
      }
    case "slide-down":
      const slideDownProgress = Math.min(1, progress / fadeInDuration)
      return {
        opacity: slideDownProgress,
        transform: `translateY(${(slideDownProgress - 1) * 20}px)`,
      }
    case "typewriter":
      return {} // Handled separately with text truncation
    default:
      return {}
  }
}

export const TextOverlayPreview = memo(function TextOverlayPreview({
  clips,
  currentTime,
  containerWidth,
  containerHeight,
}: TextOverlayPreviewProps) {
  const activeTextClips = useMemo(() => {
    return clips.filter((clip) => {
      if (!clip.textOverlay) return false
      const clipEnd = clip.start + clip.duration
      return currentTime >= clip.start && currentTime < clipEnd
    })
  }, [clips, currentTime])

  if (activeTextClips.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {activeTextClips.map((clip) => {
        const overlay = clip.textOverlay!
        const progress = (currentTime - clip.start) / clip.duration
        const animStyle = getAnimationStyle(overlay.animation, progress, clip.duration)

        // For typewriter effect, show partial text
        let displayText = overlay.text
        if (overlay.animation === "typewriter") {
          const charsToShow = Math.floor(progress * overlay.text.length * 1.2)
          displayText = overlay.text.slice(0, Math.min(charsToShow, overlay.text.length))
        }

        const posX = (overlay.position.x / 100) * containerWidth
        const posY = (overlay.position.y / 100) * containerHeight

        return (
          <div
            key={clip.id}
            className="absolute transition-all duration-100"
            style={{
              left: posX,
              top: posY,
              transform: `translate(-50%, -50%) ${animStyle.transform || ""}`,
              opacity: animStyle.opacity ?? 1,
              fontSize: overlay.fontSize,
              fontFamily: overlay.fontFamily,
              fontWeight: overlay.fontWeight,
              color: overlay.color,
              textAlign: overlay.textAlign,
              backgroundColor:
                overlay.backgroundOpacity > 0
                  ? `${overlay.backgroundColor}${Math.round(overlay.backgroundOpacity * 2.55)
                      .toString(16)
                      .padStart(2, "0")}`
                  : "transparent",
              padding: overlay.backgroundOpacity > 0 ? "0.25em 0.5em" : 0,
              borderRadius: overlay.backgroundOpacity > 0 ? "0.25em" : 0,
              whiteSpace: "pre-wrap",
              maxWidth: "80%",
            }}
          >
            {displayText}
            {overlay.animation === "typewriter" && displayText.length < overlay.text.length && (
              <span className="animate-pulse">|</span>
            )}
          </div>
        )
      })}
    </div>
  )
})
