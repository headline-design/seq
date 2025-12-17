# Seq Video Editor

A professional, browser-based non-linear video editor (NLE) built with React and Next.js. Features AI-powered video generation, multi-track timeline editing, and FFmpeg-based export.

## Architecture Overview

```
editor/
├── components/          # React components
│   ├── automator/       # AI generation components
│   ├── storyboard/      # Storyboard panel components
│   ├── editor.tsx       # Main editor component
│   ├── timeline.tsx     # Timeline component
│   └── ...
├── hooks/               # Custom React hooks
│   ├── use-ffmpeg.ts    # FFmpeg loading & export
│   ├── use-playback.ts  # Playback state & sync
│   ├── use-timeline-*.ts # Timeline-specific hooks
│   └── ...
├── context/             # React context providers
├── utils/               # Utility functions
├── constants.ts         # Shared constants
└── types.ts             # TypeScript types
```

## Core Components

### Editor (`editor.tsx`)
The main container component that orchestrates all editor functionality.
- Manages global state via custom hooks
- Handles keyboard shortcuts
- Coordinates playback, timeline, and export

### Timeline (`timeline.tsx`)
Multi-track timeline with professional features:
- Drag-and-drop clip placement
- Clip trimming with handles
- Magnetic snapping
- Marquee selection
- Zoom and scroll

### Preview Player (`preview-player.tsx`)
Video preview with dual-video transition support:
- Real-time playback
- Transition effects (crossfade, wipe, etc.)
- Canvas-based frame composition

### Storyboard Panel (`storyboard-panel.tsx`)
AI-powered storyboard generation:
- Text-to-image generation
- Image-to-video conversion
- Panel management

## Custom Hooks

### `usePlayback`
Manages playback state and media synchronization.
```typescript
const { isPlaying, currentTime, setIsPlaying, seekTo } = usePlayback(...)
```

### `useFFmpeg`
Handles FFmpeg WASM loading and video export.
```typescript
const { isExporting, exportProgress, startExport } = useFFmpeg()
```

### `useTimelineState`
Manages timeline clips, tracks, and history (undo/redo).
```typescript
const { clips, tracks, addClip, deleteClip, undo, redo } = useTimelineState(...)
```

### `useTimelineDrag`
Handles clip dragging with constraints and snapping.
```typescript
const { onDragStart, onDrag, onDragEnd } = useTimelineDrag(...)
```

### `useTimelineSnap`
Calculates snap points for magnetic snapping.
```typescript
const { snapEnabled, getSnapPoint, snapPoints } = useTimelineSnap(...)
```

### `useTimelineSelection`
Manages clip selection including marquee selection.
```typescript
const { selectedClipIds, onSelectionStart, selectionRect } = useTimelineSelection(...)
```

### `useTimelineKeyboard`
Keyboard navigation and shortcuts for timeline.
```typescript
useTimelineKeyboard({ clips, selectedClipIds, onDelete, onDuplicate, ... })
```

### `useVirtualizedClips`
Performance optimization for large timelines.
```typescript
const { visibleClips } = useVirtualizedClips(clips, scrollLeft, viewportWidth, zoom)
```

## State Management

State is managed through a combination of:
1. **Custom hooks** - Encapsulate related state and logic
2. **React.memo** - Prevent unnecessary re-renders
3. **useCallback/useMemo** - Memoize handlers and computed values
4. **Context (optional)** - For deep prop drilling scenarios

### History (Undo/Redo)
The timeline maintains a history stack for undo/redo:
```typescript
const { undo, redo, canUndo, canRedo, pushHistory } = useTimelineState(...)
```

## Performance Optimizations

### Memoization
All major components are wrapped in `React.memo`:
- `TimelineClipItem`
- `TimelineToolbar`
- `TimelineTrackHeaders`
- `InspectorPanel`
- `ProjectLibrary`
- etc.

### Virtualization
The timeline uses viewport-based rendering:
- Only clips visible in viewport are rendered
- 200px buffer for smooth scrolling
- Computed via `useVirtualizedClips`

### RAF Throttling
Mouse/scroll handlers use requestAnimationFrame:
- Resize handlers
- Scroll position tracking
- Drag operations

### Lazy Loading
Media thumbnails use Intersection Observer:
- Images load when entering viewport
- Video previews only play on hover

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Space | Play/Pause |
| ← / → | Move playhead 1 frame |
| Shift + ← / → | Move playhead 1 second |
| Delete / Backspace | Delete selected clips |
| Cmd/Ctrl + D | Duplicate selected clip |
| Cmd/Ctrl + A | Select all clips |
| Cmd/Ctrl + Z | Undo |
| Cmd/Ctrl + Shift + Z | Redo |
| Home | Go to start |
| End | Go to end |
| S | Split clip at playhead |

## Export Pipeline

1. **Audio Rendering** - Offline audio context mixes all tracks
2. **Video Rendering** - Canvas-based frame composition
3. **FFmpeg Encoding** - WebAssembly FFmpeg for final encode
4. **Download** - Generated MP4 blob URL

```typescript
startExport("1080p", "all") // Full timeline at 1080p
startExport("720p", "selection") // Selection only at 720p
```

## Types

### `TimelineClip`
```typescript
interface TimelineClip {
  id: string           // Unique instance ID
  mediaId: string      // Reference to source media
  trackId: string      // Track placement
  start: number        // Start time (seconds)
  duration: number     // Clip duration (seconds)
  offset: number       // Offset into source media
  volume?: number      // 0-1
  transition?: { type: TransitionType; duration: number }
}
```

### `Track`
```typescript
interface Track {
  id: string
  name: string
  type: 'video' | 'audio'
  volume?: number
  isMuted?: boolean
  isLocked?: boolean
}
```

### `MediaItem`
```typescript
interface MediaItem {
  id: string
  url: string
  prompt: string
  duration: number
  aspectRatio: string
  type: 'video' | 'audio' | 'image'
  status: 'generating' | 'ready' | 'error' | 'complete'
}
```

## Accessibility

- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management
- Screen reader descriptions
- High contrast focus indicators

## Error Handling

The editor uses an `ErrorBoundary` component:
```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <Editor />
</ErrorBoundary>
```

## Development

### Adding a new hook
1. Create file in `hooks/` directory
2. Export from `hooks/index.ts`
3. Follow existing patterns for memoization

### Adding a new component
1. Create file in `components/` directory
2. Wrap in `React.memo` if props-based
3. Add `displayName` for dev tools
4. Use `useCallback` for handlers passed to children

### Constants
Shared values are in `constants.ts`:
- Timeline defaults (zoom, track heights)
- Export settings (fps, bitrates)
- UI dimensions
- Keyboard shortcuts
