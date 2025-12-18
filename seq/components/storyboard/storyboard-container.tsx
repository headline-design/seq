"use client"
import { Film, Layers, Wand2, Settings2 } from "lucide-react"
import type React from "react"

import { Button } from "@/seq/components/ui/button"
import { ScrollArea, ScrollBar } from "@/seq/components/ui/scroll-area"
import { StoryboardPanel } from "./storyboard-panel"
import type { StoryboardPanelData, VideoConfig, VideoModel } from "./types"
import { useToastContext } from "@/seq/components/ui/sonner"
import { useEffect, useState, useRef, useCallback } from "react"
import { Textarea } from "@/seq/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/seq/components/ui/select"
import { saveSession, loadSession } from "@/seq/lib/session-storage"
import { DEMO_FINAL_SEQUENCE } from "@/seq/lib/demo-data"

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

  const [leftWidth, setLeftWidth] = useState(35)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const panels = propPanels || internalPanels
  const setPanels = propSetPanels || setInternalPanels

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100
      setLeftWidth(Math.min(Math.max(newWidth, 25), 50))
    },
    [isResizing],
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  const handleDoubleClick = useCallback(() => {
    setLeftWidth(35)
  }, [])

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

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
      const response = await fetch("/api/seq/generate-video", {
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

  if (panels.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center bg-card">
        <div className="h-12 w-12 rounded-full flex items-center justify-center mb-4 bg-muted">
          <Layers className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-medium text-foreground mb-1">Empty Storyboard</h3>
        <p className="text-xs text-muted-foreground max-w-xs mb-4">
          Add generated images from above to create a video storyboard powered by Veo.
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative flex w-full h-full overflow-hidden"
      style={{ userSelect: isResizing ? "none" : "auto" }}
    >
      {/* Left Panel - Configuration */}
      <div className="flex flex-col overflow-hidden bg-card" style={{ width: `${leftWidth}%`, minWidth: "280px" }}>
        <div className="flex-shrink-0 h-12 px-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Video Storyboard</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{panels.length} Panels</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Info message if no prompts - card style */}
          {panels.length > 0 && panels.every((p) => !p.prompt) && (
            <div className="text-xs p-3 flex items-start gap-2 rounded-lg bg-muted text-muted-foreground">
              <Layers className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground mb-1">Your Storyboard is Ready</p>
                <p>
                  Your selected panels are ready. You can now add video prompts manually, use the "Load Demo Data"
                  button to pre-fill example data, or enhance prompts using the master description and AI.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Master Clip Description / Story Context
            </label>
            <Textarea
              value={masterDescription}
              onChange={(e) => setMasterDescription(e.target.value)}
              placeholder="Describe the overall scene, style, or story context (e.g. 'A flashback scene in Ratatouille, warm cinematic lighting, emotional tone'). This will be used to enhance individual shot prompts."
              className="min-h-[100px] text-xs resize-none rounded-lg"
            />
          </div>

          <div className="rounded-lg p-4 bg-muted">
            <div className="flex items-center gap-2 mb-3">
              <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Video Configuration
              </label>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground font-medium">Aspect Ratio</label>
                <Select
                  value={videoConfig.aspectRatio}
                  onValueChange={(val) => setVideoConfig({ ...videoConfig, aspectRatio: val as "16:9" | "9:16" })}
                >
                  <SelectTrigger className="h-8 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                    <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-muted-foreground font-medium">Quality</label>
                <Select
                  value={videoConfig.useFastModel ? "fast" : "standard"}
                  onValueChange={(val) => setVideoConfig({ ...videoConfig, useFastModel: val === "fast" })}
                >
                  <SelectTrigger className="h-8 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fast">Fast (Quicker)</SelectItem>
                    <SelectItem value="standard">Standard (Better)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              Total sequence duration: ~{panels.reduce((sum, p) => sum + (p.duration || 5), 0)}s
            </p>
          </div>

          {/* Action buttons in scrollable area */}
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs rounded-lg bg-transparent"
              onClick={loadDemoData}
            >
              <Layers className="mr-1.5 h-3 w-3" />
              Load Demo Data
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs rounded-lg bg-transparent"
              onClick={() => setPanels([])}
            >
              Clear All
            </Button>
          </div>
        </div>

        <div className="flex-shrink-0 p-4 border-t border-border space-y-2">
          <Button
            size="sm"
            className="w-full h-10 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={generateAll}
          >
            <Wand2 className="mr-1.5 h-4 w-4" />
            Generate All Videos
          </Button>
          {panels.length > 0 && panels.every((p) => p.videoUrl) && (
            <Button
              size="sm"
              className="w-full h-9 text-xs rounded-lg bg-green-600 hover:bg-green-700 text-white"
              onClick={() => (window.location.href = "/timeline")}
            >
              <Film className="mr-1.5 h-3 w-3" />
              Continue to Timeline Editor
            </Button>
          )}
        </div>
      </div>

      {/* Resize handle */}
      <div
        className="relative w-1 cursor-col-resize flex-shrink-0 bg-border hover:bg-primary transition-colors"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      />

      {/* Right Panel - Storyboard panels */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        <div className="flex-shrink-0 h-12 px-4 flex items-center justify-between border-b border-border">
          <span className="text-sm font-medium text-foreground">Storyboard Panels</span>
          <span className="text-xs text-muted-foreground">
            {panels.filter((p) => p.videoUrl).length}/{panels.length} videos generated
          </span>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="flex w-max space-x-4 pb-4">
            {panels.map((panel, index) => (
              <div key={panel.id} className="w-[280px] h-[420px] flex-none">
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
              <div className="w-[280px] h-[420px] flex-none rounded-lg border border-dashed border-border bg-card flex flex-col items-center justify-center text-center p-6 opacity-50 hover:opacity-100 transition-opacity cursor-help">
                <p className="text-xs text-muted-foreground">Select an image above and click "Add to Storyboard"</p>
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" className="bg-muted/20" />
        </ScrollArea>
      </div>
    </div>
  )
}
