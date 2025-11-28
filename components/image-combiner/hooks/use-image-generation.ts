"use client"

import type React from "react"

import { useState } from "react"
import type { Generation } from "../types"

interface UseImageGenerationProps {
  prompt: string
  aspectRatio: string
  image1: File | null
  image2: File | null
  image1Url: string
  image2Url: string
  useUrls: boolean
  generations: Generation[]
  setGenerations: React.Dispatch<React.SetStateAction<Generation[]>>
  addGeneration: (generation: Generation) => Promise<void>
  onToast: (message: string, type?: "success" | "error") => void
  onImageUpload: (file: File, imageNumber: 1 | 2) => Promise<void>
  onApiKeyMissing?: () => void
}

interface GenerateImageOptions {
  prompt?: string
  aspectRatio?: string
  image1?: File | null
  image2?: File | null
  image1Url?: string
  image2Url?: string
  useUrls?: boolean
}

const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime)

    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.15)
  } catch (error) {
    console.log("Could not play sound:", error)
  }
}

export function useImageGeneration({
  prompt,
  aspectRatio,
  image1,
  image2,
  image1Url,
  image2Url,
  useUrls,
  generations,
  setGenerations,
  addGeneration,
  onToast,
  onImageUpload,
  onApiKeyMissing,
}: UseImageGenerationProps) {
  const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  const cancelGeneration = (generationId: string) => {
    const generation = generations.find((g) => g.id === generationId)
    if (generation?.abortController) {
      generation.abortController.abort()
    }

    setGenerations((prev) =>
      prev.map((gen) =>
        gen.id === generationId && gen.status === "loading"
          ? { ...gen, status: "error" as const, error: "Cancelled by user", progress: 0, abortController: undefined }
          : gen,
      ),
    )
    onToast("Generation cancelled", "error")
  }

  const generateImage = async (options?: GenerateImageOptions) => {
    const effectivePrompt = options?.prompt ?? prompt
    const effectiveAspectRatio = options?.aspectRatio ?? aspectRatio
    const effectiveImage1 = options?.image1 !== undefined ? options.image1 : image1
    const effectiveImage2 = options?.image2 !== undefined ? options.image2 : image2
    const effectiveImage1Url = options?.image1Url !== undefined ? options.image1Url : image1Url
    const effectiveImage2Url = options?.image2Url !== undefined ? options.image2Url : image2Url
    const effectiveUseUrls = options?.useUrls !== undefined ? options.useUrls : useUrls

    const hasImages = effectiveUseUrls ? effectiveImage1Url || effectiveImage2Url : effectiveImage1 || effectiveImage2
    const currentMode = hasImages ? "image-editing" : "text-to-image"

    if (currentMode === "image-editing" && !effectiveUseUrls && !effectiveImage1) {
      onToast("Please upload at least one image for editing mode", "error")
      return
    }
    if (currentMode === "image-editing" && effectiveUseUrls && !effectiveImage1Url) {
      onToast("Please provide at least one image URL for editing mode", "error")
      return
    }
    if (!effectivePrompt.trim()) {
      onToast("Please enter a prompt", "error")
      return
    }

    const numVariations = 1
    const generationPromises = []

    for (let i = 0; i < numVariations; i++) {
      const generationId = `gen-${Date.now()}-${Math.random().toString(36).substring(7)}`
      const controller = new AbortController()

      const newGeneration: Generation = {
        id: generationId,
        status: "loading",
        progress: 0,
        imageUrl: null,
        prompt: effectivePrompt,
        timestamp: Date.now() + i,
        abortController: controller,
      }

      setGenerations((prev) => [newGeneration, ...prev])

      if (i === 0) {
        setSelectedGenerationId(generationId)
      }

      const progressInterval = setInterval(() => {
        setGenerations((prev) =>
          prev.map((gen) => {
            if (gen.id === generationId && gen.status === "loading") {
              const next =
                gen.progress >= 98
                  ? 98
                  : gen.progress >= 96
                    ? gen.progress + 0.2
                    : gen.progress >= 90
                      ? gen.progress + 0.5
                      : gen.progress >= 75
                        ? gen.progress + 0.8
                        : gen.progress >= 50
                          ? gen.progress + 1
                          : gen.progress >= 25
                            ? gen.progress + 1.2
                            : gen.progress + 1.5
              return { ...gen, progress: Math.min(next, 98) }
            }
            return gen
          }),
        )
      }, 100)

      const generationPromise = (async () => {
        try {
          const formData = new FormData()
          formData.append("mode", currentMode)
          formData.append("prompt", effectivePrompt)
          formData.append("aspectRatio", effectiveAspectRatio)

          if (currentMode === "image-editing") {
            if (effectiveUseUrls) {
              formData.append("image1Url", effectiveImage1Url)
              if (effectiveImage2Url) {
                formData.append("image2Url", effectiveImage2Url)
              }
            } else {
              if (effectiveImage1) {
                formData.append("image1", effectiveImage1)
              }
              if (effectiveImage2) {
                formData.append("image2", effectiveImage2)
              }
            }
          }

          const response = await fetch("/api/generate-image", {
            method: "POST",
            body: formData,
            signal: controller.signal,
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }))

            if (errorData.error === "Configuration error" && errorData.details?.includes("AI_GATEWAY_API_KEY")) {
              clearInterval(progressInterval)
              setGenerations((prev) => prev.filter((gen) => gen.id !== generationId))
              onApiKeyMissing?.()
              return
            }

            throw new Error(`${errorData.error}${errorData.details ? `: ${errorData.details}` : ""}`)
          }

          const data = await response.json()

          clearInterval(progressInterval)

          if (data.url) {
            const completedGeneration: Generation = {
              id: generationId,
              status: "complete",
              progress: 100,
              imageUrl: data.url,
              prompt: effectivePrompt,
              timestamp: Date.now(),
              createdAt: new Date().toISOString(),
              aspectRatio: effectiveAspectRatio,
              mode: currentMode,
            }

            setGenerations((prev) => prev.filter((gen) => gen.id !== generationId))

            await addGeneration(completedGeneration)
          }

          if (selectedGenerationId === generationId) {
            setImageLoaded(true)
          }

          playSuccessSound()
        } catch (error) {
          console.error("Error in generation:", error)
          clearInterval(progressInterval)

          if (error instanceof Error && error.name === "AbortError") {
            return
          }

          const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

          setGenerations((prev) => prev.filter((gen) => gen.id !== generationId))

          onToast(`Error generating image: ${errorMessage}`, "error")
        }
      })()

      generationPromises.push(generationPromise)
    }

    await Promise.all(generationPromises)
  }

  const loadGeneratedAsInput = async () => {
    const selectedGeneration = generations.find((g) => g.id === selectedGenerationId)
    if (!selectedGeneration?.imageUrl) return

    try {
      const response = await fetch(selectedGeneration.imageUrl)
      const blob = await response.blob()
      const file = new File([blob], "generated-image.png", { type: "image/png" })

      await onImageUpload(file, 1)
      onToast("Image loaded into Input 1", "success")
    } catch (error) {
      console.error("Error loading image as input:", error)
      onToast("Error loading image", "error")
    }
  }

  return {
    selectedGenerationId,
    setSelectedGenerationId,
    imageLoaded,
    setImageLoaded,
    generateImage,
    cancelGeneration,
    loadGeneratedAsInput,
  }
}
