import type React from "react"
export interface GeneratedImage {
  url: string
  prompt: string
  description?: string
}

export interface Generation {
  id: string
  status: "loading" | "complete" | "error"
  progress: number
  imageUrl: string | null
  prompt: string
  error?: string
  timestamp: number
  abortController?: AbortController
  thumbnailLoaded?: boolean
}

export type AspectRatioOption = {
  value: string
  label: string
  ratio: number
  icon: React.ReactNode
}
