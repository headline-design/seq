// Project save/load service for serializing and deserializing editor state

import type { MediaItem, TimelineClip, Track, StoryboardPanel, VideoConfig } from "../types"

export interface ProjectData {
  version: string
  name: string
  createdAt: string
  updatedAt: string
  media: MediaItem[]
  timelineClips: TimelineClip[]
  tracks: Track[]
  storyboardPanels: StoryboardPanel[]
  videoConfig: VideoConfig
  masterDescription?: string
}

const PROJECT_VERSION = "1.0.0"
const PROJECT_STORAGE_KEY = "seq-editor-project"
const AUTOSAVE_KEY = "seq-editor-autosave"

// Convert blob URLs to base64 for persistence
async function blobUrlToBase64(url: string): Promise<string | null> {
  if (!url.startsWith("blob:")) return url

  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// Convert base64 back to blob URL
function base64ToBlobUrl(base64: string): string {
  if (!base64.startsWith("data:")) return base64

  try {
    const [header, data] = base64.split(",")
    const mimeMatch = header.match(/data:([^;]+)/)
    const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream"

    const binary = atob(data)
    const array = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i)
    }

    const blob = new Blob([array], { type: mime })
    return URL.createObjectURL(blob)
  } catch {
    return base64
  }
}

export async function serializeProject(
  media: MediaItem[],
  timelineClips: TimelineClip[],
  tracks: Track[],
  storyboardPanels: StoryboardPanel[],
  videoConfig: VideoConfig,
  masterDescription?: string,
  projectName?: string,
): Promise<ProjectData> {
  // Convert blob URLs to base64 for media items
  const serializedMedia = await Promise.all(
    media.map(async (item) => ({
      ...item,
      url: (await blobUrlToBase64(item.url)) || item.url,
      thumbnailUrl: item.thumbnailUrl ? (await blobUrlToBase64(item.thumbnailUrl)) || item.thumbnailUrl : undefined,
    })),
  )

  // Convert blob URLs in storyboard panels
  const serializedStoryboard = await Promise.all(
    storyboardPanels.map(async (panel) => ({
      ...panel,
      imageUrl: panel.imageUrl ? (await blobUrlToBase64(panel.imageUrl)) || panel.imageUrl : undefined,
      linkedImageUrl: panel.linkedImageUrl
        ? (await blobUrlToBase64(panel.linkedImageUrl)) || panel.linkedImageUrl
        : undefined,
      videoUrl: panel.videoUrl ? (await blobUrlToBase64(panel.videoUrl)) || panel.videoUrl : undefined,
    })),
  )

  return {
    version: PROJECT_VERSION,
    name: projectName || `Project ${new Date().toLocaleDateString()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    media: serializedMedia,
    timelineClips,
    tracks,
    storyboardPanels: serializedStoryboard,
    videoConfig,
    masterDescription,
  }
}

export function deserializeProject(data: ProjectData): {
  media: MediaItem[]
  timelineClips: TimelineClip[]
  tracks: Track[]
  storyboardPanels: StoryboardPanel[]
  videoConfig: VideoConfig
  masterDescription?: string
} {
  // Convert base64 back to blob URLs for media items
  const deserializedMedia = data.media.map((item) => ({
    ...item,
    url: base64ToBlobUrl(item.url),
    thumbnailUrl: item.thumbnailUrl ? base64ToBlobUrl(item.thumbnailUrl) : undefined,
  }))

  // Convert base64 back to blob URLs for storyboard panels
  const deserializedStoryboard = data.storyboardPanels.map((panel) => ({
    ...panel,
    imageUrl: panel.imageUrl ? base64ToBlobUrl(panel.imageUrl) : undefined,
    linkedImageUrl: panel.linkedImageUrl ? base64ToBlobUrl(panel.linkedImageUrl) : undefined,
    videoUrl: panel.videoUrl ? base64ToBlobUrl(panel.videoUrl) : undefined,
  }))

  return {
    media: deserializedMedia,
    timelineClips: data.timelineClips,
    tracks: data.tracks,
    storyboardPanels: deserializedStoryboard,
    videoConfig: data.videoConfig,
    masterDescription: data.masterDescription,
  }
}

export async function saveProjectToFile(projectData: ProjectData): Promise<void> {
  const json = JSON.stringify(projectData, null, 2)
  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = `${projectData.name.replace(/[^a-z0-9]/gi, "_")}.seqproj`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function loadProjectFromFile(): Promise<ProjectData | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".seqproj,.json"

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) {
        resolve(null)
        return
      }

      try {
        const text = await file.text()
        const data = JSON.parse(text) as ProjectData

        // Validate project structure
        if (!data.version || !data.media || !data.timelineClips) {
          throw new Error("Invalid project file")
        }

        resolve(data)
      } catch {
        resolve(null)
      }
    }

    input.oncancel = () => resolve(null)
    input.click()
  })
}

// Autosave to localStorage
export async function autosaveProject(
  media: MediaItem[],
  timelineClips: TimelineClip[],
  tracks: Track[],
  storyboardPanels: StoryboardPanel[],
  videoConfig: VideoConfig,
  masterDescription?: string,
): Promise<void> {
  try {
    const projectData = await serializeProject(
      media,
      timelineClips,
      tracks,
      storyboardPanels,
      videoConfig,
      masterDescription,
      "Autosave",
    )
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(projectData))
  } catch (e) {
    console.warn("Autosave failed:", e)
  }
}

export function loadAutosave(): ProjectData | null {
  try {
    const saved = localStorage.getItem(AUTOSAVE_KEY)
    if (!saved) return null
    return JSON.parse(saved) as ProjectData
  } catch {
    return null
  }
}

export function clearAutosave(): void {
  localStorage.removeItem(AUTOSAVE_KEY)
}

export function hasAutosave(): boolean {
  return localStorage.getItem(AUTOSAVE_KEY) !== null
}
