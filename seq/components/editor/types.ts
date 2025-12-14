export interface MediaItem {
  id: string
  url: string
  prompt: string
  duration: number
  aspectRatio: string
  thumbnailUrl?: string
  status: "generating" | "ready" | "error" | "complete"
  type: "video" | "audio" | "image"
  resolution?: { width: number; height: number }
}

export type TransitionType = "none" | "cross-dissolve" | "fade-black" | "fade-white" | "wipe-left" | "wipe-right"

export interface ClipEffects {
  brightness: number // -100 to 100, default 0
  contrast: number // -100 to 100, default 0
  saturation: number // -100 to 100, default 0
  hue: number // -180 to 180, default 0
  blur: number // 0 to 20, default 0
  opacity: number // 0 to 100, default 100
}

export interface TextOverlayStyle {
  text: string
  fontSize: number // 12-200
  fontFamily: string
  fontWeight: "normal" | "bold" | "bolder" | "lighter" | number
  color: string
  backgroundColor: string
  backgroundOpacity: number // 0-100
  textAlign: "left" | "center" | "right"
  position: { x: number; y: number } // percentage 0-100
  animation: "none" | "fade-in" | "fade-out" | "slide-up" | "slide-down" | "typewriter"
}

export interface TimelineClip {
  speed: number
  id: string // Unique instance ID on timeline
  mediaId: string // Reference to source media
  trackId: string
  start: number // Start time on timeline (seconds)
  duration: number // Duration of clip (seconds)
  offset: number // Start time within the source media (seconds)
  volume?: number // 0 to 1, defaults to 1
  transition?: {
    type: TransitionType
    duration: number // Duration of the transition in seconds
  }
  isAudioDetached?: boolean // If true, audio waveform is hidden and player is muted for this clip
  effects?: ClipEffects
  textOverlay?: TextOverlayStyle
  fadeIn?: number // Duration in seconds for fade-in (0 = no fade)
  fadeOut?: number // Duration in seconds for fade-out (0 = no fade)
  isLocked?: boolean // If true, clip cannot be moved, trimmed, or deleted
}

export interface Track {
  id: string
  name: string
  type: "video" | "audio" | "text"
  volume?: number // 0 to 1
  isMuted?: boolean
  isLocked?: boolean
  order?: number
}

export interface StoryboardPanel {
  id: string
  type: "scene" | "transition"
  prompt: string
  imageUrl?: string // Main image or Start frame
  linkedImageUrl?: string // End frame for transitions
  videoUrl?: string
  mediaId?: string // If added to library/timeline, link to it
  status: "idle" | "generating-image" | "generating-video" | "enhancing" | "error"
  error?: string
  duration: 5 | 8 | 4 | 3 | 2 | 6 // in seconds
}

export interface VideoConfig {
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "21:9" | string
  useFastModel: boolean
}

export interface Marker {
  id: string
  time: number // Position in seconds
  label: string
  color: "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "pink"
}

export interface AppState {
  media: MediaItem[]
  timelineClips: TimelineClip[]
  tracks: Track[]
  currentTime: number // Global playhead position in seconds
  duration: number // Total timeline duration
  isPlaying: boolean
  zoomLevel: number // Pixels per second
  selectedClipId: string | null // ID of selected TimelineClip or MediaItem
  selectionType: "library" | "timeline" | null
  markers?: Marker[] // Array of timeline markers/chapters
}
