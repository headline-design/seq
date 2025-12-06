"use client"

import { Film, Layers, Wand2, Settings2, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { StoryboardPanel } from "./storyboard-panel"
import type { StoryboardPanelData, VideoConfig, VideoModel } from "./types"
import { useToastContext } from "@/components/ui/sonner"
import { useEffect, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { saveSession, loadSession } from "@/lib/session-storage"
import { DEMO_FINAL_SEQUENCE } from "@/lib/demo-data"

interface StoryboardContainerProps {
  panels?: StoryboardPanelData[]
  setPanels?: (panels: StoryboardPanelData[]) => void
  initialPanels?: string[]
  linkedPanelData?: Record<number, string>
  prompts?: Record<number, string>
  durations?: Record<number, number>
  videoUrls?: Record<number, string>
}

export function StoryboardContainer({
  panels: propPanels,
  setPanels: propSetPanels,
  initialPanels,
  linkedPanelData: initialLinkedPanelData,
  prompts: initialPrompts,
  durations: initialDurations,
  videoUrls: initialVideoUrls,
}: StoryboardContainerProps) {
  const { toast } = useToastContext()
  const [internalPanels, setInternalPanels] = useState<StoryboardPanelData[]>([])
  const [masterDescription, setMasterDescription] = useState("")
  const [videoConfig, setVideoConfig] = useState<VideoConfig>({
    aspectRatio: "16:9",
    useFastModel: true,
  })
  const [isEnhancingMaster, setIsEnhancingMaster] = useState(false)

  const panels = propPanels || internalPanels
  const setPanels = propSetPanels || setInternalPanels

  useEffect(() => {
    if (initialPanels && initialPanels.length > 0) {
      const savedSession = loadSession()
      const savedVideoUrls = initialVideoUrls || savedSession?.videoUrls || {}

      const newPanels: StoryboardPanelData[] = initialPanels.map((url, index) => ({
        id: Math.random().toString(36).substring(7),
        imageUrl: url,
        linkedImageUrl: initialLinkedPanelData?.[index],
        prompt: initialPrompts?.[index] || "",
        duration: (initialDurations?.[index] || 5) as 5 | 3 | 8,
        videoUrl: savedVideoUrls[index],
        model: initialLinkedPanelData?.[index] ? ("veo3.1-fast" as VideoModel) : ("veo3.1-fast" as VideoModel),
        isGenerating: false,
      }))
      setPanels(newPanels)
    }
  }, [initialPanels, initialLinkedPanelData, initialPrompts, initialDurations, initialVideoUrls])

  useEffect(() => {
    if (panels.length > 0 || masterDescription) {
      saveSession({
        masterDescription,
        videoConfig,
      })
    }
  }, [panels, masterDescription, videoConfig])

  useEffect(() => {
    if (panels.length > 0) {
      const videoUrls: Record<number, string> = {}
      panels.forEach((panel, index) => {
        if (panel.videoUrl) {
          videoUrls[index] = panel.videoUrl
        }
      })

      if (Object.keys(videoUrls).length > 0) {
        saveSession({ videoUrls })
      }
    }
  }, [panels])

  const updatePanel = (id: string, updates: Partial<StoryboardPanelData>) => {
    setPanels(panels.map((p) => (p.id === id ? { ...p, ...updates } : p)))
  }

  const removePanel = (id: string) => {
    setPanels(panels.filter((p) => p.id !== id))
  }

  const generateVideo = async (id: string) => {
    const panel = panels.find((p) => p.id === id)
    if (!panel) return

    updatePanel(id, { isGenerating: true, error: undefined })

    try {
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: panel.imageUrl,
          linkedImageUrl: panel.linkedImageUrl,
          prompt: panel.prompt,
          aspectRatio: videoConfig.aspectRatio,
          duration: panel.duration,
          useFastModel: videoConfig.useFastModel,
          model: panel.model,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()

      if (result.data?.video?.url) {
        updatePanel(id, { videoUrl: result.data.video.url, isGenerating: false })
        toast.success("Video generated successfully!")
      } else {
        throw new Error("No video URL in response")
      }
    } catch (error: any) {
      console.error("Video generation failed:", error)
      updatePanel(id, {
        isGenerating: false,
        error: error.message || "Failed to generate video",
      })
      toast.error("Video generation failed")
    }
  }

  const generateAll = async () => {
    const pendingPanels = panels.filter((p) => !p.videoUrl && !p.isGenerating && p.prompt.trim().length > 0)

    if (pendingPanels.length === 0) {
      toast.info("No ready panels to generate (check prompts)")
      return
    }

    toast.info(`Starting generation for ${pendingPanels.length} panels...`)

    await Promise.all(pendingPanels.map((p) => generateVideo(p.id)))
  }

  const loadDemoData = () => {
    const updatedPanels = panels.map((panel) => {
      const demoPanel = DEMO_FINAL_SEQUENCE.panels.find(
        (dp) =>
          dp.imageUrl === panel.imageUrl &&
          (panel.linkedImageUrl ? dp.linkedImageUrl === panel.linkedImageUrl : !dp.linkedImageUrl),
      )

      if (demoPanel) {
        return {
          ...panel,
          prompt: demoPanel.prompt,
          duration: demoPanel.duration,
          model: panel.linkedImageUrl ? ("veo3.1fast" as VideoModel) : ("veo3.1-fast" as VideoModel),
          videoUrl: demoPanel.videoUrl,
        }
      }

      return panel
    })

    setPanels(updatedPanels)
    setMasterDescription(DEMO_FINAL_SEQUENCE.masterDescription)
    setVideoConfig(DEMO_FINAL_SEQUENCE.videoConfig)

    const matchedCount = updatedPanels.filter((p) =>
      DEMO_FINAL_SEQUENCE.panels.some(
        (dp) =>
          dp.imageUrl === p.imageUrl &&
          (p.linkedImageUrl ? dp.linkedImageUrl === p.linkedImageUrl : !dp.linkedImageUrl),
      ),
    ).length

    toast.success(`Demo data loaded for ${matchedCount} panel${matchedCount !== 1 ? "s" : ""} with videos!`)
  }

  const handleEnhanceMaster = async () => {
    if (!masterDescription.trim()) return

    setIsEnhancingMaster(true)
    try {
      const response = await fetch("/api/enhance-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: masterDescription }),
      })

      if (!response.ok) {
        throw new Error("Enhancement failed")
      }

      const data = await response.json()
      if (data.enhancedPrompt) {
        setMasterDescription(data.enhancedPrompt)
      }
    } catch (error) {
      console.error("Error enhancing master prompt:", error)
      toast.error("Failed to enhance prompt")
    } finally {
      setIsEnhancingMaster(false)
    }
  }

  if (panels.length === 0) {
    return (
      <div className="w-full p-8 border border-dashed border-white/10 rounded-lg bg-black/20 flex flex-col items-center justify-center text-center">
        <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Layers className="h-6 w-6 text-white/20" />
        </div>
        <h3 className="text-sm font-medium text-white/80 mb-1">Empty Storyboard</h3>
        <p className="text-xs text-white/40 max-w-xs mb-4">
          Add generated images from above to create a video storyboard powered by Veo.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-white/60" />
          <h2 className="text-sm font-semibold text-white/80">Video Storyboard</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50 border border-white/5">
            {panels.length} Panels
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs bg-emerald-600/20 border-emerald-600/30 text-emerald-400 hover:bg-emerald-600/30 hover:text-emerald-300"
            onClick={loadDemoData}
          >
            <Layers className="mr-1.5 h-3 w-3" />
            Load Demo Data
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
            onClick={() => setPanels([])}
          >
            Clear All
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs bg-indigo-600/80 hover:bg-indigo-600 text-white border-0"
            onClick={generateAll}
          >
            <Wand2 className="mr-1.5 h-3 w-3" />
            Generate All Videos
          </Button>
          {panels.length > 0 && panels.every((p) => p.videoUrl) && (
            <Button
              size="sm"
              className="h-7 text-xs bg-green-600/80 hover:bg-green-600 text-white border-0"
              onClick={() => (window.location.href = "/timeline")}
            >
              <Film className="mr-1.5 h-3 w-3" />
              Continue to Timeline Editor
            </Button>
          )}
        </div>
      </div>

      {panels.length > 0 && panels.every((p) => !p.prompt) && (
        <div className="px-1">
          <div className="text-xs text-white/40 bg-white/5 border border-white/10 rounded-lg p-3 flex items-start gap-2">
            <Layers className="h-3.5 w-3.5 text-white/40 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-white/60 mb-1">Your Storyboard is Ready</p>
              <p>
                Your selected panels are ready. You can now add video prompts manually, use the "Load Demo Data" button
                to pre-fill example data, or enhance prompts using the master description and AI.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="px-1 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">
              Master Clip Description / Story Context
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEnhanceMaster}
              disabled={isEnhancingMaster || !masterDescription.trim()}
              className="h-5 px-2 text-[10px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
            >
              {isEnhancingMaster ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
              ) : (
                <Sparkles className="w-3 h-3 mr-1.5" />
              )}
              Enhance
            </Button>
          </div>
          <Textarea
            value={masterDescription}
            onChange={(e) => setMasterDescription(e.target.value)}
            placeholder="Describe the overall scene, style, or story context (e.g. 'A flashback scene in Ratatouille, warm cinematic lighting, emotional tone'). This will be used to enhance individual shot prompts."
            className="min-h-[60px] text-xs resize-none bg-white/5 border-white/10 focus:border-white/20 text-white/90 placeholder:text-white/20"
          />
        </div>

        <div className="border border-white/10 bg-white/5 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-3">
            <Settings2 className="h-3.5 w-3.5 text-white/60" />
            <label className="text-[10px] uppercase tracking-wider text-white/60 font-semibold">
              Video Configuration (Applied to All Panels)
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/50 font-medium">Aspect Ratio</label>
              <Select
                value={videoConfig.aspectRatio}
                onValueChange={(val) => setVideoConfig({ ...videoConfig, aspectRatio: val as "16:9" | "9:16" })}
              >
                <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                  <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/50 font-medium">Quality</label>
              <Select
                value={videoConfig.useFastModel ? "fast" : "standard"}
                onValueChange={(val) => setVideoConfig({ ...videoConfig, useFastModel: val === "fast" })}
              >
                <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fast">Fast (Quicker)</SelectItem>
                  <SelectItem value="standard">Standard (Better)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-[10px] text-white/30 mt-2">
            Total sequence duration: ~{panels.reduce((sum, p) => sum + (p.duration || 5), 0)}s
          </p>
        </div>
      </div>

      <ScrollArea className="w-full whitespace-nowrap rounded-lg border border-white/5 bg-black/20 p-4">
        <div className="flex w-max space-x-4 pb-4">
          {panels.map((panel, index) => (
            <div key={panel.id} className="w-[300px] h-[360px] flex-none">
              <StoryboardPanel
                panel={panel}
                index={index}
                masterDescription={masterDescription}
                videoConfig={videoConfig}
                onUpdate={updatePanel}
                onRemove={removePanel}
                onGenerate={generateVideo}
              />
            </div>
          ))}

          {panels.length < 6 && (
            <div className="w-[300px] h-[360px] flex-none border border-dashed border-white/10 rounded-lg bg-white/5 flex flex-col items-center justify-center text-center p-6 opacity-50 hover:opacity-100 transition-opacity cursor-help">
              <p className="text-xs text-white/40">Select an image above and click "Add to Storyboard"</p>
            </div>
          )}
        </div>
        <ScrollBar orientation="horizontal" className="bg-white/5" />
      </ScrollArea>
    </div>
  )
}
