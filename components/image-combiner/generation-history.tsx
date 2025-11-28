"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import type { Generation } from "./types"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import Image from "next/image"

interface GenerationHistoryProps {
  generations: Generation[]
  selectedId?: string
  onSelect: (id: string) => void
  onCancel: (id: string) => void
  onDelete?: (id: string) => Promise<void>
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  isLoadingMore?: boolean
  className?: string
  compact?: boolean // Added compact prop
}

export function GenerationHistory({
  generations,
  selectedId,
  onSelect,
  onCancel,
  onDelete,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  className,
  compact = false, // Default to false
}: GenerationHistoryProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()

    if (!onDelete) return

    setDeletingId(id)
    try {
      await onDelete(id)
    } catch (error) {
      console.error("Failed to delete generation:", error)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className={cn("flex flex-col w-full", className)}>
      {!compact && <h4 className="text-xs md:text-sm font-medium text-gray-400 mb-1">History</h4>}
      <div
        className={cn(
          "w-full flex gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent h-20 md:h-28 items-end",
          compact ? "pb-1" : "pb-2",
        )}
      >
        {isLoading ? (
          <div className="flex items-center justify-center w-full h-20 md:h-28 text-gray-400">
            <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin" />
          </div>
        ) : generations.length === 0 ? (
          <div className="flex items-center justify-center w-full h-20 md:h-28 text-gray-500 text-xs md:text-sm">
            No generations yet
          </div>
        ) : (
          <>
            {generations.map((gen, index) => (
              <div
                key={gen.id}
                onClick={() => onSelect(gen.id)}
                className={cn(
                  "relative flex-shrink-0 w-18 h-18 md:w-24 md:h-24 overflow-hidden transition-all cursor-pointer group",
                  selectedId === gen.id
                    ? "border-2 border-white opacity-100"
                    : "border border-gray-600 hover:border-gray-500 opacity-60 hover:opacity-100",
                  index === 0 && "animate-in fade-in-0 slide-in-from-left-4 duration-500",
                  deletingId === gen.id && "opacity-50 pointer-events-none",
                )}
                role="button"
                tabIndex={0}
                aria-label={`Generation ${index + 1}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onSelect(gen.id)
                  }
                }}
              >
                {gen.status === "loading" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm md:text-base text-white/90 font-mono font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      {Math.round(gen.progress)}%
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onCancel(gen.id)
                      }}
                      className="mt-2 text-[10px] px-2 py-0.5 bg-white/10 hover:bg-white text-white hover:text-black transition-all"
                      aria-label="Cancel generation"
                    >
                      Cancel
                    </button>
                  </div>
                ) : gen.status === "error" ? (
                  <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="sr-only">Generation failed</span>
                    {onDelete && (
                      <button
                        onClick={(e) => handleDelete(e, gen.id)}
                        disabled={deletingId === gen.id}
                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-white text-white hover:text-black opacity-100 transition-all disabled:opacity-50 z-10"
                        aria-label="Delete generation"
                      >
                        {deletingId === gen.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {onDelete && (
                      <button
                        onClick={(e) => handleDelete(e, gen.id)}
                        disabled={deletingId === gen.id}
                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-white text-white hover:text-black opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50 z-10"
                        aria-label="Delete generation"
                      >
                        {deletingId === gen.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </button>
                    )}
                    <Image
                      src={gen.imageUrl || "/placeholder.svg"}
                      alt={gen.prompt || "Generated image"}
                      fill
                      sizes="(max-width: 768px) 80px, 96px"
                      className={cn(
                        "object-cover transition-opacity duration-300",
                        loadedImages.has(gen.id) ? "opacity-100" : "opacity-0",
                      )}
                      onLoad={() => {
                        setLoadedImages((prev) => new Set(prev).add(gen.id))
                      }}
                      unoptimized={gen.imageUrl?.includes("blob:") ?? false}
                    />
                    {!loadedImages.has(gen.id) && <div className="absolute inset-0 bg-gray-800 animate-pulse" />}
                  </>
                )}
              </div>
            ))}
            {hasMore && onLoadMore && (
              <button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="flex-shrink-0 w-18 h-18 md:w-24 md:h-24 border border-gray-600 hover:border-white bg-black/30 hover:bg-black/50 transition-all flex items-center justify-center text-xs text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Load more generations"
              >
                {isLoadingMore ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="font-medium">
                    Load
                    <br />
                    More
                  </span>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
