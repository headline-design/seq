"use client"

import { useRef, useState } from "react"
import { Button } from "@/seq/components/ui/button"
import { Textarea } from "@/seq/components/ui/textarea"
import { Card } from "@/seq/components/ui/card"
import { Loader2, Wand2, ArrowRight, Play, Sparkles, CheckCircle2, RefreshCw, Pencil, Check } from "lucide-react"
import Image from "next/image"
import { Label } from "@/seq/components/ui/label"
import { DEMO_TRANSITION_STORYBOARD } from "@/seq/lib/demo-data"
import { Input } from "@/seq/components/ui/input"
import { useToastContext } from "@/seq/components/ui/sonner"

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
      const response = await fetch("/api/seq/analyze-storyboard", {
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
      setAnalyzedCount(4)
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

      const response = await fetch("/api/seq/generate-image", {
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
      const response = await fetch("/api/seq/generate-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) return null

      const data = await response.json()
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
        <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Generate Transition Frames</h2>
        <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
          Your main storyboard contains intermediate transition states. Generate clean first/last frames for smooth
          transitions.
        </p>
      </div>

      {!generatedUrl && (
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-4 bg-[var(--surface-2)] border-[var(--border-default)]">
            <Label className="text-sm text-[var(--text-secondary)] mb-2">Main Storyboard Reference</Label>
            <div className="aspect-3/2 relative rounded-lg overflow-hidden border border-[var(--border-default)]">
              <Image src={masterUrl || "/placeholder.svg"} alt="Main Storyboard" fill className="object-cover" />
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2 line-clamp-2">{masterPrompt}</p>
          </Card>

          <Card className="p-6 bg-[var(--surface-2)] border-[var(--border-default)] space-y-4">
            <div className="space-y-2">
              <Label>Describe Transition Frames Needed</Label>
              <Textarea
                placeholder="E.g., There are 2 transition panels. For transition 1, I need the first frame to be identical to panel 4 but without the warp effect..."
                className="min-h-[140px] bg-[var(--surface-3)] border-[var(--border-default)] resize-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                value={transitionPrompt}
                onChange={(e) => setTransitionPrompt(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={!transitionPrompt.trim() || isGenerating}
                className="flex-1 h-11 font-medium bg-[var(--tertiary)] hover:bg-[var(--tertiary-hover)] text-white"
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
                className="border-[var(--border-default)] bg-[var(--surface-2)] hover:bg-[var(--hover-overlay)] text-[var(--text-secondary)]"
              >
                Load Demo
              </Button>
            </div>
          </Card>
        </div>
      )}

      {generatedUrl && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <Card className="p-4 bg-[var(--surface-1)] border-[var(--border-default)]">
            <div className="aspect-3/2 relative rounded-lg overflow-hidden border border-[var(--border-default)]">
              <Image src={generatedUrl || "/placeholder.svg"} alt="Transition Master" fill className="object-cover" />
              <div className="absolute top-2 right-2 bg-black/70 px-3 py-1 rounded text-xs font-medium text-white backdrop-blur-sm flex items-center gap-2">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3 text-[var(--success)]" />
                    {isEditingCount ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Input
                          type="number"
                          min={1}
                          max={12}
                          className="h-6 w-16 text-xs bg-[var(--surface-3)] border-[var(--border-emphasis)]"
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
                        className="flex items-center gap-2 cursor-pointer hover:text-[var(--text-secondary)]"
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
                <Button
                  size="lg"
                  onClick={processPanels}
                  disabled={!analyzedCount}
                  className="gap-2 bg-[var(--tertiary)] hover:bg-[var(--tertiary-hover)] text-white"
                >
                  <Play className="w-5 h-5" />
                  Start Extraction
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={loadDemoExtractedPanels}
                  className="border-[var(--border-default)] bg-[var(--surface-1)] hover:bg-[var(--hover-overlay)] gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Use Demo
                </Button>
              </div>
            )}

            {status === "processing" && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Status</span>
                  <span className="text-[var(--text-primary)] font-medium flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Extracting {panels.length + 1}/{analyzedCount}...
                  </span>
                </div>
                <div className="h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--tertiary)] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: analyzedCount || 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-video relative rounded bg-[var(--surface-3)] overflow-hidden border border-[var(--border-default)] group"
                >
                  {panels[i] ? (
                    <>
                      <Image
                        src={panels[i] || "/placeholder.svg"}
                        alt={`Transition Panel ${i}`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-1 right-1">
                        <CheckCircle2 className="w-4 h-4 text-[var(--success)] bg-black rounded-full" />
                      </div>
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
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-[var(--text-muted)]">Panel {i + 1}</span>
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

      <div className="flex justify-center pt-6 border-t border-[var(--border-default)]">
        <Button
          variant="outline"
          onClick={onSkip}
          className="border-[var(--border-default)] hover:bg-[var(--hover-overlay)] bg-transparent"
        >
          Skip - No Transitions Needed
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
