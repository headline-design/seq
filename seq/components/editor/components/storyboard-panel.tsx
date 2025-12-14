"use client"
import { memo, useState, useCallback } from "react"
import type { StoryboardPanel as IStoryboardPanel, VideoConfig } from "../types"
import { PlusIcon } from "./icons"
import { StoryboardHeader } from "./storyboard/storyboard-header"
import { StoryboardBatchActions } from "./storyboard/storyboard-batch-actions"
import { StoryboardPanelItem } from "./storyboard/storyboard-panel-item"
import { useToastContext } from "@/seq/components/ui/sonner"

interface StoryboardPanelProps {
  onClose: () => void
  panels: IStoryboardPanel[]
  masterDescription: string
  setMasterDescription: (desc: string) => void
  isEnhancingMaster: boolean
  setIsEnhancingMaster: (isEnhancing: boolean) => void
  onMasterDescriptionChange: (desc: string) => void
  setIsEnhancing: (isEnhancing: boolean) => void
  setPrompt: (prompt: string) => void
  videoConfig: VideoConfig
  setVideoConfig: (config: VideoConfig) => void
  onVideoConfigChange: (config: VideoConfig) => void
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

export const StoryboardPanel = memo<StoryboardPanelProps>(
  ({
    onClose,
    panels,
    masterDescription,
    setMasterDescription,
    onMasterDescriptionChange,
    setIsEnhancing,
    setPrompt,
    isEnhancingMaster,
    setIsEnhancingMaster,
    videoConfig,
    setVideoConfig,
    onVideoConfigChange,
    onAddPanel,
    onUpdatePanel,
    onDeletePanel,
    onGenerateImage,
    onGenerateVideo,
    onAddToTimeline,
    onUpscaleImage,
  }) => {
    const { toast } = useToastContext()
    const [isGeneratingAll, setIsGeneratingAll] = useState<"images" | "videos" | null>(null)

    const isAnyGenerating = panels.some((p) => p.status === "generating-image" || p.status === "generating-video")

    const handleEnhancePrompt = useCallback(
      async (panelId: string, prompt: string) => {
        if (!prompt.trim()) return

        onUpdatePanel(panelId, { status: "enhancing" })
        try {
          const response = await fetch("/api/seq/enhance-text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt }),
          })

          if (!response.ok) throw new Error("Enhancement failed")

          const data = await response.json()
          if (data.enhancedPrompt) {
            onUpdatePanel(panelId, { prompt: data.enhancedPrompt, status: "idle" })
            toast.success("Prompt enhanced")
          } else {
            onUpdatePanel(panelId, { status: "idle" })
          }
        } catch (error) {
          console.error("Error enhancing prompt:", error)
          onUpdatePanel(panelId, { status: "error", error: "Enhancement failed" })
          toast.error("Failed to enhance prompt")
        }
      },
      [onUpdatePanel, toast],
    )

    const handleEnhanceMaster = useCallback(async () => {
      if (!masterDescription.trim()) return
      setIsEnhancingMaster(true)
      try {
        const response = await fetch("/api/seq/enhance-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: masterDescription }),
        })
        if (!response.ok) {
          setIsEnhancingMaster(false)
          toast.error("Failed to enhance master description")
          return
        }
        const data = await response.json()
        const enhanced = data.enhancedPrompt || masterDescription
        setMasterDescription(enhanced)
        setIsEnhancingMaster(false)
        toast.success("Master description enhanced")
      } catch (error) {
        setIsEnhancingMaster(false)
        toast.error("Failed to enhance master description")
      }
    }, [masterDescription, setIsEnhancingMaster, setMasterDescription, toast])

    const panelsWithVideos = panels.filter((p) => p.videoUrl)
    const panelsNeedingImages = panels.filter((p) => !p.imageUrl && p.prompt && p.status === "idle")
    const panelsNeedingVideos = panels.filter((p) => p.imageUrl && !p.videoUrl && p.prompt && p.status === "idle")

    const handleAddAllToTimeline = useCallback(() => {
      panelsWithVideos.forEach((panel) => {
        onAddToTimeline(panel)
      })
    }, [panelsWithVideos, onAddToTimeline])

    const handleGenerateAllImages = useCallback(async () => {
      if (panelsNeedingImages.length === 0) return
      setIsGeneratingAll("images")
      for (const panel of panelsNeedingImages) {
        onGenerateImage(panel.id, panel.prompt)
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
      setIsGeneratingAll(null)
    }, [panelsNeedingImages, onGenerateImage])

    const handleGenerateAllVideos = useCallback(async () => {
      if (panelsNeedingVideos.length === 0) return
      setIsGeneratingAll("videos")
      for (const panel of panelsNeedingVideos) {
        onGenerateVideo(panel.id, panel.prompt, panel.imageUrl, panel.linkedImageUrl, videoConfig.useFastModel)
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
      setIsGeneratingAll(null)
    }, [panelsNeedingVideos, onGenerateVideo, videoConfig.useFastModel])

    const getAdjacentImages = useCallback(
      (index: number) => {
        const prevPanel = panels[index - 1]
        const nextPanel = panels[index + 1]
        return {
          prevImage: prevPanel?.imageUrl || prevPanel?.videoUrl,
          nextImage: nextPanel?.imageUrl || nextPanel?.videoUrl,
        }
      },
      [panels],
    )

    return (
      <div className="w-full flex flex-col bg-[#09090b] border-r border-neutral-800 h-full">
        <StoryboardHeader
          onClose={onClose}
          masterDescription={masterDescription}
          setMasterDescription={setMasterDescription}
          isEnhancingMaster={isEnhancingMaster}
          onEnhanceMaster={handleEnhanceMaster}
          videoConfig={videoConfig}
          setVideoConfig={setVideoConfig}
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <StoryboardBatchActions
            panels={panels}
            isAnyGenerating={isAnyGenerating}
            isGeneratingAll={isGeneratingAll}
            onGenerateAllImages={handleGenerateAllImages}
            onGenerateAllVideos={handleGenerateAllVideos}
            onAddAllToTimeline={handleAddAllToTimeline}
          />

          {/* Panels */}
          <div className="flex flex-col gap-4 p-4 pb-20">
            {panels.length === 0 && (
              <div className="text-center py-8 opacity-50 text-xs text-neutral-500">
                Add panels to start your sequence.
              </div>
            )}

            {panels.map((panel, index) => {
              const { prevImage, nextImage } = getAdjacentImages(index)
              return (
                <StoryboardPanelItem
                  key={panel.id}
                  panel={panel}
                  index={index}
                  videoConfig={videoConfig}
                  prevImage={prevImage}
                  nextImage={nextImage}
                  onUpdatePanel={onUpdatePanel}
                  onDeletePanel={onDeletePanel}
                  onGenerateImage={onGenerateImage}
                  onGenerateVideo={onGenerateVideo}
                  onAddToTimeline={onAddToTimeline}
                  onUpscaleImage={onUpscaleImage}
                  onEnhancePrompt={handleEnhancePrompt}
                />
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
    )
  },
)

StoryboardPanel.displayName = "StoryboardPanel"
