"use client"

import { useCallback, useRef } from "react"
import type { MediaItem } from "../types"

interface UseMediaManagementProps {
  defaultDuration: number
  onMediaAdd: (media: MediaItem) => void
  onMediaUpdate: (id: string, updates: Partial<MediaItem>) => void
}

export function useMediaManagement({ defaultDuration, onMediaAdd, onMediaUpdate }: UseMediaManagementProps) {
  const objectUrlsRef = useRef<string[]>([])

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
        const updates: Partial<MediaItem> = {
          duration: el.duration,
        }

        if (!isAudio) {
          const videoEl = el as HTMLVideoElement
          const r = videoEl.videoWidth / videoEl.videoHeight
          updates.resolution = { width: videoEl.videoWidth, height: videoEl.videoHeight }

          if (Math.abs(r - 16 / 9) < 0.1) updates.aspectRatio = "16:9"
          else if (Math.abs(r - 9 / 16) < 0.1) updates.aspectRatio = "9:16"
          else if (Math.abs(r - 1) < 0.1) updates.aspectRatio = "1:1"
          else updates.aspectRatio = "custom"
        }

        onMediaUpdate(newId, updates)
      }

      el.src = url
      onMediaAdd(newMedia)
    },
    [defaultDuration, onMediaAdd, onMediaUpdate],
  )

  const cleanup = useCallback(() => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    objectUrlsRef.current = []
  }, [])

  return {
    handleImport,
    cleanup,
    objectUrlsRef,
  }
}
