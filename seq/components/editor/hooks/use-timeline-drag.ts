"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import type { TimelineClip, Track } from "../types"

type DragMode = "none" | "move" | "trim-start" | "trim-end"

interface DragState {
  mode: DragMode
  clipIds: string[]
  startX: number
  initialStates: Record<string, { start: number; duration: number; offset: number }>
  minStartDelta: number
  maxStartDelta: number
  snapLocked: boolean
  snapPosition: number | null
  snapBreakThreshold: number
}

interface UseTimelineDragOptions {
  clips: TimelineClip[]
  tracks: Track[]
  selectedClipIds: string[]
  zoomLevel: number
  tool: "select" | "razor"
  snapEnabled: boolean
  getSnapTime: (time: number, ignoreClipIds: string[]) => number | null
  onClipUpdate: (clipId: string, changes: Partial<TimelineClip>) => void
  onSelectClips: (clipIds: string[]) => void
  onSplitClip: (clipId: string, splitTime: number) => void
  onDragStart: () => void
  onOverwriteClips: (movedClipIds: string[]) => void
}

export function useTimelineDrag({
  clips,
  tracks,
  selectedClipIds,
  zoomLevel,
  tool,
  snapEnabled,
  getSnapTime,
  onClipUpdate,
  onSelectClips,
  onSplitClip,
  onDragStart,
  onOverwriteClips,
}: UseTimelineDragOptions) {
  const [dragState, setDragState] = useState<DragState>({
    mode: "none",
    clipIds: [],
    startX: 0,
    initialStates: {},
    minStartDelta: Number.NEGATIVE_INFINITY,
    maxStartDelta: Number.POSITIVE_INFINITY,
    snapLocked: false,
    snapPosition: null,
    snapBreakThreshold: 20, // pixels to drag past snap point to break
  })
  const [snapIndicator, setSnapIndicator] = useState<number | null>(null)
  const [lastClickedClipId, setLastClickedClipId] = useState<string | null>(null)

  // Refs for callbacks
  const clipsRef = useRef(clips)
  clipsRef.current = clips
  const zoomLevelRef = useRef(zoomLevel)
  zoomLevelRef.current = zoomLevel
  const dragStateRef = useRef(dragState)
  dragStateRef.current = dragState
  const onClipUpdateRef = useRef(onClipUpdate)
  onClipUpdateRef.current = onClipUpdate
  const getSnapTimeRef = useRef(getSnapTime)
  getSnapTimeRef.current = getSnapTime
  const snapEnabledRef = useRef(snapEnabled)
  snapEnabledRef.current = snapEnabled
  const onOverwriteClipsRef = useRef(onOverwriteClips)
  onOverwriteClipsRef.current = onOverwriteClips

  const handleMouseDownClip = useCallback(
    (e: React.MouseEvent, clip: TimelineClip, mode: DragMode) => {
      e.stopPropagation()
      e.preventDefault()

      if (clip.isLocked) return

      const track = tracks.find((t) => t.id === clip.trackId)
      if (track?.isLocked) return

      // Razor tool splits clip
      if (tool === "razor" && mode === "move") {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const timeOffset = clickX / zoomLevel
        const splitTime = clip.start + timeOffset
        onSplitClip(clip.id, splitTime)
        return
      }

      const isMultiSelect = e.ctrlKey || e.metaKey
      const isRangeSelect = e.shiftKey
      const isAlreadySelected = selectedClipIds.includes(clip.id)

      // Handle range selection
      if (isRangeSelect && lastClickedClipId) {
        const sortedClips = [...clips].sort((a, b) => a.start - b.start)
        const idxA = sortedClips.findIndex((c) => c.id === lastClickedClipId)
        const idxB = sortedClips.findIndex((c) => c.id === clip.id)
        if (idxA !== -1 && idxB !== -1) {
          const start = Math.min(idxA, idxB)
          const end = Math.max(idxA, idxB)
          const rangeIds = sortedClips.slice(start, end + 1).map((c) => c.id)
          const newSelection = Array.from(new Set([...selectedClipIds, ...rangeIds]))
          onSelectClips(newSelection)
        }
      } else if (isMultiSelect) {
        if (isAlreadySelected) {
          onSelectClips(selectedClipIds.filter((id) => id !== clip.id))
        } else {
          onSelectClips([...selectedClipIds, clip.id])
        }
      } else if (!isAlreadySelected) {
        onSelectClips([clip.id])
      }

      setLastClickedClipId(clip.id)

      if (e.button === 2) return // Right click

      onDragStart()

      const activeClipIds =
        isAlreadySelected || !isMultiSelect
          ? selectedClipIds.includes(clip.id)
            ? selectedClipIds
            : [clip.id]
          : [clip.id]

      // Only constraint is clips can't go before 0
      const initialStates: Record<string, { start: number; duration: number; offset: number }> = {}

      activeClipIds.forEach((id) => {
        const c = clips.find((x) => x.id === id)
        if (c) {
          initialStates[id] = { start: c.start, duration: c.duration, offset: c.offset }
        }
      })

      // Calculate min delta so clips don't go before timeline start (0)
      let globalMinStartDelta = Number.NEGATIVE_INFINITY
      activeClipIds.forEach((id) => {
        const state = initialStates[id]
        if (state) {
          const minDelta = -state.start // Can't go below 0
          if (minDelta > globalMinStartDelta) {
            globalMinStartDelta = minDelta
          }
        }
      })

      setDragState({
        mode,
        clipIds: activeClipIds,
        startX: e.clientX,
        initialStates,
        minStartDelta: globalMinStartDelta,
        maxStartDelta: Number.POSITIVE_INFINITY, // No right-side limit - allow overlapping
        snapLocked: false,
        snapPosition: null,
        snapBreakThreshold: 20,
      })
    },
    [clips, tracks, selectedClipIds, zoomLevel, tool, lastClickedClipId, onSelectClips, onSplitClip, onDragStart],
  )

  const handleDragMove = useCallback((e: MouseEvent) => {
    const ds = dragStateRef.current
    const zoom = zoomLevelRef.current

    if (ds.mode === "none" || ds.clipIds.length === 0) return

    const deltaX = e.clientX - ds.startX
    const deltaSeconds = deltaX / zoom
    let snappedTime: number | null = null

    if (ds.mode === "move") {
      let proposedDelta = deltaSeconds
      proposedDelta = Math.max(ds.minStartDelta, proposedDelta)

      const leadClipId = ds.clipIds[0]
      const leadState = ds.initialStates[leadClipId]
      const leadNewStart = leadState.start + proposedDelta

      if (snapEnabledRef.current && !ds.snapLocked) {
        // Try to find a snap point
        const snapLeft = getSnapTimeRef.current(leadNewStart, ds.clipIds)
        if (snapLeft !== null) {
          const snapDelta = snapLeft - leadState.start
          if (snapDelta >= ds.minStartDelta) {
            // Lock to this snap position
            proposedDelta = snapDelta
            snappedTime = snapLeft

            // Update drag state to track snap position
            setDragState((prev) => ({ ...prev, snapPosition: snapLeft }))
          }
        } else {
          const leadNewEnd = leadNewStart + leadState.duration
          const snapRight = getSnapTimeRef.current(leadNewEnd, ds.clipIds)
          if (snapRight !== null) {
            const snapDelta = snapRight - leadState.duration - leadState.start
            if (snapDelta >= ds.minStartDelta) {
              proposedDelta = snapDelta
              snappedTime = snapRight

              // Update drag state to track snap position
              setDragState((prev) => ({ ...prev, snapPosition: snapRight }))
            }
          }
        }
      } else if (ds.snapPosition !== null) {
        const currentPosition = leadState.start + deltaSeconds
        const distanceFromSnap = Math.abs(currentPosition - ds.snapPosition) * zoom

        if (distanceFromSnap > ds.snapBreakThreshold) {
          // Break through the snap - allow overlap
          setDragState((prev) => ({ ...prev, snapLocked: true }))
        } else {
          // Still within threshold, maintain snap
          const snapDelta = ds.snapPosition - leadState.start
          proposedDelta = snapDelta
          snappedTime = ds.snapPosition
        }
      }

      ds.clipIds.forEach((id) => {
        const state = ds.initialStates[id]
        onClipUpdateRef.current(id, { start: Math.max(0, state.start + proposedDelta) })
      })
    } else if (ds.mode === "trim-start") {
      const id = ds.clipIds[0]
      const state = ds.initialStates[id]

      const maxDelta = state.duration - 0.5
      let validDelta = Math.min(deltaSeconds, maxDelta)
      let newStart = state.start + validDelta
      const minAllowedStart = state.start + ds.minStartDelta

      if (newStart < minAllowedStart) {
        newStart = minAllowedStart
        validDelta = newStart - state.start
      }

      if (snapEnabledRef.current) {
        const snap = getSnapTimeRef.current(newStart, [id])
        if (snap !== null) {
          const snapDelta = snap - state.start
          if (snap >= minAllowedStart && state.duration - snapDelta >= 0.5) {
            newStart = snap
            validDelta = snapDelta
            snappedTime = snap
          }
        }
      }
      newStart = Math.max(0, newStart)
      const newDuration = state.duration - validDelta
      const newOffset = state.offset + validDelta
      onClipUpdateRef.current(id, { start: newStart, duration: newDuration, offset: newOffset })
    } else if (ds.mode === "trim-end") {
      const id = ds.clipIds[0]
      const state = ds.initialStates[id]
      let newDuration = state.duration + deltaSeconds
      const maxAllowedDuration = state.duration + ds.maxStartDelta

      if (newDuration > maxAllowedDuration) {
        newDuration = maxAllowedDuration
      }

      if (snapEnabledRef.current) {
        const endPos = state.start + newDuration
        const snap = getSnapTimeRef.current(endPos, [id])
        if (snap !== null) {
          if (snap <= state.start + maxAllowedDuration && snap - state.start >= 0.5) {
            newDuration = snap - state.start
            snappedTime = snap
          }
        }
      }
      if (newDuration >= 0.5) onClipUpdateRef.current(id, { duration: newDuration })
    }

    setSnapIndicator(snappedTime)
  }, [])

  const handleDragEnd = useCallback(() => {
    const ds = dragStateRef.current

    // If we were moving clips, check for overlaps and trigger overwrite
    if (ds.mode === "move" && ds.clipIds.length > 0) {
      onOverwriteClipsRef.current(ds.clipIds)
    }

    setDragState({
      mode: "none",
      clipIds: [],
      startX: 0,
      initialStates: {},
      minStartDelta: 0,
      maxStartDelta: 0,
      // Reset snap state on drag end
      snapLocked: false,
      snapPosition: null,
      snapBreakThreshold: 20,
    })
    setSnapIndicator(null)
    document.body.style.cursor = "default"
  }, [])

  return {
    dragState,
    snapIndicator,
    handleMouseDownClip,
    handleDragMove,
    handleDragEnd,
  }
}
