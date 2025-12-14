"use client"

import { useState, useCallback, useRef } from "react"
import type { MediaItem } from "../types"

interface UseMediaGenerationOptions {
  defaultDuration: number
  onMediaAdd: (media: MediaItem) => void
  onMediaUpdate: (id: string, updates: Partial<MediaItem>) => void
  onAddToTimeline: (media: MediaItem) => void
}

interface UseMediaGenerationReturn {
  isGenerating: boolean
  generatedItem: { url: string; type: "video" | "image" } | null
  generate: (
    prompt: string,
    aspectRatio: string,
    type?: "video" | "image",
    model?: string,
    image?: string,
  ) => Promise<void>
  importFile: (file: File) => void
}

export function useMediaGeneration({
  defaultDuration,
  onMediaAdd,
  onMediaUpdate,
  onAddToTimeline,
}: UseMediaGenerationOptions): UseMediaGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedItem, setGeneratedItem] = useState<{ url: string; type: "video" | "image" } | null>(null)
  const objectUrlsRef = useRef<string[]>([])
  const isMountedRef = useRef(true)

  const generate = useCallback(
    async (prompt: string, aspectRatio: string, type: "video" | "image" = "video", model?: string, image?: string) => {
      const newId = Math.random().toString(36).substr(2, 9)
      const tempMedia: MediaItem = {
        id: newId,
        url: "",
        prompt: prompt,
        duration: type === "video" ? defaultDuration : 5,
        aspectRatio: aspectRatio,
        status: "generating",
        type: type,
        resolution: { width: 1280, height: 720 },
      }
      onMediaAdd(tempMedia)
      setIsGenerating(true)

      try {
        let videoUrl = ""

        if (type === "video") {
          const response = await fetch("/api/seq/generate-video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, aspectRatio, model, imageUrl: image }),
          })

          if (!response.ok) {
            const err = await response.json()
            throw new Error(err.error || "Generation failed")
          }

          const result = await response.json()
          setGeneratedItem({ url: result.url, type: "video" })
          videoUrl = result.url
        } else {
          // Image Generation
          let apiAspectRatio = "square"
          if (aspectRatio === "16:9") apiAspectRatio = "landscape"
          else if (aspectRatio === "9:16") apiAspectRatio = "portrait"

          const formData = new FormData()
          if (image) {
            formData.append("mode", "image-editing")
            formData.append("image1Url", image)
          } else {
            formData.append("mode", "text-to-image")
          }
          formData.append("prompt", prompt)
          formData.append("aspectRatio", apiAspectRatio)
          if (model) formData.append("model", model)

          const response = await fetch("/api/seq/generate-image", { method: "POST", body: formData })

          if (!response.ok) {
            const err = await response.json()
            throw new Error(err.error || "Image generation failed")
          }

          const result = await response.json()
          setGeneratedItem({ url: result.url, type: "image" })
          videoUrl = result.url
        }

        if (!videoUrl) throw new Error("No URL received")

        if (isMountedRef.current) {
          onMediaUpdate(newId, { url: videoUrl, status: "ready" })

          if (videoUrl) {
            const readyItem = { ...tempMedia, url: videoUrl, status: "ready" as const }
            onAddToTimeline(readyItem)
          }
        }
      } catch (error: unknown) {
        if (isMountedRef.current) {
          onMediaUpdate(newId, { status: "error" })
          const message = error instanceof Error ? error.message : "Generation failed"
          alert(message)
        }
      } finally {
        if (isMountedRef.current) setIsGenerating(false)
      }
    },
    [defaultDuration, onMediaAdd, onMediaUpdate, onAddToTimeline],
  )

  const importFile = useCallback(
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
        onMediaUpdate(newId, {
          duration: el.duration,
          aspectRatio: newMedia.aspectRatio,
          resolution: newMedia.resolution,
        })
      }
      el.src = url
      onMediaAdd(newMedia)
    },
    [defaultDuration, onMediaAdd, onMediaUpdate],
  )

  return {
    isGenerating,
    generatedItem,
    generate,
    importFile,
  }
}
