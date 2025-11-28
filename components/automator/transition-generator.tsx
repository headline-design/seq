"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Loader2, Wand2, ArrowRight, Play, Sparkles, CheckCircle2, RefreshCw, Pencil, Check } from "lucide-react"
import Image from "next/image"
import { Label } from "@/components/ui/label"
import { DEMO_TRANSITION_STORYBOARD } from "@/lib/demo-data"
import { Input } from "@/components/ui/input"
import { useToastContext } from "@/components/ui/sonner"

interface TransitionGeneratorProps {
  masterUrl: string
  masterPrompt: string
  storageMode: "persistent" | "temporal"
  onGenerate: (transitionPanels: string[], transitionPanelCount: number) => void
  onSkip: () => void
}

export function TransitionGenerator({
  masterUrl,
  masterPrompt,
  storageMode,
  onGenerate,
  onSkip,
}: TransitionGeneratorProps) {
  const { toast } = useToastContext()
  const [transitionPrompt, setTransitionPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [analyzedCount, setAnalyzedCount] = useState<number | null>(null)
  const [isEditingCount, setIsEditingCount] = useState(false)
  const [status, setStatus] = useState<"ready" | "processing" | "complete">("ready")
  const [panels, setPanels] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const [regenerating, setRegenerating] = useState<number[]>([])
  const processingRef = useRef(false)

  const analyzeImage = async (url: string) => {
    setIsAnalyzing(true)
    setIsEditingCount(false)
    try {
      const response = await fetch("/api/analyze-storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.panelCount) {
          setAnalyzedCount(data.panelCount)
        }
      }
    } catch (error) {
      console.error("Analysis failed:", error)
      setAnalyzedCount(4) // Fallback to 4 for transitions
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleGenerate = async () => {
    if (!transitionPrompt.trim()) return

    setIsGenerating(true)
    setGeneratedUrl(null)
    try {
      const formData = new FormData()
      formData.append("mode", "text-to-image")

      const systemPrompt =
        "You are creating a secondary storyboard with ONLY transition frames. " +
        "The user will provide context from their main storyboard and describe which transition frames they need. " +
        "Generate a grid showing ONLY the requested panels: clean first and last frames for each transition. " +
        "CRITICAL: NO TEXT, NO NUMBERING, NO BORDERS. " +
        "These frames must be visually consistent with the provided main storyboard style and lighting. " +
        "Each transition should have TWO panels: (1) FIRST FRAME (starting state), (2) LAST FRAME (ending state). " +
        "The frames should be clearly distinct keyframes that the AI model can interpolate between."

      const fullPrompt = `${systemPrompt}\n\nMAIN STORYBOARD CONTEXT: ${masterPrompt}\n\nTRANSITION REQUEST: ${transitionPrompt}`
      formData.append("prompt", fullPrompt)
      formData.append("aspectRatio", "16:9")

      const response = await fetch("/api/generate-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Generation failed")

      const data = await response.json()
      setGeneratedUrl(data.url)

      analyzeImage(data.url)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const extractPanel = async (index: number): Promise<string | null> => {
    const row = Math.floor(index / 2) + 1
    const col = (index % 2) + 1
    const position = `Row ${row}, Column ${col}`

    const extractionPrompt = `
      Look at the provided transition storyboard grid. 
      Extract strictly the single panel at position #${index + 1} (reading order: ${position}). 
      Generate a high-resolution, full-frame cinematic version of THIS SPECIFIC PANEL ONLY.
      
      This is a transition keyframe (first or last frame).
      - Remove any text, captions, numbers, or borders.
      - Ensure the aspect ratio is standard 16:9 cinematic.
      - Maintain strict visual consistency with the master style.
    `.trim()

    const formData = new FormData()
    formData.append("mode", "image-editing")
    formData.append("prompt", extractionPrompt)
    formData.append("image1Url", generatedUrl!)
    formData.append("aspectRatio", "landscape")
    formData.append("uploadToBlob", storageMode === "persistent" ? "true" : "false")

    try {
      console.log("[v0] Transition panel extraction request:", {
        index: index + 1,
        storageMode,
        uploadToBlob: storageMode === "persistent",
      })

      const response = await fetch("/api/generate-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) return null

      const data = await response.json()

      console.log("[v0] Transition panel extracted:", {
        index: index + 1,
        urlType: data.url?.startsWith("http") ? "HTTP URL" : "Data URI",
        urlPreview: data.url?.substring(0, 50),
      })

      return data.url || null
    } catch (e) {
      console.error(`Panel ${index + 1} error:`, e)
      return null
    }
  }

  const processPanels = async () => {
    if (processingRef.current || !analyzedCount) return
    processingRef.current = true
    setStatus("processing")

    const extractedPanels: string[] = []

    try {
      for (let i = 0; i < analyzedCount; i++) {
        const url = await extractPanel(i)

        if (url) {
          extractedPanels.push(url)
          setPanels((prev) => [...prev, url])
        }

        setProgress(((i + 1) / analyzedCount) * 100)
      }

      setStatus("complete")

      if (storageMode === "temporal") {
        toast.success(`${extractedPanels.length} transition frames ready (temporal)`)
      } else {
        toast.success(`${extractedPanels.length} transition frames saved`)
      }

      onGenerate(extractedPanels, analyzedCount)
    } catch (error) {
      console.error("Processing error:", error)
      toast.error("Failed to process transition panels")
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

  const loadDemoTransitions = () => {
    setTransitionPrompt(DEMO_TRANSITION_STORYBOARD.description)
    setGeneratedUrl(DEMO_TRANSITION_STORYBOARD.transitionImageUrl)
    setAnalyzedCount(DEMO_TRANSITION_STORYBOARD.panelCount)
  }

  const loadDemoExtractedPanels = () => {
    const demoPanelUrls = DEMO_TRANSITION_STORYBOARD.panels.map((p) => p.imageUrl)
    setPanels(demoPanelUrls)
    setProgress(100)
    setStatus("complete")
    toast.success(`Loaded ${demoPanelUrls.length} demo transition frames`)
    onGenerate(demoPanelUrls, demoPanelUrls.length)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="text-center space-y-3 mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Generate Transition Frames</h2>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          Your main storyboard contains intermediate transition states. Generate clean first/last frames for smooth
          transitions.
        </p>
      </div>

      {!generatedUrl && (
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-4 bg-zinc-900 border-zinc-800">
            <Label className="text-sm text-zinc-400 mb-2">Main Storyboard Reference</Label>
            <div className="aspect-[3/2] relative rounded-lg overflow-hidden border border-zinc-700">
              <Image src={masterUrl || "/placeholder.svg"} alt="Main Storyboard" fill className="object-cover" />
            </div>
            <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{masterPrompt}</p>
          </Card>

          <Card className="p-6 bg-zinc-900 border-zinc-800 space-y-4">
            <div className="space-y-2">
              <Label>Describe Transition Frames Needed</Label>
              <Textarea
                placeholder="E.g., There are 2 transition panels. For transition 1, I need the first frame to be identical to panel 4 but without the warp effect..."
                className="min-h-[140px] bg-black border-zinc-700 resize-none"
                value={transitionPrompt}
                onChange={(e) => setTransitionPrompt(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={!transitionPrompt.trim() || isGenerating}
                className="flex-1 h-11 font-medium"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Transition Frames
                  </>
                )}
              </Button>

              <Button
                onClick={loadDemoTransitions}
                variant="outline"
                disabled={isGenerating}
                className="border-emerald-700 hover:bg-emerald-950 bg-transparent text-emerald-400"
              >
                Load Demo
              </Button>
            </div>
          </Card>
        </div>
      )}

      {generatedUrl && status !== "complete" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <Card className="p-4 bg-zinc-900 border-zinc-800">
            <div className="aspect-[3/2] relative rounded-lg overflow-hidden border border-zinc-700">
              <Image src={generatedUrl || "/placeholder.svg"} alt="Transition Master" fill className="object-cover" />
              <div className="absolute top-2 right-2 bg-black/70 px-3 py-1 rounded text-xs font-medium text-white backdrop-blur-sm flex items-center gap-2">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3 text-green-400" />
                    {isEditingCount ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Input
                          type="number"
                          min={1}
                          max={12}
                          className="h-6 w-16 text-xs bg-zinc-800 border-zinc-600"
                          value={analyzedCount || 4}
                          onChange={(e) => setAnalyzedCount(Number.parseInt(e.target.value) || 4)}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => setIsEditingCount(false)}
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-2 cursor-pointer hover:text-zinc-300"
                        onClick={() => setIsEditingCount(true)}
                      >
                        <span>{analyzedCount ? `${analyzedCount} Panels` : "Ready"}</span>
                        <Pencil className="w-3 h-3 opacity-50" />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            {status === "ready" && (
              <div className="flex justify-center gap-3">
                <Button size="lg" onClick={processPanels} disabled={!analyzedCount} className="gap-2">
                  <Play className="w-5 h-5" />
                  Start Extraction
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={loadDemoExtractedPanels}
                  className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800 gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Use Demo
                </Button>
              </div>
            )}

            {status === "processing" && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-white font-medium flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Extracting {panels.length + 1}/{analyzedCount}...
                  </span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: analyzedCount || 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-video relative rounded bg-zinc-800 overflow-hidden border border-zinc-700 group"
                >
                  {panels[i] ? (
                    <>
                      <Image
                        src={panels[i] || "/placeholder.svg"}
                        alt={`Transition Panel ${i}`}
                        fill
                        className="object-cover"
                      />
                      {status === "complete" && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => regeneratePanel(i)}
                            disabled={regenerating.includes(i)}
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
      )}

      <div className="flex justify-center pt-6 border-t border-zinc-800">
        <Button variant="outline" onClick={onSkip} className="border-zinc-700 hover:bg-zinc-800 bg-transparent">
          Skip - No Transitions Needed
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
