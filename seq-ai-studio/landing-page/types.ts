export interface MediaItem {
  id: string;
  url: string;
  prompt: string;
  duration: number;
  aspectRatio: string;
  thumbnailUrl?: string;
  status: 'generating' | 'ready' | 'error';
  type: 'video' | 'audio' | 'image';
}

export type TransitionType = 'none' | 'cross-dissolve' | 'fade-black' | 'fade-white' | 'wipe-left' | 'wipe-right';

export interface TimelineClip {
  id: string; // Unique instance ID on timeline
  mediaId: string; // Reference to source media
  trackId: string;
  start: number; // Start time on timeline (seconds)
  duration: number; // Duration of clip (seconds)
  offset: number; // Start time within the source media (seconds)
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
