"use client"

import type React from "react"
import { useRef, useState } from "react"
import type { StoryboardPanel as IStoryboardPanel, VideoConfig } from "../types"
import {
  PanelLeftClose,
  PlusIcon,
  TrashIcon,
  MagicIcon,
  FilmIcon,
  Sparkles,
  SettingsIcon,
  CheckIcon,
  ImageIcon,
  UploadIcon,
  ZoomInIcon,
} from "./icons"

interface StoryboardPanelProps {
  onClose: () => void
  panels: IStoryboardPanel[]
  masterDescription: string
  isEnhancingMaster: boolean
  setIsEnhancingMaster: (isEnhancing: boolean) => void
  setIsEnhancing: (isEnhancing: boolean) => void
  setMasterDescription: (desc: string) => void
  setPrompt: (prompt: string) => void
  videoConfig: VideoConfig
  setVideoConfig: (config: VideoConfig) => void
  onAddPanel: () => void
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
}

export const StoryboardPanel: React.FC<StoryboardPanelProps> = ({
  onClose,
  panels,
  masterDescription,
  setMasterDescription,
  setIsEnhancing,
  setPrompt,
  isEnhancingMaster,
  setIsEnhancingMaster,
  videoConfig,
  setVideoConfig,
  onAddPanel,
  onUpdatePanel,
  onDeletePanel,
  onGenerateImage,
  onGenerateVideo,
  onAddToTimeline,
  onUpscaleImage,
}) => {
  const [isGeneratingAll, setIsGeneratingAll] = useState<"images" | "videos" | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const handleEnhance = async (panelId: string, prompt: string) => {
    if (!prompt.trim()) return

    onUpdatePanel(panelId, { status: "enhancing" })
    try {
      const response = await fetch("/api/enhance-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error("Enhancement failed")
      }

      const data = await response.json()
      if (data.enhancedPrompt) {
        onUpdatePanel(panelId, { prompt: data.enhancedPrompt, status: "idle" })
      } else {
        onUpdatePanel(panelId, { status: "idle" })
      }
    } catch (error) {
      console.error("Error enhancing prompt:", error)
      onUpdatePanel(panelId, { status: "error", error: "Enhancement failed" })
    }
  }

  const handleEnhanceMaster = async () => {
    if (!masterDescription.trim()) return
    setIsEnhancingMaster(true)
    const response = await fetch("/api/enhance-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: masterDescription }),
    })
    if (!response.ok) {
      setIsEnhancingMaster(false)
      console.error("Enhancement failed")
      return
    }
    const data = await response.json()
    const enhanced = data.enhancedPrompt || masterDescription

    setMasterDescription(enhanced)
    setIsEnhancingMaster(false)
  }

  const panelsWithVideos = panels.filter((p) => p.videoUrl)
  const panelsNeedingImages = panels.filter((p) => !p.imageUrl && p.prompt && p.status === "idle")
  const panelsNeedingVideos = panels.filter((p) => p.imageUrl && !p.videoUrl && p.prompt && p.status === "idle")
  const hasAnyVideos = panelsWithVideos.length > 0
  const isAnyGenerating = panels.some((p) => p.status === "generating-image" || p.status === "generating-video")

  const handleAddAllToTimeline = () => {
    panelsWithVideos.forEach((panel) => {
      onAddToTimeline(panel)
    })
  }

  const handleGenerateAllImages = async () => {
    if (panelsNeedingImages.length === 0) return
    setIsGeneratingAll("images")

    for (const panel of panelsNeedingImages) {
      onGenerateImage(panel.id, panel.prompt)
      // Wait a bit between requests to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    setIsGeneratingAll(null)
  }

  const handleGenerateAllVideos = async () => {
    if (panelsNeedingVideos.length === 0) return
    setIsGeneratingAll("videos")

    for (const panel of panelsNeedingVideos) {
      onGenerateVideo(panel.id, panel.prompt, panel.imageUrl, panel.linkedImageUrl, videoConfig.useFastModel)
      // Wait between requests
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    setIsGeneratingAll(null)
  }

  const handleImageUpload = async (panelId: string, file: File, isLinked = false) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      if (isLinked) {
        onUpdatePanel(panelId, { linkedImageUrl: dataUrl })
      } else {
        onUpdatePanel(panelId, { imageUrl: dataUrl })
      }
    }
    reader.readAsDataURL(file)
  }

  const getAdjacentImages = (index: number) => {
    const prevPanel = panels[index - 1]
    const nextPanel = panels[index + 1]
    return {
      prevImage: prevPanel?.imageUrl || prevPanel?.videoUrl,
      nextImage: nextPanel?.imageUrl || nextPanel?.videoUrl,
    }
  }

  return (
    <div className="w-full flex flex-col bg-[#09090b] border-r border-neutral-800 h-full">
      {/* Header */}
      <div className="h-14 flex items-center px-4 justify-between shrink-0 border-b border-neutral-800 bg-[#09090b] z-10">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Storyboard</h2>
        <div
          className="p-1.5 rounded hover:bg-neutral-800 cursor-pointer text-neutral-500 transition-colors"
          onClick={onClose}
        >
          <PanelLeftClose className="w-4 h-4" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 flex flex-col gap-6">
          {/* Master Context */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Master Context</label>
              <button
                onClick={handleEnhanceMaster}
                disabled={isEnhancingMaster || !masterDescription.trim()}
                className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 disabled:opacity-30 transition-colors"
              >
                {isEnhancingMaster ? (
                  <div className="animate-spin w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                Enhance
              </button>
            </div>
            <textarea
              value={masterDescription}
              onChange={(e) => setMasterDescription(e.target.value)}
              placeholder="Describe the overall story, style, and atmosphere..."
              className="w-full bg-[#18181b] border border-neutral-800 rounded p-2 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 min-h-[60px] resize-y"
            />
          </div>

          {/* Global Settings */}
          <div className="flex flex-col gap-2 bg-[#18181b] p-3 rounded-lg border border-neutral-800">
            <div className="flex items-center gap-2 mb-2 text-neutral-400">
              <SettingsIcon className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Video Settings</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-neutral-500">Aspect Ratio</span>
                <div className="flex gap-1 bg-black/20 rounded p-0.5">
                  {["16:9", "9:16"].map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setVideoConfig({ ...videoConfig, aspectRatio: ratio as any })}
                      className={`flex-1 py-1 text-[9px] rounded ${videoConfig.aspectRatio === ratio ? "bg-neutral-700 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-neutral-500">Model Quality</span>
                <div className="flex gap-1 bg-black/20 rounded p-0.5">
                  <button
                    onClick={() => setVideoConfig({ ...videoConfig, useFastModel: true })}
                    className={`flex-1 py-1 text-[9px] rounded ${videoConfig.useFastModel ? "bg-indigo-600/80 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
                  >
                    Fast
                  </button>
                  <button
                    onClick={() => setVideoConfig({ ...videoConfig, useFastModel: false })}
                    className={`flex-1 py-1 text-[9px] rounded ${!videoConfig.useFastModel ? "bg-purple-600/80 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
                  >
                    High
                  </button>
                </div>
              </div>
            </div>
          </div>

          {panels.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                {panelsNeedingImages.length > 0 && (
                  <button
                    onClick={handleGenerateAllImages}
                    disabled={isAnyGenerating || isGeneratingAll !== null}
                    className="py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-emerald-600/30 disabled:opacity-50"
                  >
                    {isGeneratingAll === "images" ? (
                      <div className="animate-spin w-3 h-3 border-2 border-neutral-600 border-t-neutral-400 rounded-full" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5" />
                    )}
                    Gen All Images ({panelsNeedingImages.length})
                  </button>
                )}
                {panelsNeedingVideos.length > 0 && (
                  <button
                    onClick={handleGenerateAllVideos}
                    disabled={isAnyGenerating || isGeneratingAll !== null}
                    className="py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-indigo-600/30 disabled:opacity-50"
                  >
                    {isGeneratingAll === "videos" ? (
                      <div className="animate-spin w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full" />
                    ) : (
                      <FilmIcon className="w-3.5 h-3.5" />
                    )}
                    Gen All Videos ({panelsNeedingVideos.length})
                  </button>
                )}
              </div>

              {hasAnyVideos && (
                <button
                  onClick={handleAddAllToTimeline}
                  className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add All to Timeline ({panelsWithVideos.length} clip{panelsWithVideos.length !== 1 ? "s" : ""})
                </button>
              )}
            </div>
          )}

          {/* Panels */}
          <div className="flex flex-col gap-4 pb-20">
            {panels.length === 0 && (
              <div className="text-center py-8 opacity-50 text-xs text-neutral-500">
                Add panels to start your sequence.
              </div>
            )}

            {panels.map((panel, index) => {
              const isTransition = panel.type === "transition"
              const isGeneratingImage = panel.status === "generating-image"
              const isGeneratingVideo = panel.status === "generating-video"
              const isEnhancing = panel.status === "enhancing"
              const hasError = panel.status === "error"
              const { prevImage, nextImage } = getAdjacentImages(index)

              return (
                <div
                  key={panel.id}
                  className={`rounded-lg border overflow-hidden shadow-sm group transition-all ${isTransition ? "bg-[#13131f] border-indigo-500/20" : "bg-[#18181b] border-neutral-800"} ${hasError ? "border-red-500/50" : ""}`}
                >
                  {/* Panel Header */}
                  <div
                    className={`px-3 py-2 border-b flex justify-between items-center ${isTransition ? "bg-[#1a1a2e] border-indigo-900/30" : "bg-[#202024] border-neutral-800"}`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold ${isTransition ? "bg-indigo-500/20 text-indigo-400" : "bg-white/10 text-white"}`}
                      >
                        {index + 1}
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase ${isTransition ? "text-indigo-400" : "text-neutral-500"}`}
                      >
                        {isTransition ? `Keyframes` : `Shot`}
                      </span>

                      {/* Type Toggle */}
                      <div className="flex bg-black/20 rounded p-0.5 ml-2">
                        <button
                          onClick={() => onUpdatePanel(panel.id, { type: "scene", linkedImageUrl: undefined })}
                          className={`px-1.5 py-0.5 text-[8px] rounded ${!isTransition ? "bg-neutral-600 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
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
                          className={`px-1.5 py-0.5 text-[8px] rounded ${isTransition ? "bg-indigo-600 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
                        >
                          Keyframes
                        </button>
                      </div>

                      {(isGeneratingImage || isGeneratingVideo || isEnhancing) && (
                        <div className="flex items-center gap-1 ml-2">
                          <div className="animate-spin w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full" />
                          <span className="text-[8px] text-indigo-400">
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
                        className="w-full bg-[#0c0c0e] border border-neutral-700 rounded p-2 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 min-h-[60px] resize-y pr-6"
                        disabled={isGeneratingImage || isGeneratingVideo || isEnhancing}
                      />
                      <button
                        onClick={() => handleEnhance(panel.id, panel.prompt)}
                        disabled={!panel.prompt || isGeneratingImage || isGeneratingVideo || isEnhancing}
                        className="absolute bottom-2 right-2 text-indigo-400 hover:text-indigo-300 disabled:opacity-30 transition-colors"
                        title="Enhance Prompt using Master Context"
                      >
                        {isEnhancing ? (
                          <div className="animate-spin w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full" />
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
                          className={`px-2 py-0.5 text-[9px] rounded border ${panel.duration === d ? "bg-neutral-700 border-neutral-600 text-white" : "bg-transparent border-transparent text-neutral-600 hover:text-neutral-400"}`}
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
                        <div className="relative flex-1 aspect-video bg-[#0c0c0e] rounded border border-neutral-800 overflow-hidden group/media">
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
                                  className="text-[8px] text-indigo-400 hover:text-indigo-300"
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
                                    if (file) handleImageUpload(panel.id, file, false)
                                  }}
                                />
                              </label>
                            </div>
                          )}
                        </div>

                        <div className="text-neutral-600 text-lg">→</div>

                        {/* End Frame */}
                        <div className="relative flex-1 aspect-video bg-[#0c0c0e] rounded border border-neutral-800 overflow-hidden group/media">
                          {panel.linkedImageUrl ? (
                            <>
                              <img
                                src={panel.linkedImageUrl || "/placeholder.svg"}
                                className="w-full h-full object-cover"
                              />
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
                                  className="text-[8px] text-indigo-400 hover:text-indigo-300"
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
                                    if (file) handleImageUpload(panel.id, file, true)
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
                        <div className="relative aspect-video bg-[#0c0c0e] rounded border border-neutral-800 overflow-hidden group/media">
                          {/* Hidden file input */}
                          <input
                            ref={(el) => {
                              fileInputRefs.current[panel.id] = el
                            }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleImageUpload(panel.id, file)
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
                                  onClick={() => onUpscaleImage(panel.id, panel.imageUrl)}
                                  className="absolute top-1 right-6 p-1 bg-black/60 rounded opacity-0 group-hover/media:opacity-100 text-indigo-400 hover:text-indigo-300"
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
                                  onClick={() => fileInputRefs.current[panel.id]?.click()}
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
                        <div className="relative aspect-video bg-[#0c0c0e] rounded border border-neutral-800 overflow-hidden">
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
                                  <div className="animate-spin w-4 h-4 border-2 border-indigo-600 border-t-indigo-400 rounded-full" />
                                  <span className="text-[8px] text-indigo-400">Generating...</span>
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
                            className="flex items-center gap-1.5 px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FilmIcon className="w-3 h-3" />
                            {isTransition ? "Interpolate" : "Animate"}
                          </button>
                        )}

                        {panel.videoUrl && (
                          <button
                            onClick={() => onAddToTimeline(panel)}
                            className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-medium rounded border border-indigo-500/30 transition-colors"
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
            })}

            <button
              onClick={onAddPanel}
              className="w-full py-3 rounded-lg border border-dashed border-neutral-700 hover:border-neutral-500 text-neutral-500 hover:text-neutral-300 transition-all flex items-center justify-center gap-2 text-xs font-medium"
            >
              <PlusIcon className="w-4 h-4" /> Add Panel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
