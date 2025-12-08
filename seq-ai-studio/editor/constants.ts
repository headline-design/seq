// Editor constants for consistent values across components

// Timeline
export const TIMELINE_CONSTANTS = {
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 4,
  DEFAULT_ZOOM: 1,
  SNAP_THRESHOLD: 10, // pixels
  TRACK_HEIGHT: 80,
  AUDIO_TRACK_HEIGHT: 50,
  RULER_HEIGHT: 30,
  CLIP_MIN_WIDTH: 20,
  VIRTUALIZATION_BUFFER: 200, // pixels outside viewport to render
} as const

// Playback
export const PLAYBACK_CONSTANTS = {
  DEFAULT_FPS: 30,
  PREVIEW_FPS: 30,
  EXPORT_FPS: 30,
  SEEK_STEP_SMALL: 1 / 30, // one frame at 30fps
  SEEK_STEP_LARGE: 1, // one second
} as const

// Export
export const EXPORT_CONSTANTS = {
  RESOLUTIONS: {
    "720p": { width: 1280, height: 720 },
    "1080p": { width: 1920, height: 1080 },
  },
  DEFAULT_BITRATE: 8000000, // 8 Mbps
  AUDIO_SAMPLE_RATE: 48000,
} as const

// UI
export const UI_CONSTANTS = {
  SIDEBAR_MIN_WIDTH: 200,
  SIDEBAR_MAX_WIDTH: 500,
  SIDEBAR_DEFAULT_WIDTH: 300,
  TIMELINE_MIN_HEIGHT: 150,
  TIMELINE_MAX_HEIGHT: 500,
  TIMELINE_DEFAULT_HEIGHT: 280,
  DEBOUNCE_MS: 16, // ~60fps
  THROTTLE_MS: 100,
} as const

// Media
export const MEDIA_CONSTANTS = {
  DEFAULT_CLIP_DURATION: 5,
  MAX_CLIP_DURATION: 300, // 5 minutes
  SUPPORTED_VIDEO_FORMATS: ["video/mp4", "video/webm", "video/quicktime"],
  SUPPORTED_IMAGE_FORMATS: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  SUPPORTED_AUDIO_FORMATS: ["audio/mpeg", "audio/wav", "audio/ogg"],
  THUMBNAIL_WIDTH: 160,
  THUMBNAIL_HEIGHT: 90,
} as const

// Colors (semantic)
export const EDITOR_COLORS = {
  track: {
    video: "bg-indigo-500/20",
    audio: "bg-emerald-500/20",
    effect: "bg-purple-500/20",
  },
  clip: {
    video: "bg-indigo-600",
    image: "bg-blue-600",
    audio: "bg-emerald-600",
    effect: "bg-purple-600",
  },
  selection: "ring-2 ring-white",
  playhead: "bg-red-500",
  snapLine: "bg-yellow-400",
} as const

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  play: " ", // Space
  undo: "z",
  redo: "y",
  delete: ["Delete", "Backspace"],
  selectAll: "a",
  copy: "c",
  paste: "v",
  cut: "x",
  split: "s",
  export: "e",
  save: "s",
} as const

// Transitions
export const TRANSITION_TYPES = [
  { type: "none", label: "None", duration: 0 },
  { type: "cross-dissolve", label: "Cross Dissolve", duration: 1 },
  { type: "fade-black", label: "Dip to Black", duration: 1 },
  { type: "fade-white", label: "Dip to White", duration: 1 },
  { type: "wipe-left", label: "Wipe Left", duration: 1 },
  { type: "wipe-right", label: "Wipe Right", duration: 1 },
] as const

// Video models
export const VIDEO_MODELS = [
  { id: "fal-ai/minimax-video", name: "Minimax", description: "Fast generation" },
  { id: "fal-ai/hunyuan-video", name: "Hunyuan", description: "Best quality" },
  { id: "fal-ai/veo-2", name: "Veo 2", description: "Google's latest" },
] as const

// Aspect ratios
export const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 (Landscape)", width: 1920, height: 1080 },
  { value: "9:16", label: "9:16 (Portrait)", width: 1080, height: 1920 },
  { value: "1:1", label: "1:1 (Square)", width: 1080, height: 1080 },
  { value: "4:3", label: "4:3 (Standard)", width: 1440, height: 1080 },
  { value: "21:9", label: "21:9 (Cinematic)", width: 2560, height: 1080 },
] as const

// Initial tracks configuration
export const INITIAL_TRACKS = [
  { id: "v1", name: "Video 1", type: "video" as const, volume: 1 },
  { id: "v2", name: "Video 2", type: "video" as const, volume: 1 },
  { id: "a1", name: "Audio 1", type: "audio" as const, volume: 1 },
  { id: "a2", name: "Audio 2", type: "audio" as const, volume: 1 },
] as const

// Autosave configuration
export const AUTOSAVE_CONSTANTS = {
  DEBOUNCE_MS: 5000, // 5 seconds
  STORAGE_KEY: "seq_autosave",
  MAX_SIZE_MB: 50,
} as const

// FFmpeg configuration
export const FFMPEG_CONSTANTS = {
  PRELOAD_DELAY_MS: 2000, // Delay before preloading FFmpeg
  AUDIO_SAMPLE_RATE: 44100,
  JPEG_QUALITY: 0.9,
  PREVIEW_JPEG_QUALITY: 0.85,
  PREVIEW_CRF: 28,
  EXPORT_CRF: 23,
} as const
