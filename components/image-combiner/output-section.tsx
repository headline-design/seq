"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ProgressBar } from "./progress-bar"
import { useMobile } from "@/hooks/use-mobile"
import { useEffect } from "react"
import { Generation } from "./types"

interface OutputSectionProps {
  selectedGeneration: Generation | undefined
  generations: Generation[]
  selectedGenerationId: string | null
  setSelectedGenerationId: (id: string) => void
  isConvertingHeic: boolean
  heicProgress: number
  imageLoaded: boolean
  setImageLoaded: (loaded: boolean) => void
  onCancelGeneration: (id: string) => void
  onDeleteGeneration: (id: string) => void
  onOpenFullscreen: () => void
  onLoadAsInput: () => void
  onCopy: () => void
  onDownload: () => void
  onOpenInNewTab: () => void
  onAddToStoryboard: (url: string, prompt: string) => void
}

export function OutputSection({
  selectedGeneration,
  generations,
  selectedGenerationId,
  setSelectedGenerationId,
  isConvertingHeic,
  heicProgress,
  imageLoaded,
  setImageLoaded,
  onCancelGeneration,
  onDeleteGeneration,
  onOpenFullscreen,
  onLoadAsInput,
  onCopy,
  onDownload,
  onOpenInNewTab,
  onAddToStoryboard,
}: OutputSectionProps) {
  const isMobile = useMobile()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isTyping = activeElement?.tagName === "TEXTAREA" || activeElement?.tagName === "INPUT"

      if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && !isTyping) {
        if (generations.length <= 1) return

        e.preventDefault()
        const currentIndex = generations.findIndex((g) => g.id === selectedGenerationId)
        if (currentIndex === -1 && generations.length > 0) {
          setSelectedGenerationId(generations[0].id)
          return
        }

        let newIndex
        if (e.key === "ArrowLeft") {
          newIndex = currentIndex - 1
        } else {
          newIndex = currentIndex + 1
        }

        if (newIndex >= 0 && newIndex < generations.length) {
          setSelectedGenerationId(generations[newIndex].id)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [generations, selectedGenerationId, setSelectedGenerationId])

  const generatedImage =
    selectedGeneration?.status === "complete" && selectedGeneration.imageUrl
      ? { url: selectedGeneration.imageUrl, prompt: selectedGeneration.prompt }
      : null

  const renderButtons = (className?: string) => (
    <div className={className}>
      <Button
        onClick={onLoadAsInput}
        disabled={!generatedImage}
        variant="outline"
        size="sm"
        className="text-xs h-7 px-2 md:px-3 bg-transparent border-gray-600 text-white hover:bg-gray-700 flex items-center gap-1 lg:bg-black/80 lg:backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
        title="Use as Input"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="hidden sm:inline">Use as Input</span>
      </Button>
      <Button
        onClick={() => generatedImage && onAddToStoryboard(generatedImage.url, generatedImage.prompt)}
        disabled={!generatedImage}
        variant="outline"
        size="sm"
        className="text-xs h-7 px-2 md:px-3 bg-transparent border-gray-600 text-white hover:bg-indigo-600/80 hover:text-white hover:border-indigo-500/50 flex items-center gap-1 lg:bg-black/80 lg:backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
        title="Add to Storyboard"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" strokeWidth="2"></rect>
          <line x1="7" y1="2" x2="7" y2="22" strokeWidth="2"></line>
          <line x1="17" y1="2" x2="17" y2="22" strokeWidth="2"></line>
          <line x1="2" y1="12" x2="22" y2="12" strokeWidth="2"></line>
          <line x1="2" y1="7" x2="7" y2="7" strokeWidth="2"></line>
          <line x1="2" y1="17" x2="7" y2="17" strokeWidth="2"></line>
          <line x1="17" y1="17" x2="22" y2="17" strokeWidth="2"></line>
          <line x1="17" y1="7" x2="22" y2="7" strokeWidth="2"></line>
        </svg>
        <span className="hidden sm:inline">Storyboard</span>
      </Button>
      <Button
        onClick={onCopy}
        disabled={!generatedImage}
        variant="outline"
        size="sm"
        className="text-xs h-7 px-2 md:px-3 bg-transparent border-gray-600 text-white hover:bg-gray-700 flex items-center gap-1 lg:bg-black/80 lg:backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
        title={isMobile ? "Copy to clipboard" : "Copy to clipboard"}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeWidth="2" />
        </svg>
        <span className="hidden sm:inline">{isMobile ? "Copy" : "Copy"}</span>
      </Button>
      <Button
        onClick={onDownload}
        disabled={!generatedImage}
        variant="outline"
        size="sm"
        className="text-xs h-7 px-2 md:px-3 bg-transparent border-gray-600 text-white hover:bg-gray-700 flex items-center gap-1 lg:bg-black/80 lg:backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
        title="Download image"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <span className="hidden sm:inline">Download</span>
      </Button>
    </div>
  )

  return (
    <div className="flex flex-col h-full min-h-0 select-none relative group/output">
      <div className="relative flex-1 min-h-0 flex flex-col">
        {selectedGeneration?.status === "loading" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <ProgressBar
              progress={selectedGeneration.progress}
              onCancel={() => onCancelGeneration(selectedGeneration.id)}
            />
          </div>
        ) : isConvertingHeic ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <ProgressBar progress={heicProgress} onCancel={() => {}} isConverting />
          </div>
        ) : generatedImage ? (
          <div className="absolute inset-0 flex flex-col select-none">
            <div className="flex-1 flex items-center justify-center relative group max-w-full max-h-full overflow-hidden">
              <img
                src={generatedImage.url || "/placeholder.svg"}
                alt="Generated"
                className={cn(
                  "max-w-full max-h-full transition-all duration-700 ease-out cursor-pointer",
                  "lg:w-full lg:h-full lg:object-contain",
                  imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95",
                )}
                onLoad={() => setImageLoaded(true)}
                onClick={onOpenFullscreen}
              />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-center py-6 select-none bg-black/20">
            <div>
              <div className="w-8 h-8 md:w-16 md:h-16 mx-auto mb-3 border border-gray-600 flex items-center justify-center bg-black/50">
                <svg
                  className="w-4 h-4 md:w-8 md:h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21,15 16,10 5,21" />
                </svg>
              </div>
              <p className="text-xs text-gray-400 font-medium py-1 md:py-2">Ready to generate</p>
            </div>
          </div>
        )}

        {/* Desktop Controls Container - Always visible if there are generations */}
        {generations.length > 0 && (
          <div className="hidden lg:flex flex-col items-center w-full absolute bottom-6 z-30 pointer-events-none gap-2">
            {/* Buttons - pointer-events-auto to allow clicking */}
            <div className="pointer-events-auto">
              {renderButtons("flex justify-center gap-2 transition-all duration-200")}
            </div>
          </div>
        )}
      </div>

      {/* Mobile/Tablet buttons - below the image container */}
      {generations.length > 0 && renderButtons("mt-3 md:mt-4 flex lg:hidden justify-center gap-2 flex-shrink-0")}
    </div>
  )
}
