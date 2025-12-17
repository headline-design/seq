"use client"

import { useRef, useState } from "react"
import { Card } from "@/seq/components/ui/card"
import { Button } from "@/seq/components/ui/button"
import { CheckCircle2, Loader2, RefreshCw, Play, Sparkles } from "lucide-react"
import Image from "next/image"
import { useToastContext } from "@/seq/components/ui/sonner"
import { saveSession } from "@/seq/lib/session-storage"
import { DEMO_STORYBOARD } from "@/seq/lib/demo-data"

interface PanelProcessorProps {
  masterUrl: string
  masterPrompt: string
  panelCount: number
  storageMode: "persistent" | "temporal" // Add storageMode prop
  onComplete: (panels: string[]) => void
}

export function PanelProcessor({ masterUrl, masterPrompt, panelCount, storageMode, onComplete }: PanelProcessorProps) {
  const { toast } = useToastContext()
  const [status, setStatus] = useState<"ready" | "processing" | "complete">("ready")
  const [panels, setPanels] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const [regenerating, setRegenerating] = useState<number[]>([])
  const processingRef = useRef(false)

  const extractPanel = async (index: number): Promise<string | null> => {
    const row = Math.floor(index / 3) + 1
    const col = (index % 3) + 1
    const position = `Row ${row}, Column ${col}`

    const extractionPrompt = `
      Look at the provided storyboard grid.
      Extract strictly the single panel at position #${index + 1} (reading order: ${position}).
      Generate a high-resolution, full-frame cinematic version of THIS SPECIFIC PANEL ONLY.

      QC INSTRUCTIONS:
      - Remove any text, captions, numbers, or borders.
      - Fix any non-standard elements or distortions.
      - Ensure the aspect ratio is standard 16:9 cinematic.
      - Maintain strict visual consistency with the master style.
      - This is a direct visual extraction and upscaling task.
    `.trim()

    const formData = new FormData()
    formData.append("mode", "image-editing")
    formData.append("prompt", extractionPrompt)
    formData.append("image1Url", masterUrl)
    formData.append("aspectRatio", "landscape")
    formData.append("uploadToBlob", storageMode === "persistent" ? "true" : "false")

    try {
      const response = await fetch("/api/seq/generate-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        console.error(`Extraction failed for panel ${index + 1}`)
        return null
      }

      const data = await response.json()
      return data.url || null
    } catch (e) {
      console.error(`Panel ${index + 1} error:`, e)
      return null
    }
  }

  const processPanels = async () => {
    if (processingRef.current) return
    processingRef.current = true
    setStatus("processing")

    const extractedPanels: string[] = []

    try {
      for (let i = 0; i < panelCount; i++) {
        const url = await extractPanel(i)

        if (url) {
          extractedPanels.push(url)
          setPanels((prev) => [...prev, url])
        }

        setProgress(((i + 1) / panelCount) * 100)
      }

      setStatus("complete")
      saveSession({ processedPanels: extractedPanels })

      if (storageMode === "temporal") {
        const dataUriCount = extractedPanels.filter((url) => url.startsWith("data:")).length
        toast.success(`${dataUriCount} panels ready (temporal - do not refresh page)`)
      } else {
        const httpUrlCount = extractedPanels.filter((url) => url.startsWith("http")).length
        toast.success(`${httpUrlCount} panels saved to persistent storage`)
      }

      onComplete(extractedPanels)
    } catch (error) {
      console.error("Processing error:", error)
      toast.error("Failed to process panels")
      setStatus("ready")
    } finally {
      processingRef.current = false
    }
  }

  const regeneratePanel = async (index: number) => {
    setRegenerating((prev) => [...prev, index])

    try {
      const url = await extractPanel(index)

      if (url) {
        setPanels((prev) => {
          const updated = [...prev]
          updated[index] = url
          return updated
        })
      }
    } finally {
      setRegenerating((prev) => prev.filter((i) => i !== index))
    }
  }

  const loadDemoPanels = () => {
    const demoPanelUrls = DEMO_STORYBOARD.panels.map((p) => p.imageUrl)
    setPanels(demoPanelUrls)
    setProgress(100)
    setStatus("complete")
    saveSession({ processedPanels: demoPanelUrls })
    toast.success(`Loaded ${demoPanelUrls.length} demo panels from storage`)
    onComplete(demoPanelUrls)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Processing Storyboard</h2>
        <p className="text-neutral-400">
          Using Nano Banana to extract, upscale, and QC {panelCount} panels from the master.
          {masterPrompt.includes("Ratatouille") && " (Demo Mode Active)"}
        </p>
      </div>

      {status === "ready" && (
        <div className="flex justify-center gap-3 mb-8">
          <Button
            size="lg"
            onClick={processPanels}
            className="bg-[var(--accent-gradient)] hover:opacity-90 text-accent-text-white gap-2"
          >
            <Play className="w-5 h-5" />
            Start Panel Extraction & Upscaling
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={loadDemoPanels}
            className="border gap-2 bg-transparent"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-2)" }}
          >
            <Sparkles className="w-5 h-5" />
            Use Demo Extracted Panels
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <Card
          className="p-4 border"
          style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border-default)" }}
        >
          <div className="aspect-[3/2] relative rounded-lg overflow-hidden">
            <Image src={masterUrl || "/placeholder.svg"} alt="Master" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
              <span className="text-white font-medium px-3 py-1 bg-black/60 rounded-full border border-white/20 backdrop-blur-sm">
                Original Master Reference
              </span>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Status</span>
              <span className="text-neutral-200 font-medium capitalize flex items-center gap-2">
                {status === "processing" && <Loader2 className="w-3 h-3 animate-spin" />}
                {status === "processing" ? `Extracting Panel ${panels.length + 1}/${panelCount}...` : status}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-3)" }}>
              <div
                className="h-full bg-[var(--accent-gradient)] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: panelCount }).map((_, i) => (
              <div
                key={i}
                className="aspect-video relative rounded overflow-hidden border group"
                style={{ backgroundColor: "var(--surface-3)", borderColor: "var(--border-default)" }}
              >
                {panels[i] ? (
                  <>
                    <Image src={panels[i] || "/placeholder.svg"} alt={`Panel ${i}`} fill className="object-cover" />
                    {status === "complete" && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => regeneratePanel(i)}
                          disabled={regenerating.includes(i)}
                          className="h-7 text-xs"
                        >
                          {regenerating.includes(i) ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    )}
                    <div className="absolute top-1 right-1">
                      <CheckCircle2 className="w-4 h-4 text-green-500 bg-black rounded-full" />
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs text-zinc-500">Panel {i + 1}</span>
                  </div>
                )}

                {status === "processing" && i === panels.length && (
                  <div className="absolute inset-0 bg-white/10 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
