export interface MediaItem {
  id: string;
  url: string;
  prompt: string;
  duration: number;
  aspectRatio: string;
  thumbnailUrl?: string;
  status: 'generating' | 'ready' | 'error' | 'complete';
  type: 'video' | 'audio' | 'image';
  resolution?: { width: number; height: number };
}

export type TransitionType = 'none' | 'cross-dissolve' | 'fade-black' | 'fade-white' | 'wipe-left' | 'wipe-right';

export interface TimelineClip {
  speed: number;
  id: string; // Unique instance ID on timeline
  mediaId: string; // Reference to source media
  trackId: string;
  start: number; // Start time on timeline (seconds)
  duration: number; // Duration of clip (seconds)
  offset: number; // Start time within the source media (seconds)
  volume?: number; // 0 to 1, defaults to 1
  transition?: {
    type: TransitionType;
    duration: number; // Duration of the transition in seconds
  };
  isAudioDetached?: boolean; // If true, audio waveform is hidden and player is muted for this clip
}

export interface Track {
  id: string;
  name: string;
  type: 'video' | 'audio';
  volume?: number; // 0 to 1
  isMuted?: boolean;
  isLocked?: boolean;
}

export interface StoryboardPanel {
  id: string;
  type: 'scene' | 'transition';
  prompt: string;
  imageUrl?: string; // Main image or Start frame
  linkedImageUrl?: string; // End frame for transitions
  videoUrl?: string;
  mediaId?: string; // If added to library/timeline, link to it
  status: 'idle' | 'generating-image' | 'generating-video' | 'enhancing' | 'error';
  error?: string;
  duration: 5 | 8 | 4 | 3 | 2 | 6; // in seconds
}

export interface VideoConfig {
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9';
  useFastModel: boolean;
}

export interface AppState {
  media: MediaItem[];
  timelineClips: TimelineClip[];
  tracks: Track[];
  currentTime: number; // Global playhead position in seconds
  duration: number; // Total timeline duration
  isPlaying: boolean;
  zoomLevel: number; // Pixels per second
  selectedClipId: string | null; // ID of selected TimelineClip or MediaItem
  selectionType: 'library' | 'timeline' | null;
}
