"use client"

import type React from "react"

import { useEffect, useCallback } from "react"

interface ToastContext {
  success: (message: string) => void
  error: (message: string) => void
}

interface UseEditorKeyboardProps {
  onSaveProject: () => void
  onLoadProject: () => void
  onAddMarker: () => void
  onZoomToFit: () => void
  onSaveFrame: (videoElement: HTMLVideoElement | null, currentTime: number) => void
  currentTime: number
  previewVideoRef: React.RefObject<HTMLVideoElement> | null
  videoRefA: React.RefObject<HTMLVideoElement> | null
  videoRefB: React.RefObject<HTMLVideoElement> | null
  isPreviewPlayback: boolean
  toastCtx: ToastContext
}

export function useEditorKeyboard({
  onSaveProject,
  onLoadProject,
  onAddMarker,
  onZoomToFit,
  onSaveFrame,
  currentTime,
  previewVideoRef,
  videoRefA,
  videoRefB,
  isPreviewPlayback,
  toastCtx,
}: UseEditorKeyboardProps) {
  const handleFrameCapture = useCallback(() => {
    // Try to capture from the active video element for highest quality
    const videoElement = isPreviewPlayback
      ? previewVideoRef?.current
      : videoRefA?.current && Number.parseFloat(videoRefA.current.style.opacity || "1") > 0
        ? videoRefA?.current
        : videoRefB?.current

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

        const mins = Math.floor(currentTime / 60)
        const secs = Math.floor(currentTime % 60)
        const ms = Math.floor((currentTime % 1) * 1000)
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
  }, [currentTime, isPreviewPlayback, previewVideoRef, videoRefA, videoRefB, toastCtx])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S: Save project
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        onSaveProject()
        return
      }

      // Cmd/Ctrl + O: Open project
      if ((e.metaKey || e.ctrlKey) && e.key === "o") {
        e.preventDefault()
        onLoadProject()
        return
      }

      // F: Save frame
      if (e.key === "f" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        handleFrameCapture()
        return
      }

      // M: Add marker
      if (e.key === "m" || e.key === "M") {
        e.preventDefault()
        onAddMarker()
        return
      }

      // Shift + Z: Zoom to fit
      if (e.key === "z" && e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        onZoomToFit()
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onSaveProject, onLoadProject, onAddMarker, onZoomToFit, handleFrameCapture])
}
