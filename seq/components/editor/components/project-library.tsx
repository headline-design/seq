"use client"

import type React from "react"
import { useRef, useState, memo, useCallback } from "react"
import type { MediaItem } from "../types"
import { PanelLeftClose, TrashIcon } from "./icons"
import { MediaThumbnail } from "./media-thumbnail"

interface ProjectLibraryProps {
  media: MediaItem[]
  onSelect: (item: MediaItem) => void
  selectedId: string | null
  onAddToTimeline: (item: MediaItem) => void
  onImport: (file: File) => void
  onRemove: (item: MediaItem) => void
  onClose: () => void
}

interface LibraryItemProps {
  item: MediaItem
  isSelected: boolean
  onSelect: () => void
  onAddToTimeline: (e: React.MouseEvent) => void
  onRemove: (e: React.MouseEvent) => void
  thumbnailSize: number
}

const LibraryItem = memo(function LibraryItem({
  item,
  isSelected,
  onSelect,
  onAddToTimeline,
  onRemove,
  thumbnailSize,
}: LibraryItemProps) {
  const height = Math.round(thumbnailSize * (9 / 16))

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onRemove(e)
    },
    [onRemove],
  )

  const handleAddToTimeline = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onAddToTimeline(e)
    },
    [onAddToTimeline],
  )

  return (
    <div
      className={`flex gap-3 p-2 rounded-lg group transition-all border relative cursor-pointer select-none ${
        isSelected
          ? "bg-[var(--surface-2)] border-neutral-700 ring-1 ring-inset ring-neutral-700"
          : "bg-transparent border-transparent hover:bg-[var(--surface-2)] hover:border-[var(--border-default)]"
      }`}
      onClick={onSelect}
    >
      <MediaThumbnail
        item={item}
        width={thumbnailSize}
        height={height}
        playOnHover
        lazy
        className="shrink-0 shadow-sm"
      />

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <p
          className={`text-[11px] font-medium leading-tight truncate ${
            isSelected ? "text-white" : "text-neutral-400 group-hover:text-neutral-200"
          }`}
        >
          {item.prompt || (item.type === "audio" ? "Audio Track" : "Untitled Media")}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-neutral-600">{item.duration.toFixed(1)}s</span>
            <span className="text-[9px] text-neutral-600 border border-[var(--border-default)] px-1 rounded bg-neutral-900 uppercase">
              {item.type}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="p-1.5 hover:bg-red-900/30 rounded text-neutral-600 hover:text-red-400 transition-all transform hover:scale-110"
              title="Remove from Library"
              onClick={handleRemove}
            >
              <TrashIcon className="w-3 h-3" />
            </button>
            <button
              className="p-1.5 bg-neutral-800 hover:bg-[var(--accent-primary)] hover:text-accent-text-white rounded text-neutral-500 transition-all transform hover:scale-110"
              title="Add to Timeline"
              onClick={handleAddToTimeline}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

export const ProjectLibrary = memo(function ProjectLibrary({
  media,
  onSelect,
  selectedId,
  onAddToTimeline,
  onImport,
  onRemove,
  onClose,
}: ProjectLibraryProps) {
  const [thumbnailSize, setThumbnailSize] = useState(80)
  const [filter, setFilter] = useState<"all" | "video" | "image" | "audio">("all")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const filteredMedia = media.filter((item) => filter === "all" || item.type === filter)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) onImport(file)
    },
    [onImport],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onImport(file)
    },
    [onImport],
  )

  return (
    <div
      className={`flex flex-col h-full relative ${isDragOver ? "ring-2 ring-[var(--accent-primary)] ring-inset" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="p-3 border-b border-[var(--border-default)] flex items-center justify-between shrink-0">
        <span className="text-sm font-medium text-white">Project Media</span>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-[var(--hover-overlay)] rounded-lg text-neutral-500 hover:text-white transition-colors"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-1.5 px-3 py-2.5 border-b border-[var(--border-default)] shrink-0">
        {(["all", "video", "image", "audio"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-[11px] rounded-full font-medium transition-all ${
              filter === f ? "bg-white text-black" : "text-neutral-500 hover:text-white hover:bg-[var(--hover-overlay)]"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {filteredMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500 text-xs gap-3 p-4">
            <p className="text-neutral-400">No media yet</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-[var(--hover-overlay)] hover:bg-[var(--active-overlay)] rounded-lg text-neutral-300 hover:text-accent-text-white transition-colors font-medium"
            >
              Import Media
            </button>
          </div>
        ) : (
          filteredMedia.map((item) => (
            <LibraryItem
              key={item.id}
              item={item}
              isSelected={selectedId === item.id}
              onSelect={() => onSelect(item)}
              onAddToTimeline={(e) => {
                e.stopPropagation()
                onAddToTimeline(item)
              }}
              onRemove={(e) => {
                e.stopPropagation()
                onRemove(item)
              }}
              thumbnailSize={thumbnailSize}
            />
          ))
        )}
      </div>

      <div className="p-2.5 border-t border-[var(--border-default)] flex items-center justify-between shrink-0">
        <input type="file" ref={fileInputRef} accept="video/*,audio/*,image/*" onChange={handleFileChange} hidden />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-[11px] text-neutral-400 hover:text-white px-3 py-1.5 bg-[var(--hover-overlay)] hover:bg-[var(--active-overlay)] rounded-lg transition-colors font-medium"
        >
          + Import
        </button>
        <input
          type="range"
          min="60"
          max="120"
          value={thumbnailSize}
          onChange={(e) => setThumbnailSize(Number.parseInt(e.target.value))}
          className="w-20 h-1 bg-neutral-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent-primary)] [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      {isDragOver && (
        <div className="absolute inset-0 bg-[var(--accent-primary)]/20 flex items-center justify-center pointer-events-none z-50 backdrop-blur-sm">
          <p className="text-white font-medium">Drop to import</p>
        </div>
      )}
    </div>
  )
})
