"use client"

import { useState, useCallback, useRef } from "react"
import type { TimelineClip } from "../types"

const SNAP_THRESHOLD_PX = 15

export interface SnapConfig {
  enabled: boolean
  toGrid: boolean
  toClips: boolean
  toPlayhead: boolean
  gridInterval: number
}

interface UseTimelineSnapOptions {
  clips: TimelineClip[]
  currentTime: number
  zoomLevel: number
  isDraggingPlayhead?: boolean
}

export function useTimelineSnap({ clips, currentTime, zoomLevel, isDraggingPlayhead = false }: UseTimelineSnapOptions) {
  const [snapConfig, setSnapConfig] = useState<SnapConfig>({
    enabled: true,
    toGrid: true,
    toClips: true,
    toPlayhead: true,
    gridInterval: 0.5,
  })
  const [showSnapMenu, setShowSnapMenu] = useState(false)

  // Refs for callbacks
  const clipsRef = useRef(clips)
  clipsRef.current = clips
  const currentTimeRef = useRef(currentTime)
  currentTimeRef.current = currentTime
  const zoomLevelRef = useRef(zoomLevel)
  zoomLevelRef.current = zoomLevel
  const snapConfigRef = useRef(snapConfig)
  snapConfigRef.current = snapConfig

  const getSnapTime = useCallback(
    (time: number, ignoreClipIds: string[] = []): number | null => {
      const config = snapConfigRef.current
      if (!config.enabled) return null

      const snapPoints: number[] = []

      if (config.toGrid) {
        const interval = config.gridInterval
        const nearestGrid = Math.round(time / interval) * interval
        snapPoints.push(nearestGrid)
      }
      if (config.toPlayhead && !isDraggingPlayhead) {
        snapPoints.push(currentTimeRef.current)
      }
      if (config.toClips) {
        clipsRef.current.forEach((c) => {
          if (ignoreClipIds.includes(c.id)) return
          snapPoints.push(c.start)
          snapPoints.push(c.start + c.duration)
        })
      }
      snapPoints.push(0)

      let closest = -1
      let minDistance = Number.POSITIVE_INFINITY

      snapPoints.forEach((p) => {
        const dist = Math.abs(p - time)
        if (dist < minDistance) {
          minDistance = dist
          closest = p
        }
      })

      const thresholdSeconds = SNAP_THRESHOLD_PX / zoomLevelRef.current
      if (minDistance <= thresholdSeconds) {
        return closest
      }
      return null
    },
    [isDraggingPlayhead],
  )

  const toggleSnapEnabled = useCallback(() => {
    setSnapConfig((prev) => ({ ...prev, enabled: !prev.enabled }))
  }, [])

  const toggleSnapOption = useCallback((key: keyof SnapConfig) => {
    setSnapConfig((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const setGridInterval = useCallback((interval: number) => {
    setSnapConfig((prev) => ({ ...prev, gridInterval: interval }))
  }, [])

  return {
    snapConfig,
    showSnapMenu,
    setShowSnapMenu,
    getSnapTime,
    toggleSnapEnabled,
    toggleSnapOption,
    setGridInterval,
  }
}
