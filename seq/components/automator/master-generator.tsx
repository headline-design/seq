"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/seq/components/ui/button"
import { Textarea } from "@/seq/components/ui/textarea"
import { Card } from "@/seq/components/ui/card"
import { Loader2, Wand2, Check, RefreshCw, Upload, Pencil, Sparkles } from "lucide-react"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/seq/components/ui/tabs"
import { Input } from "@/seq/components/ui/input"
import { Label } from "@/seq/components/ui/label"
import { DEMO_STORYBOARD } from "@/seq/lib/demo-data"

interface MasterGeneratorProps {
  onGenerate: (imageUrl: string, prompt: string, panelCount: number) => void
  onLoadDemo?: () => void
}

export function MasterGenerator({ onGenerate, onLoadDemo }: MasterGeneratorProps) {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [analyzedCount, setAnalyzedCount] = useState<number | null>(null)
  const [isEditingCount, setIsEditingCount] = useState(false)
  const [mode, setMode] = useState<"generate" | "upload">("generate")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLoadDemo = () => {
    setGeneratedUrl(DEMO_STORYBOARD.masterImageUrl)
    setPrompt(DEMO_STORYBOARD.masterDescription)
    setAnalyzedCount(DEMO_STORYBOARD.panelCount)
    setMode("upload")
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setGeneratedUrl(null)
    try {
      const formData = new FormData()
      formData.append("mode", "text-to-image")
      const systemPrompt =
        "You are a professional storyboard artist creating a source image for a video generation pipeline. " +
        "Create a strict 3x2 grid of 6 cinematic keyframes. " +
        "CRITICAL RULES: " +
        "1. NO TEXT, NO CAPTIONS, NO NUMBERING, NO TITLES. The image must be purely visual. " +
        "2. NO BORDERS, NO FRAMES, NO PADDING. The panels should fill the space or have minimal separation. " +
        "3. High-fidelity cinematic style, consistent character and lighting across all panels. " +
        "4. Do not render the 'paper' or 'document' of a storyboard, just the raw panel images arranged in a grid. " +
        "5. TRANSITION HANDLING: If the user describes a transition effect (zoom, pan, rotation, blur, time-shift), " +
        "render the INTERMEDIATE STATE as a visual reference. This helps users see what the effect should look like, " +
        "though they will generate separate first/last frames later for the actual video generation."

      const enhancedPrompt = `${systemPrompt}\n\nUser Request: ${prompt}`
      formData.append("prompt", enhancedPrompt)
      formData.append("aspectRatio", "3:2")

      const response = await fetch("/api/seq/generate-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Generation failed")

      const data = await response.json()
      setGeneratedUrl(data.url)
      setMode("generate")

      analyzeImage(data.url)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      setGeneratedUrl(result)
      if (!prompt) setPrompt(`Uploaded Master: ${file.name}`)

      analyzeImage(result)
    }
    reader.readAsDataURL(file)
  }

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
      setAnalyzedCount(6)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleApprove = () => {
    if (generatedUrl) {
      onGenerate(generatedUrl, prompt || "Uploaded Storyboard Master", analyzedCount || 6)
    }
  }

  const handleReset = () => {
    setGeneratedUrl(null)
    setAnalyzedCount(null)
    if (mode === "upload" && fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-section-title tracking-tight">Create Master Storyboard</h2>
        <p className="text-body">Generate a new storyboard or upload an existing master to begin the process.</p>
      </div>

      {!generatedUrl && (
        <div className="flex justify-center mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadDemo}
            className="border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--hover-overlay)] hover:text-[var(--text-primary)] bg-transparent"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Load Demo (Ratatouille Example)
          </Button>
        </div>
      )}

      <Card className="p-6 bg-[var(--surface-2)] border-[var(--border-default)] space-y-6">
        {!generatedUrl ? (
          <Tabs defaultValue="generate" className="w-full" onValueChange={(v) => setMode(v as any)}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-[var(--surface-3)]">
              <TabsTrigger value="generate">Generate New</TabsTrigger>
              <TabsTrigger value="upload">Upload Existing</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4">
              <div className="space-y-2">
                <Label>Describe your scene</Label>
                <Textarea
                  placeholder="E.g., A sci-fi sequence where a robot discovers a flower in a ruined city. 6 panels showing the approach, discovery, and reaction..."
                  className="min-h-[120px] bg-[var(--surface-3)] border-[var(--border-default)] resize-none text-lg"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full h-12 text-lg font-medium bg-[var(--tertiary)] hover:bg-[var(--tertiary-hover)] text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Master...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    Generate Storyboard
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="upload" className="space-y-6">
              <div
                className="border-2 border-dashed border-[var(--border-emphasis)] rounded-xl p-10 text-center hover:border-[var(--tertiary)] hover:bg-[var(--tertiary-muted)] transition-all cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                <div className="flex flex-col items-center gap-2">
                  <div className="p-4 bg-[var(--surface-3)] rounded-full mb-2">
                    <Upload className="h-8 w-8 text-[var(--text-secondary)]" />
                  </div>
                  <h3 className="font-medium text-lg text-[var(--text-primary)]">Click to upload master storyboard</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Supports JPG, PNG, WEBP (rec. 3:2 ratio)</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Optional: Context/Prompt for Upscaling</Label>
                <Input
                  placeholder="Describe the style or content for better upscaling context..."
                  className="bg-[var(--surface-3)] border-[var(--border-default)]"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative aspect-3/2 rounded-xl overflow-hidden border border-[var(--border-emphasis)]">
              <Image src={generatedUrl || "/placeholder.svg"} alt="Storyboard Master" fill className="object-cover" />
              <div className="absolute top-2 right-2 bg-black/70 px-3 py-1 rounded-lg text-xs font-medium text-white backdrop-blur-sm flex items-center gap-2">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Analyzing Layout...
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3 text-[var(--success)]" />
                    {isEditingCount ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={12}
                          className="h-6 w-16 text-xs bg-[var(--surface-3)] border-[var(--border-emphasis)]"
                          value={analyzedCount || 6}
                          onChange={(e) => setAnalyzedCount(Number.parseInt(e.target.value) || 6)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 hover:bg-[var(--hover-overlay)]"
                          onClick={(e) => {
                            e.stopPropagation()
                            setIsEditingCount(false)
                          }}
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-2 cursor-pointer hover:text-[var(--text-secondary)]"
                        onClick={() => setIsEditingCount(true)}
                      >
                        <span>{analyzedCount ? `${analyzedCount} Panels Detected` : "Preview Ready"}</span>
                        <Pencil className="w-3 h-3 opacity-50" />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isGenerating || isAnalyzing}
                className="flex-1 h-12 text-lg border-[var(--border-emphasis)] hover:bg-[var(--hover-overlay)] hover:border-[var(--border-strong)] bg-transparent"
              >
                {mode === "generate" ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Generate New
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-5 w-5" />
                    Upload Different
                  </>
                )}
              </Button>

              <Button
                onClick={handleApprove}
                disabled={isAnalyzing}
                className="flex-1 h-12 text-lg bg-[var(--tertiary)] hover:bg-[var(--tertiary-hover)] text-white"
              >
                <Check className="mr-2 h-5 w-5" />
                Approve & Process
              </Button>
            </div>
            <p className="text-xs text-center text-[var(--text-muted)]">
              {analyzedCount
                ? `Approving will slice this master into ${analyzedCount} individual panels based on AI analysis.`
                : "Approving will automatically slice this master into panels and upscale them."}
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
