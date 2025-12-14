"use client"

import { memo, useEffect, useState } from "react"
import { generateWaveform, generateFakeWaveform, type WaveformData } from "../utils/waveform-generator"

interface ClipWaveformProps {
  mediaUrl?: string
  duration: number
  offset: number
  isAudio: boolean
  isSelected: boolean
  zoomLevel: number
}

export const ClipWaveform = memo(
  ({ mediaUrl, duration, offset, isAudio, isSelected, zoomLevel }: ClipWaveformProps) => {
    const [waveformData, setWaveformData] = useState<WaveformData | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Calculate number of bars based on clip width
    const clipWidth = duration * zoomLevel
    const numBars = Math.min(200, Math.max(20, Math.floor(clipWidth / 3)))

    useEffect(() => {
      if (!mediaUrl) return

      let cancelled = false
      setIsLoading(true)

      generateWaveform(mediaUrl, numBars).then((data) => {
        if (!cancelled) {
          setWaveformData(data)
          setIsLoading(false)
        }
      })

      return () => {
        cancelled = true
      }
    }, [mediaUrl, numBars])

    // Use real waveform data if available, otherwise generate fake
    const peaks = waveformData?.peaks || generateFakeWaveform(duration, offset, numBars)

    // Calculate which portion of the waveform to display based on offset
    const startIndex = waveformData ? Math.floor((offset / waveformData.duration) * peaks.length) : 0
    const visiblePeaks = waveformData ? peaks.slice(startIndex, startIndex + numBars) : peaks

    return (
      <div
        className={`w-full h-full flex items-end gap-[1px] overflow-hidden pointer-events-none transition-opacity ${isLoading ? "opacity-40" : "opacity-80"}`}
        aria-hidden="true"
      >
        {visiblePeaks.map((peak, i) => {
          const height = 15 + peak * 75
          return (
            <div
              key={i}
              className={`flex-1 rounded-t-[1px] min-w-[2px] transition-colors ${
                isSelected ? "bg-white/80" : isAudio ? "bg-emerald-400/60" : "bg-white/30"
              }`}
              style={{ height: `${height}%` }}
            />
          )
        })}
      </div>
    )
  },
)

ClipWaveform.displayName = "ClipWaveform"
