"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2 } from "lucide-react"
import { ImageUploadBox } from "./image-upload-box"
import { cn } from "@/lib/utils"

const btnClassName = "w-full h-10 md:h-12 text-sm md:base font-semibold bg-white text-black hover:bg-gray-200"

interface InputSectionProps {
  prompt: string
  setPrompt: (prompt: string) => void
  aspectRatio: string
  setAspectRatio: (ratio: string) => void
  availableAspectRatios: Array<{ value: string; label: string; icon: React.ReactNode }>
  useUrls: boolean
  setUseUrls: (use: boolean) => void
  image1Preview: string | null
  image2Preview: string | null
  image1Url: string
  image2Url: string
  isConvertingHeic: boolean
  canGenerate: boolean
  hasImages: boolean
  onGenerate: () => void
  onClearAll: () => void
  onImageUpload: (file: File, slot: 1 | 2) => Promise<void>
  onUrlChange: (url: string, slot: 1 | 2) => void
  onClearImage: (slot: 1 | 2) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onPromptPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void
  onImageFullscreen: (url: string) => void
  promptTextareaRef: React.RefObject<HTMLTextAreaElement>
  isAuthenticated: boolean
  remaining: number
  decrementOptimistic: () => void
  usageLoading: boolean
  onShowAuthModal: () => void
  generations: any[]
  selectedGenerationId: string | null
  onSelectGeneration: (id: string) => void
  onCancelGeneration: (id: string) => void
  onDeleteGeneration: (id: string) => Promise<void>
  historyLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
  isLoadingMore: boolean
}

export function InputSection({
  prompt,
  setPrompt,
  aspectRatio,
  setAspectRatio,
  availableAspectRatios,
  useUrls,
  setUseUrls,
  image1Preview,
  image2Preview,
  image1Url,
  image2Url,
  isConvertingHeic,
  canGenerate,
  hasImages,
  onGenerate,
  onClearAll,
  onImageUpload,
  onUrlChange,
  onClearImage,
  onKeyDown,
  onPromptPaste,
  onImageFullscreen,
  promptTextareaRef,
}: InputSectionProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="space-y-3 md:space-y-4 min-h-0 flex flex-col">
        <div className="space-y-3 md:space-y-4 flex flex-col">
          <div className="flex items-center justify-between mb-3 md:mb-6 select-none">
            <div className="flex flex-col gap-1">
              <label className="text-sm md:text-base font-medium text-gray-300">Prompt</label>
            </div>
            <div className="flex items-center gap-2">
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger className="w-24 sm:w-28 md:w-32 !h-7 md:!h-10 px-3 !py-0 bg-black/50 border border-gray-600 text-white text-xs md:text-sm focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:ring-0 data-[state=open]:ring-offset-0">
                  <SelectValue placeholder="1:1" />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-gray-600 text-white">
                  {availableAspectRatios.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-xs md:text-sm">
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={onClearAll}
                disabled={!prompt.trim() && !hasImages}
                variant="outline"
                className="h-7 md:h-10 px-3 py-0 text-xs md:text-sm bg-transparent border border-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
              >
                <Trash2 className="size-4 md:hidden" />
                <span className="hidden md:inline">Clear</span>
              </Button>
            </div>
          </div>
          <textarea
            ref={promptTextareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPromptPaste}
            placeholder=""
            autoFocus
            className="w-full flex-1 min-h-[100px] max-h-[140px] lg:min-h-[12vh] lg:max-h-[18vh] xl:min-h-[14vh] xl:max-h-[20vh] p-2 md:p-4 bg-black/50 border-2 border-gray-600 resize-none focus:outline-none focus:border-white text-white text-xs md:text-base select-text"
            style={{
              fontSize: "16px",
              WebkitUserSelect: "text",
              userSelect: "text",
            }}
          />
        </div>

        <div className="space-y-2 md:space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2 md:mb-3 select-none">
              <div className="flex flex-col gap-1">
                <label className="text-sm md:text-base font-medium text-gray-300">Images (optional)</label>
              </div>
              <div className="inline-flex bg-black/50 border border-gray-600">
                <button
                  onClick={() => setUseUrls(false)}
                  className={cn(
                    "px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm font-medium transition-all",
                    !useUrls ? "bg-white text-black" : "text-gray-300 hover:text-white",
                  )}
                >
                  Files
                </button>
                <button
                  onClick={() => setUseUrls(true)}
                  className={cn(
                    "px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm font-medium transition-all",
                    useUrls ? "bg-white text-black" : "text-gray-300 hover:text-white",
                  )}
                >
                  URLs
                </button>
              </div>
            </div>

            {useUrls ? (
              <div className="space-y-2 lg:min-h-[12vh] xl:min-h-[14vh]">
                <div className="relative">
                  <input
                    type="url"
                    value={image1Url}
                    onChange={(e) => onUrlChange(e.target.value, 1)}
                    placeholder="First image URL"
                    className="w-full p-2 md:p-3 pr-8 bg-black/50 border border-gray-600 text-white text-xs focus:outline-none focus:ring-2 focus:ring-white select-text"
                  />
                  {image1Url && (
                    <button
                      onClick={() => onClearImage(1)}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="url"
                    value={image2Url}
                    onChange={(e) => onUrlChange(e.target.value, 2)}
                    placeholder="Second image URL"
                    className="w-full p-2 md:p-3 pr-8 bg-black/50 border border-gray-600 text-white text-xs focus:outline-none focus:ring-2 focus:ring-white select-text"
                  />
                  {image2Url && (
                    <button
                      onClick={() => onClearImage(2)}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="select-none lg:min-h-[12vh] xl:min-h-[14vh]">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                  <ImageUploadBox
                    imageNumber={1}
                    preview={image1Preview}
                    onDrop={(e) => {
                      e.preventDefault()
                      const file = e.dataTransfer.files[0]
                      if (file && file.type.startsWith("image/")) {
                        onImageUpload(file, 1)
                      }
                    }}
                    onClear={() => onClearImage(1)}
                    onSelect={() => {
                      if (image1Preview) {
                        onImageFullscreen(image1Preview)
                      } else {
                        document.getElementById("file1")?.click()
                      }
                    }}
                  />
                  <input
                    id="file1"
                    type="file"
                    accept="image/*,.heic,.heif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        onImageUpload(file, 1)
                        e.target.value = ""
                      }
                    }}
                  />

                  <ImageUploadBox
                    imageNumber={2}
                    preview={image2Preview}
                    onDrop={(e) => {
                      e.preventDefault()
                      const file = e.dataTransfer.files[0]
                      if (file && file.type.startsWith("image/")) {
                        onImageUpload(file, 2)
                      }
                    }}
                    onClear={() => onClearImage(2)}
                    onSelect={() => {
                      if (image2Preview) {
                        onImageFullscreen(image2Preview)
                      } else {
                        document.getElementById("file2")?.click()
                      }
                    }}
                  />
                  <input
                    id="file2"
                    type="file"
                    accept="image/*,.heic,.heif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        onImageUpload(file, 2)
                        e.target.value = ""
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-0">
          <Button onClick={onGenerate} disabled={!canGenerate || isConvertingHeic} className={btnClassName}>
            {isConvertingHeic ? "Converting HEIC..." : "Run"}
          </Button>
        </div>
      </div>
    </div>
  )
}
