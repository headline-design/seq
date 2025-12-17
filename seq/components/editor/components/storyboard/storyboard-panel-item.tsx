"use client"
import { memo, useRef } from "react"
import type { StoryboardPanel as IStoryboardPanel, VideoConfig } from "../../types"
import { TrashIcon, MagicIcon, FilmIcon, Sparkles, CheckIcon, UploadIcon, ZoomInIcon, PlusIcon } from "../icons"

interface StoryboardPanelItemProps {
  panel: IStoryboardPanel
  index: number
  videoConfig: VideoConfig
  prevImage?: string
  nextImage?: string
  onUpdatePanel: (id: string, changes: Partial<IStoryboardPanel>) => void
  onDeletePanel: (id: string) => void
  onGenerateImage: (id: string, prompt: string) => void
  onGenerateVideo: (
    id: string,
    prompt: string,
    image1Base64?: string,
    image2Base64?: string,
    useFastModel?: boolean,
  ) => void
  onAddToTimeline: (panel: IStoryboardPanel) => void
  onUpscaleImage?: (id: string, imageUrl: string, isLinkedImage?: boolean) => void
  onEnhancePrompt: (panelId: string, prompt: string) => void
}

export const StoryboardPanelItem = memo<StoryboardPanelItemProps>(
  ({
    panel,
    index,
    videoConfig,
    prevImage,
    nextImage,
    onUpdatePanel,
    onDeletePanel,
    onGenerateImage,
    onGenerateVideo,
    onAddToTimeline,
    onUpscaleImage,
    onEnhancePrompt,
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const isTransition = panel.type === "transition"
    const isGeneratingImage = panel.status === "generating-image"
    const isGeneratingVideo = panel.status === "generating-video"
    const isEnhancing = panel.status === "enhancing"
    const hasError = panel.status === "error"

    const handleImageUpload = async (file: File, isLinked = false) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string
        if (isLinked) {
          onUpdatePanel(panel.id, { linkedImageUrl: dataUrl })
        } else {
          onUpdatePanel(panel.id, { imageUrl: dataUrl })
        }
      }
      reader.readAsDataURL(file)
    }

    return (
      <div
        className={`rounded-lg border overflow-hidden shadow-sm group transition-all ${
          isTransition
            ? "bg-[#13131f] border-[var(--accent-muted)]"
            : "bg-[var(--surface-2)] border-[var(--border-default)]"
        } ${hasError ? "border-red-500/50" : ""}`}
      >
        {/* Panel Header */}
        <div
          className={`px-3 py-2 border-b flex justify-between items-center ${
            isTransition
              ? "bg-[#1a1a2e] border-[var(--accent-muted)]"
              : "bg-[var(--surface-3)] border-[var(--border-default)]"
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold ${
                isTransition ? "bg-[var(--accent-bg-subtle)] text-[var(--accent-text)]" : "bg-white/10 text-white"
              }`}
            >
              {index + 1}
            </div>
            <span
              className={`text-[10px] font-bold uppercase ${isTransition ? "text-[var(--accent-text)]" : "text-neutral-500"}`}
            >
              {isTransition ? `Keyframes` : `Shot`}
            </span>

            {/* Type Toggle */}
            <div className="flex bg-black/20 rounded p-0.5 ml-2">
              <button
                onClick={() => onUpdatePanel(panel.id, { type: "scene", linkedImageUrl: undefined })}
                className={`px-1.5 py-0.5 text-[8px] rounded ${
                  !isTransition ? "bg-neutral-600 text-white" : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                Shot
              </button>
              <button
                onClick={() => {
                  onUpdatePanel(panel.id, {
                    type: "transition",
                    imageUrl: panel.imageUrl || prevImage,
                    linkedImageUrl: nextImage,
                  })
                }}
                className={`px-1.5 py-0.5 text-[8px] rounded ${
                  isTransition ? "bg-[var(--accent-primary)] text-accent-text-white" : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                Keyframes
              </button>
            </div>

            {(isGeneratingImage || isGeneratingVideo || isEnhancing) && (
              <div className="flex items-center gap-1 ml-2">
                <div className="animate-spin w-3 h-3 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full" />
                <span className="text-[8px] text-[var(--accent-text)]">
                  {isGeneratingImage
                    ? "Generating image..."
                    : isGeneratingVideo
                      ? "Generating video..."
                      : "Enhancing..."}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => onDeletePanel(panel.id)}
            className="text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <TrashIcon className="w-3 h-3" />
          </button>
        </div>

        <div className="p-3 flex flex-col gap-3">
          {/* Prompt Input */}
          <div className="relative">
            <textarea
              value={panel.prompt}
              onChange={(e) => onUpdatePanel(panel.id, { prompt: e.target.value })}
              placeholder={
                isTransition
                  ? "Describe the motion between keyframes (e.g. 'Morph smoothly')..."
                  : "Describe the shot..."
              }
              className="w-full bg-[var(--surface-1)] border border-neutral-700 rounded p-2 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-[var(--accent-muted)] min-h-[60px] resize-y pr-6"
              disabled={isGeneratingImage || isGeneratingVideo || isEnhancing}
            />
            <button
              onClick={() => onEnhancePrompt(panel.id, panel.prompt)}
              disabled={!panel.prompt || isGeneratingImage || isGeneratingVideo || isEnhancing}
              className="absolute bottom-2 right-2 text-[var(--accent-text)] hover:text-[var(--accent-primary)] disabled:opacity-30 transition-colors"
              title="Enhance Prompt using Master Context"
            >
              {isEnhancing ? (
                <div className="animate-spin w-3 h-3 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Duration Selector */}
          <div className="flex justify-end gap-2">
            {[5, 8].map((d) => (
              <button
                key={d}
                onClick={() => onUpdatePanel(panel.id, { duration: d as 5 | 8 })}
                className={`px-2 py-0.5 text-[9px] rounded border ${
                  panel.duration === d
                    ? "bg-neutral-700 border-neutral-600 text-white"
                    : "bg-transparent border-transparent text-neutral-600 hover:text-neutral-400"
                }`}
              >
                {d}s
              </button>
            ))}
          </div>

          {/* Media Area */}
          {isTransition ? (
            /* Transition Layout: Start -> End */
            <div className="flex gap-2 items-center">
              {/* Start Frame */}
              <div className="relative flex-1 aspect-video bg-[var(--surface-1)] rounded border border-[var(--border-default)] overflow-hidden group/media">
                {panel.imageUrl ? (
                  <>
                    <img src={panel.imageUrl || "/placeholder.svg"} className="w-full h-full object-cover" />
                    <button
                      onClick={() => onUpdatePanel(panel.id, { imageUrl: undefined })}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded opacity-0 group-hover/media:opacity-100 text-red-400 hover:text-red-300"
                    >
                      <TrashIcon className="w-2.5 h-2.5" />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-neutral-700 gap-1">
                    <span className="text-[9px]">Start Frame</span>
                    {prevImage && (
                      <button
                        onClick={() => onUpdatePanel(panel.id, { imageUrl: prevImage })}
                        className="text-[8px] text-[var(--accent-text)] hover:text-[var(--accent-primary)]"
                      >
                        Use Previous
                      </button>
                    )}
                    <label className="text-[8px] text-neutral-500 hover:text-neutral-300 cursor-pointer flex items-center gap-1">
                      <UploadIcon className="w-3 h-3" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(file, false)
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="text-neutral-600 text-lg">→</div>

              {/* End Frame */}
              <div className="relative flex-1 aspect-video bg-[var(--surface-1)] rounded border border-[var(--border-default)] overflow-hidden group/media">
                {panel.linkedImageUrl ? (
                  <>
                    <img src={panel.linkedImageUrl || "/placeholder.svg"} className="w-full h-full object-cover" />
                    <button
                      onClick={() => onUpdatePanel(panel.id, { linkedImageUrl: undefined })}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded opacity-0 group-hover/media:opacity-100 text-red-400 hover:text-red-300"
                    >
                      <TrashIcon className="w-2.5 h-2.5" />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-neutral-700 gap-1">
                    <span className="text-[9px]">End Frame</span>
                    {nextImage && (
                      <button
                        onClick={() => onUpdatePanel(panel.id, { linkedImageUrl: nextImage })}
                        className="text-[8px] text-[var(--accent-text)] hover:text-[var(--accent-primary)]"
                      >
                        Use Next
                      </button>
                    )}
                    <label className="text-[8px] text-neutral-500 hover:text-neutral-300 cursor-pointer flex items-center gap-1">
                      <UploadIcon className="w-3 h-3" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImageUpload(file, true)
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Scene Layout */
            <div className="grid grid-cols-2 gap-2">
              {/* Image Slot */}
              <div className="relative aspect-video bg-[var(--surface-1)] rounded border border-[var(--border-default)] overflow-hidden group/media">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                  }}
                />

                {panel.imageUrl ? (
                  <>
                    <img src={panel.imageUrl || "/placeholder.svg"} className="w-full h-full object-cover" />
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckIcon className="w-2.5 h-2.5 text-white" />
                    </div>
                    <button
                      onClick={() => onUpdatePanel(panel.id, { imageUrl: undefined })}
                      className="absolute top-1 left-1 p-1 bg-black/60 rounded opacity-0 group-hover/media:opacity-100 text-red-400 hover:text-red-300"
                    >
                      <TrashIcon className="w-2.5 h-2.5" />
                    </button>
                    {onUpscaleImage && (
                      <button
                        onClick={() => onUpscaleImage(panel.id, panel.imageUrl!)}
                        className="absolute top-1 right-6 p-1 bg-black/60 rounded opacity-0 group-hover/media:opacity-100 text-[var(--accent-text)] hover:text-[var(--accent-primary)]"
                      >
                        <ZoomInIcon className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {isGeneratingImage ? (
                      <div className="flex flex-col items-center gap-1">
                        <div className="animate-spin w-4 h-4 border-2 border-neutral-600 border-t-neutral-400 rounded-full" />
                        <span className="text-[8px] text-neutral-500">Generating...</span>
                      </div>
                    ) : (
                      <span className="text-[9px] text-neutral-700">No Image</span>
                    )}
                  </div>
                )}

                {!panel.imageUrl && !isGeneratingImage && !isGeneratingVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity">
                    <div className="flex gap-2">
                      {panel.prompt && (
                        <button
                          onClick={() => onGenerateImage(panel.id, panel.prompt)}
                          className="flex flex-col items-center gap-1 text-neutral-300 hover:text-white p-2"
                        >
                          <MagicIcon className="w-4 h-4" />
                          <span className="text-[8px] font-medium">Generate</span>
                        </button>
                      )}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center gap-1 text-neutral-300 hover:text-white p-2"
                      >
                        <UploadIcon className="w-4 h-4" />
                        <span className="text-[8px] font-medium">Upload</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Slot */}
              <div className="relative aspect-video bg-[var(--surface-1)] rounded border border-[var(--border-default)] overflow-hidden">
                {panel.videoUrl ? (
                  <>
                    <video src={panel.videoUrl} className="w-full h-full object-cover" controls muted />
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckIcon className="w-2.5 h-2.5 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {isGeneratingVideo ? (
                      <div className="flex flex-col items-center gap-1">
                        <div className="animate-spin w-4 h-4 border-2 border-[var(--accent-primary)] border-t-[var(--accent-text)] rounded-full" />
                        <span className="text-[8px] text-[var(--accent-text)]">Generating...</span>
                      </div>
                    ) : (
                      <span className="text-[9px] text-neutral-700">No Video</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex justify-between items-center pt-1">
            <div className="text-[9px] text-neutral-600 font-mono">
              {videoConfig.useFastModel ? "Veo Fast" : "Veo Quality"}
            </div>

            <div className="flex gap-2">
              {!panel.videoUrl && !isGeneratingImage && !isGeneratingVideo && (
                <button
                  onClick={() =>
                    onGenerateVideo(
                      panel.id,
                      panel.prompt,
                      panel.imageUrl,
                      panel.linkedImageUrl,
                      videoConfig.useFastModel,
                    )
                  }
                  disabled={!panel.prompt || (isTransition && (!panel.imageUrl || !panel.linkedImageUrl))}
                  className="flex items-center gap-1.5 px-2 py-1 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-[10px] font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FilmIcon className="w-3 h-3" />
                  {isTransition ? "Interpolate" : "Animate"}
                </button>
              )}

              {panel.videoUrl && (
                <button
                  onClick={() => onAddToTimeline(panel)}
                  className="flex items-center gap-1.5 px-2 py-1 bg-[var(--accent-bg-subtle)] hover:bg-[var(--accent-muted)] text-[var(--accent-text)] text-[10px] font-medium rounded border border-[var(--accent-border)] transition-colors"
                >
                  <PlusIcon className="w-3 h-3" /> Timeline
                </button>
              )}
            </div>
          </div>

          {panel.error && (
            <div className="text-[10px] text-red-400 bg-red-900/10 p-2 rounded border border-red-900/30">
              Error: {panel.error}
            </div>
          )}
        </div>
      </div>
    )
  },
)

StoryboardPanelItem.displayName = "StoryboardPanelItem"
