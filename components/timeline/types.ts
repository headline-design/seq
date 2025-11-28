export interface TimelineClip {
  id: string
  videoUrl: string
  startTime: number // Start time in seconds on the timeline
  duration: number // Total duration of the source video
  trimStart: number // Trim from start (in seconds)
  trimEnd: number // Trim from end (in seconds)
  track: number // Track number (0, 1, 2, etc.)
  thumbnailUrl?: string
  name?: string
  color?: string
}

export interface TimelineState {
  clips: TimelineClip[]
  zoom: number // Pixels per second
  playheadPosition: number // Current playhead position in seconds
  selectedClipId: string | null
  scrollOffset: number // Horizontal scroll offset
}

export interface VideoMetadata {
  duration: number
  width: number
  height: number
}

export interface SnapResult {
  time: number
  snapped: boolean
  snapType: "clip-start" | "clip-end" | "playhead" | "none"
  snapTargetId?: string
}

export interface DragState {
  type: "move" | "trim-start" | "trim-end" | "none"
  clipId: string | null
  startX: number
  startTime: number
  startTrimStart: number
  startTrimEnd: number
}

export type ArrangeMode = "magnetic" | "free"
