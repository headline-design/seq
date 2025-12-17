"use client"

import { memo, useCallback, useState } from "react"
import type { Marker } from "../types"
import { FlagIcon } from "./icons"

interface TimelineMarkersProps {
  markers: Marker[]
  zoomLevel: number
  scrollLeft: number
  viewportWidth: number
  onMarkerClick: (marker: Marker) => void
  onMarkerDoubleClick: (marker: Marker) => void
  onMarkerDelete: (markerId: string) => void
  onMarkerUpdate: (markerId: string, changes: Partial<Marker>) => void
}

const MARKER_COLORS: Record<Marker["color"], string> = {
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#a855f7",
  pink: "#ec4899",
}

export const TimelineMarkers = memo(function TimelineMarkers({
  markers,
  zoomLevel,
  scrollLeft,
  viewportWidth,
  onMarkerClick,
  onMarkerDoubleClick,
  onMarkerDelete,
  onMarkerUpdate,
}: TimelineMarkersProps) {
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState("")

  // Filter visible markers
  const visibleMarkers = markers.filter((m) => {
    const x = m.time * zoomLevel
    return x >= scrollLeft - 20 && x <= scrollLeft + viewportWidth + 20
  })

  const handleDoubleClick = useCallback((marker: Marker) => {
    setEditingMarkerId(marker.id)
    setEditLabel(marker.label)
  }, [])

  const handleLabelSubmit = useCallback(
    (markerId: string) => {
      if (editLabel.trim()) {
        onMarkerUpdate(markerId, { label: editLabel.trim() })
      }
      setEditingMarkerId(null)
    },
    [editLabel, onMarkerUpdate],
  )

  return (
    <div className="absolute top-0 left-0 right-0 h-8 pointer-events-none z-40">
      {visibleMarkers.map((marker) => {
        const x = marker.time * zoomLevel - scrollLeft
        const color = MARKER_COLORS[marker.color]
        const isEditing = editingMarkerId === marker.id

        return (
          <div key={marker.id} className="absolute top-0 pointer-events-auto group" style={{ left: `${x}px` }}>
            {/* Marker flag */}
            <button
              onClick={() => onMarkerClick(marker)}
              onDoubleClick={() => handleDoubleClick(marker)}
              onContextMenu={(e) => {
                e.preventDefault()
                onMarkerDelete(marker.id)
              }}
              className="relative flex flex-col items-center cursor-pointer"
              title={`${marker.label || "Marker"} - Click to jump, double-click to edit, right-click to delete`}
            >
              <FlagIcon
                className="w-4 h-4 drop-shadow-md transition-transform group-hover:scale-110"
                style={{ color }}
              />
              {/* Marker line */}
              <div
                className="w-px h-6 opacity-50 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: color }}
              />
            </button>

            {/* Label tooltip/editor */}
            {isEditing ? (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onBlur={() => handleLabelSubmit(marker.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLabelSubmit(marker.id)
                    if (e.key === "Escape") setEditingMarkerId(null)
                  }}
                  autoFocus
                  className="w-32 px-2 py-1 text-xs bg-neutral-900 border border-neutral-600 rounded text-white focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
            ) : marker.label ? (
              <div
                className="absolute top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[10px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ backgroundColor: color, color: "white" }}
              >
                {marker.label}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
})
