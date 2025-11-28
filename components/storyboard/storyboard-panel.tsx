"use client"

import { useState, useRef, useEffect } from "react"
import { Loader2, Play, Trash2, Film, RefreshCw, Download, Sparkles, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import type { StoryboardPanelData, VideoConfig } from "./types"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface StoryboardPanelProps {
  panel: StoryboardPanelData
  index: number
  masterDescription: string
  videoConfig: VideoConfig
  onUpdate: (id: string, updates: Partial<StoryboardPanelData>) => void
  onRemove: (id: string) => void
  onGenerate: (id: string) => void
}

export function StoryboardPanel({
  panel,
  index,
  masterDescription,
  videoConfig,
  onUpdate,
  onRemove,
  onGenerate,
}: StoryboardPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const isTransitionPanel = !!panel.linkedImageUrl

  useEffect(() => {
    if (panel.videoUrl && isPlaying && videoRef.current) {
      videoRef.current.play().catch(() => setIsPlaying(false))
    } else if (videoRef.current) {
      videoRef.current.pause()
    }
  }, [isPlaying, panel.videoUrl])

  const handleEnhance = async () => {
    if (!masterDescription.trim() && !panel.prompt.trim()) return

    setIsEnhancing(true)
    try {
      const response = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: panel.imageUrl,
          masterDescription: masterDescription,
          panelPrompt: panel.prompt,
        }),
      })

      if (!response.ok) throw new Error("Failed to enhance")

      const data = await response.json()
      if (data.enhancedPrompt) {
        onUpdate(panel.id, { prompt: data.enhancedPrompt })
      }
    } catch (error) {
      console.error("Enhance failed", error)
    } finally {
      setIsEnhancing(false)
    }
  }

  return (
    <Card className="flex flex-col overflow-hidden bg-black/40 border-white/10 group relative">
      {isTransitionPanel && (
        <div className="absolute top-2 left-2 z-10 bg-blue-500 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1 font-medium">
          <Link2 className="w-3 h-3" />
          Transition
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-white/5 bg-black/20">
        <Badge variant="outline" className="text-xs bg-white/5 border-white/10 text-white/70">
          Panel {index + 1}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-white/40 hover:text-red-400 hover:bg-white/5"
          onClick={() => onRemove(panel.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content Area */}
      <div className="relative aspect-video bg-black/50 group/preview">
        {panel.videoUrl ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={panel.videoUrl}
              className="w-full h-full object-contain"
              loop
              playsInline
              onEnded={() => setIsPlaying(false)}
            />
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity",
                isPlaying ? "opacity-0 hover:opacity-100" : "opacity-100",
              )}
            >
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full h-12 w-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <div className="h-4 w-4 bg-white rounded-sm" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5 text-white" />
                )}
              </Button>
            </div>

            {/* Download Action */}
            <div className="absolute top-2 right-2 opacity-0 group-hover/preview:opacity-100 transition-opacity">
              <a href={panel.videoUrl} download target="_blank" rel="noopener noreferrer">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white rounded-full"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            {isTransitionPanel && panel.linkedImageUrl ? (
              <div className="w-full h-full flex gap-0.5">
                <div className="relative w-1/2 h-full">
                  <Image src={panel.imageUrl || "/placeholder.svg"} alt="First frame" fill className="object-contain" />
                  <div className="absolute bottom-1 left-1 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white/80">
                    First
                  </div>
                </div>
                <div className="relative w-1/2 h-full">
                  <Image
                    src={panel.linkedImageUrl || "/placeholder.svg"}
                    alt="Last frame"
                    fill
                    className="object-contain"
                  />
                  <div className="absolute bottom-1 right-1 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white/80">
                    Last
                  </div>
                </div>
              </div>
            ) : (
              <Image
                src={panel.imageUrl || "/placeholder.svg"}
                alt={`Panel ${index + 1}`}
                fill
                className="object-contain"
              />
            )}
            {!panel.isGenerating && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            )}
          </div>
        )}

        {/* Loading Overlay */}
        {panel.isGenerating && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[1px]">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
            <span className="text-xs text-white/80 font-medium animate-pulse">Generating Video...</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-3 flex flex-col gap-3 bg-black/20">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Video Model</label>
          <Select
            value={panel.model || (isTransitionPanel ? "veo3-fast-transition" : "veo3-fast")}
            onValueChange={(val) => onUpdate(panel.id, { model: val as any })}
          >
            <SelectTrigger className="h-7 text-xs bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {isTransitionPanel ? (
                <>
                  <SelectItem value="veo3-fast-transition">Veo 3.1 Fast (Transition)</SelectItem>
                  <SelectItem value="veo3-standard-transition">Veo 3.1 Standard (Transition)</SelectItem>
                  <SelectItem value="wan-2.2-transition">WAN 2.2 Turbo (Transition)</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="veo3-fast">Veo 3.1 Fast</SelectItem>
                  <SelectItem value="veo3-standard">Veo 3.1 Standard</SelectItem>
                  <SelectItem value="wan-2.5">WAN 2.5 Preview</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          <p className="text-[9px] text-white/30 leading-tight">
            {isTransitionPanel
              ? "Try WAN 2.2 if Veo 3.1 has strict content policies"
              : "Try WAN 2.5 if Veo 3.1 has strict content policies"}
          </p>
        </div>

        <div className="space-y-1.5 flex-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">
              Video Prompt
              {isTransitionPanel && <span className="text-blue-400 ml-1">(Transition Effect)</span>}
            </label>
            <div className="flex items-center gap-2">
              {/* Enhance Button */}
              <Button
                size="sm"
                variant="ghost"
                className="h-5 px-2 text-[10px] text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                onClick={handleEnhance}
                disabled={isEnhancing || (!masterDescription.trim() && !panel.prompt.trim())}
              >
                {isEnhancing ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                Enhance
              </Button>
              <span className="text-[10px] text-white/30">{panel.prompt.length} chars</span>
            </div>
          </div>
          <Textarea
            value={panel.prompt}
            onChange={(e) => onUpdate(panel.id, { prompt: e.target.value })}
            placeholder={
              isTransitionPanel
                ? "Describe the transition effect (e.g. 'Smooth zoom out revealing the wider scene')"
                : "Describe the motion for this shot (e.g. 'Zoom in slowly'). Use 'Enhance' to combine with Master Context."
            }
            className="h-full min-h-[100px] text-xs resize-none bg-white/5 border-white/10 focus:border-white/20 text-white/90 placeholder:text-white/20 font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Duration</label>
          <Select
            value={panel.duration?.toString() || "5"}
            onValueChange={(val) => onUpdate(panel.id, { duration: Number.parseInt(val) as 3 | 5 | 8 })}
          >
            <SelectTrigger className="h-7 text-xs bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 seconds</SelectItem>
              <SelectItem value="5">5 seconds</SelectItem>
              <SelectItem value="8">8 seconds</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-auto pt-2">
          {panel.videoUrl ? (
            <Button
              className="w-full text-xs h-8 bg-white/10 hover:bg-white/20 text-white border border-white/10"
              onClick={() => onGenerate(panel.id)}
              disabled={panel.isGenerating}
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Regenerate Video
            </Button>
          ) : (
            <Button
              className="w-full text-xs h-8 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0"
              onClick={() => onGenerate(panel.id)}
              disabled={panel.isGenerating || !panel.prompt.trim()}
            >
              <Film className="mr-2 h-3.5 w-3.5" />
              Generate Video
            </Button>
          )}
        </div>

        {panel.error && <div className="text-[10px] text-red-400 mt-1 px-1">Error: {panel.error}</div>}
      </div>
    </Card>
  )
}
