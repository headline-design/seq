"use client"

import type React from "react"

import { createContext, useContext, type ReactNode, useMemo } from "react"
import type { MediaItem, TimelineClip, Track, StoryboardPanel } from "../types"

// Types for the context
export interface PlaybackState {
  isPlaying: boolean
  currentTime: number
  duration: number
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  seekTo: (time: number) => void
}

export interface TimelineState {
  clips: TimelineClip[]
  tracks: Track[]
  media: MediaItem[]
  mediaMap: Record<string, MediaItem>
  selectedClipIds: string[]
  selectionBounds: { start: number; end: number } | null
  contentDuration: number
  zoomLevel: number
  setClips: React.Dispatch<React.SetStateAction<TimelineClip[]>>
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>
  setMedia: React.Dispatch<React.SetStateAction<MediaItem[]>>
  setSelectedClipIds: React.Dispatch<React.SetStateAction<string[]>>
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>
  addClip: (clip: TimelineClip) => void
  updateClip: (id: string, updates: Partial<TimelineClip>) => void
  deleteClip: (id: string) => void
  deleteSelectedClips: () => void
  duplicateClip: (id: string) => void
  splitClip: (id: string, time: number) => void
}

export interface StoryboardState {
  panels: StoryboardPanel[]
  setPanels: React.Dispatch<React.SetStateAction<StoryboardPanel[]>>
  updatePanel: (id: string, updates: Partial<StoryboardPanel>) => void
  addPanel: (panel: StoryboardPanel) => void
  removePanel: (id: string) => void
}

export interface ExportState {
  isExporting: boolean
  exportProgress: number
  exportPhase: "idle" | "init" | "audio" | "video" | "encoding" | "complete"
  downloadUrl: string | null
  startExport: (resolution: "720p" | "1080p", source: "all" | "selection") => Promise<void>
  cancelExport: () => void
}

export interface UIState {
  activePanel: "library" | "storyboard" | "create" | "settings" | "transitions"
  setActivePanel: (panel: UIState["activePanel"]) => void
  selectedLibraryItemId: string | null
  setSelectedLibraryItemId: (id: string | null) => void
  isMobile: boolean
  sidebarWidth: number
  timelineHeight: number
  setSidebarWidth: (width: number) => void
  setTimelineHeight: (height: number) => void
}

export interface EditorContextValue {
  playback: PlaybackState
  timeline: TimelineState
  storyboard: StoryboardState
  export: ExportState
  ui: UIState
  // Utility functions
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function useEditorContext() {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error("useEditorContext must be used within an EditorProvider")
  }
  return context
}

// Selective hooks to prevent unnecessary re-renders
export function usePlayback() {
  const { playback } = useEditorContext()
  return playback
}

export function useTimeline() {
  const { timeline } = useEditorContext()
  return timeline
}

export function useStoryboard() {
  const { storyboard } = useEditorContext()
  return storyboard
}

export function useExport() {
  const { export: exportState } = useEditorContext()
  return exportState
}

export function useEditorUI() {
  const { ui } = useEditorContext()
  return ui
}

export function useHistory() {
  const { undo, redo, canUndo, canRedo } = useEditorContext()
  return { undo, redo, canUndo, canRedo }
}

interface EditorProviderProps {
  children: ReactNode
  value: EditorContextValue
}

export function EditorProvider({ children, value }: EditorProviderProps) {
  // Memoize the value to prevent unnecessary re-renders
  const memoizedValue = useMemo(() => value, [value])

  return <EditorContext.Provider value={memoizedValue}>{children}</EditorContext.Provider>
}

export { EditorContext }
