"use client"

import type { Generation } from "./hooks/use-image-generation"

interface FullscreenViewerProps {
  imageUrl: string
  generations: Generation[]
  onClose: () => void
  onNavigate: (direction: "prev" | "next") => void
}

export function FullscreenViewer({ imageUrl, generations, onClose, onNavigate }: FullscreenViewerProps) {
  const completedGenerations = generations.filter((g) => g.status === "complete" && g.imageUrl)
  const hasMultipleImages = completedGenerations.length > 1

  return (
    <div
      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8 select-none overflow-hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen image view"
    >
      <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/80 hover:bg-black/90 text-white p-2 transition-all duration-200"
          title="Close (ESC)"
          aria-label="Close fullscreen"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {hasMultipleImages && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onNavigate("prev")
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black/90 text-white p-3 transition-all duration-200"
              title="Previous (←)"
              aria-label="Previous image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onNavigate("next")
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black/90 text-white p-3 transition-all duration-200"
              title="Next (→)"
              aria-label="Next image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
        <img
          src={imageUrl || "/placeholder.svg"}
          alt="Fullscreen"
          className="max-w-full max-h-[90vh] object-contain mx-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}
