"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, X, MoveUp, MoveDown, Plus, Repeat, Sparkles, AlertTriangle, Upload, ImagePlus } from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { DEMO_FINAL_SEQUENCE } from "@/lib/demo-data"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { nanoid } from "nanoid"

interface FinalPanel {
  id: string
  type: "single" | "transition"
  imageUrl?: string
  linkedImageUrl?: string
  source?: "main" | "transition" | "custom"
  originalIndex?: number
  prompt?: string
  duration?: number
  videoUrl?: string
}

interface PanelSelectorProps {
  panels: string[]
  masterUrl: string
  transitionPanels: string[]
  savedFinalPanels: string[]
  savedLinkedPanelData: Record<number, string>
  savedPrompts: Record<number, string>
  savedDurations: Record<number, number>
  savedVideoUrls: Record<number, string>
  onConfirm: (
    selectedPanels: string[],
    linkedData: Record<number, string>,
    promptsData: Record<number, string>,
    durationsData: Record<number, number>,
    videoUrlsData: Record<number, string>,
  ) => void
}

export function PanelSelector({
  panels = [], // Added default empty array
  masterUrl = "", // Added default empty string
  transitionPanels = [], // Added default empty array
  savedFinalPanels = [], // Added default empty array
  savedLinkedPanelData = {}, // Added default empty object
  savedPrompts = {}, // Added default empty object
  savedDurations = {}, // Added default empty object
  savedVideoUrls = {}, // Added savedVideoUrls from demo config
  onConfirm,
}: PanelSelectorProps) {
  const [localPanels, setLocalPanels] = useState<string[]>(panels || [])
  const [regenerating, setRegenerating] = useState<number[]>([])
  const [customImages, setCustomImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [finalPanels, setFinalPanels] = useState<FinalPanel[]>(() => {
    if (savedFinalPanels && savedFinalPanels.length > 0) {
      return savedFinalPanels.map((url, i) => ({
        id: nanoid(),
        type: savedLinkedPanelData?.[i] ? "transition" : "single",
        imageUrl: url,
        linkedImageUrl: savedLinkedPanelData?.[i],
        originalIndex: i,
        videoUrl: savedVideoUrls?.[i],
      }))
    }
    return []
  })
  const [selectingFor, setSelectingFor] = useState<{ panelId: string; slot: "first" | "last" } | null>(null)

  const panelsInitialized = useRef(false)

  useEffect(() => {
    if (panels && panels.length > 0 && !panelsInitialized.current) {
      setLocalPanels(panels)
      panelsInitialized.current = true
    }
  }, [panels])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const newImages: string[] = []

    const fileToDataUri = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    }

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not an image file`,
            variant: "destructive",
          })
          continue
        }

        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 10MB limit`,
            variant: "destructive",
          })
          continue
        }

        // Try blob storage first, fall back to data URI
        let imageUrl: string | null = null

        try {
          const formData = new FormData()
          formData.append("file", file)

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })

          if (response.ok) {
            const data = await response.json()
            if (data.url) {
              imageUrl = data.url
            }
          }
        } catch (uploadError) {
          console.log("[v0] Blob upload unavailable, using data URI fallback")
        }

        if (!imageUrl) {
          try {
            imageUrl = await fileToDataUri(file)
            console.log("[v0] Converted to data URI, length:", imageUrl.length)
          } catch (dataUriError) {
            console.error("[v0] Data URI conversion failed:", dataUriError)
            toast({
              title: "Upload Failed",
              description: `Failed to process ${file.name}`,
              variant: "destructive",
            })
            continue
          }
        }

        if (imageUrl) {
          newImages.push(imageUrl)
        }
      }

      if (newImages.length > 0) {
        setCustomImages((prev) => [...prev, ...newImages])
        toast({
          title: "Images Added",
          description: `Added ${newImages.length} image${newImages.length > 1 ? "s" : ""} to your library`,
        })
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeCustomImage = (index: number) => {
    setCustomImages((prev) => prev.filter((_, i) => i !== index))
  }

  const addSinglePanel = (url: string, source: "main" | "transition" | "custom", originalIndex: number) => {
    const id = `single-${Date.now()}`
    setFinalPanels((prev) => [
      ...prev,
      {
        id,
        type: "single",
        imageUrl: url,
        source,
        originalIndex,
      },
    ])
  }

  const addTransitionSlot = () => {
    const id = `transition-${Date.now()}`
    setFinalPanels((prev) => [
      ...prev,
      {
        id,
        type: "transition",
      },
    ])
    setSelectingFor({ panelId: id, slot: "first" })
  }

  const setTransitionFrame = (panelId: string, slot: "first" | "last", url: string) => {
    setFinalPanels((prev) =>
      prev.map((p) => {
        if (p.id !== panelId || p.type !== "transition") return p

        if (slot === "first") {
          return { ...p, imageUrl: url }
        } else {
          return { ...p, linkedImageUrl: url }
        }
      }),
    )

    if (slot === "first") {
      setSelectingFor({ panelId, slot: "last" })
    } else {
      setSelectingFor(null)
    }
  }

  const removePanel = (id: string) => {
    setFinalPanels((prev) => prev.filter((p) => p.id !== id))
  }

  const movePanel = (index: number, direction: "up" | "down") => {
    setFinalPanels((prev) => {
      const newOrder = [...prev]
      const targetIndex = direction === "up" ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= newOrder.length) return prev
      ;[newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]]
      return newOrder
    })
  }

  const swapTransitionFrames = (panelId: string) => {
    setFinalPanels((prev) =>
      prev.map((p) => {
        if (p.id === panelId && p.type === "transition" && p.imageUrl && p.linkedImageUrl) {
          return {
            ...p,
            imageUrl: p.linkedImageUrl,
            linkedImageUrl: p.imageUrl,
          }
        }
        return p
      }),
    )
  }

  const regeneratePanel = async (index: number) => {
    setRegenerating((prev) => [...prev, index])

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

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        if (data.url) {
          setLocalPanels((prev) => {
            const updated = [...prev]
            updated[index] = data.url
            return updated
          })
        }
      }
    } catch (e) {
      console.error(`Panel ${index + 1} regeneration error:`, e)
    } finally {
      setRegenerating((prev) => prev.filter((i) => i !== index))
    }
  }

  const handleConfirm = () => {
    const selectedPanels: string[] = []
    const linkedData: Record<number, string> = {}
    const promptsData: Record<number, string> = {}
    const durationsData: Record<number, number> = {}
    const videoUrlsData: Record<number, string> = {}

    finalPanels.forEach((panel, index) => {
      if (panel.type === "transition") {
        if (!panel.imageUrl || !panel.linkedImageUrl) {
          toast({
            title: "Incomplete Transition",
            description: `Transition ${index + 1} needs both start and end frames`,
            variant: "destructive",
          })
          return
        }
        selectedPanels.push(panel.imageUrl)
        linkedData[index] = panel.linkedImageUrl
        if (panel.prompt) {
          promptsData[index] = panel.prompt
        }
        if (panel.duration) {
          durationsData[index] = panel.duration
        }
        if (panel.videoUrl) {
          videoUrlsData[index] = panel.videoUrl
        }
      } else {
        if (!panel.imageUrl) return
        selectedPanels.push(panel.imageUrl)
        if (panel.prompt) {
          promptsData[index] = panel.prompt
        }
        if (panel.duration) {
          durationsData[index] = panel.duration
        }
        if (panel.videoUrl) {
          videoUrlsData[index] = panel.videoUrl
        }
      }
    })

    if (selectedPanels.length === 0) {
      toast({
        title: "No Panels Selected",
        description: "Please add panels to your sequence before continuing",
        variant: "destructive",
      })
      return
    }

    onConfirm(selectedPanels, linkedData, promptsData, durationsData, videoUrlsData)
  }

  const loadDemoSequence = () => {
    const demoFinalPanels: FinalPanel[] = DEMO_FINAL_SEQUENCE.panels.map((demoPanel) => {
      if (demoPanel.linkedImageUrl) {
        const panel: FinalPanel = {
          id: Math.random().toString(36).substring(7),
          type: "transition",
          imageUrl: demoPanel.imageUrl,
          linkedImageUrl: demoPanel.linkedImageUrl,
          prompt: demoPanel.prompt,
          duration: demoPanel.duration,
          videoUrl: demoPanel.videoUrl,
        }
        return panel
      } else {
        const panel: FinalPanel = {
          id: Math.random().toString(36).substring(7),
          type: "single",
          imageUrl: demoPanel.imageUrl,
          prompt: demoPanel.prompt,
          duration: demoPanel.duration,
          videoUrl: demoPanel.videoUrl,
        }
        return panel
      }
    })

    setFinalPanels(demoFinalPanels)
    toast({
      title: "Demo Loaded",
      description: `Loaded ${demoFinalPanels.length} demo panels with videos`,
    })
  }

  const allAvailablePanels = [
    ...localPanels.map((url, i) => ({ url, source: "main" as const, index: i })),
    ...transitionPanels.map((url, i) => ({ url, source: "transition" as const, index: i })),
    ...customImages.map((url, i) => ({ url, source: "custom" as const, index: i })),
  ]

  return (
    <Card className="border-white/10 bg-black/40 backdrop-blur-sm shadow-2xl space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Build Your Final Storyboard</CardTitle>
        <CardDescription className="text-muted-foreground">
          Click panels to add them, or add a transition slot and populate it with any two images.
        </CardDescription>
        <details className="mt-3 text-xs bg-secondary/50 border border-border rounded-lg">
          <summary className="px-3 py-2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="font-medium">Content Guidelines</span>
          </summary>
          <div className="px-3 pb-3 text-muted-foreground">
            Avoid using copyrighted movie titles, character names, or trademarked content in your prompts. The AI
            content moderation may flag references like "Ratatouille", "Star Wars", etc. Instead, use generic
            descriptions like "animated chef story" or "space adventure".
          </div>
        </details>
      </CardHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6">
        {/* Left: Available Panels */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold mb-4">Available Images</h3>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-zinc-300 mb-2">Main Storyboard</h4>
                <div className="grid grid-cols-3 gap-3">
                  {localPanels.map((url, i) => {
                    const isRegenerating = regenerating.includes(i)

                    return (
                      <div
                        key={`main-${i}`}
                        className="group relative aspect-video rounded-lg overflow-hidden transition-all duration-200 cursor-pointer hover:ring-2 hover:ring-blue-400"
                        onClick={() => {
                          if (selectingFor) {
                            setTransitionFrame(selectingFor.panelId, selectingFor.slot, url)
                          } else {
                            addSinglePanel(url, "main", i)
                          }
                        }}
                      >
                        <Image src={url || "/placeholder.svg"} alt={`Panel ${i + 1}`} fill className="object-cover" />

                        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              regeneratePanel(i)
                            }}
                            disabled={isRegenerating}
                            className="h-6 text-xs"
                          >
                            {isRegenerating ? (
                              <Repeat className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <X className="w-3 h-3 mr-1" />
                            )}
                            Retry
                          </Button>
                        </div>

                        <div className="absolute bottom-2 right-2">
                          <span className="text-xs font-mono text-white bg-black/60 px-2 py-1 rounded">M{i + 1}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {transitionPanels.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-emerald-300 mb-2">Transition Frames</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {transitionPanels.map((url, i) => (
                      <div
                        key={`trans-${i}`}
                        className="group relative aspect-video rounded-lg overflow-hidden transition-all duration-200 cursor-pointer hover:ring-2 hover:ring-emerald-400"
                        onClick={() => {
                          if (selectingFor) {
                            setTransitionFrame(selectingFor.panelId, selectingFor.slot, url)
                          } else {
                            addSinglePanel(url, "transition", i)
                          }
                        }}
                      >
                        <Image
                          src={url || "/placeholder.svg"}
                          alt={`Transition ${i + 1}`}
                          fill
                          className="object-cover"
                        />

                        <div className="absolute bottom-2 right-2">
                          <span className="text-xs font-mono text-white bg-emerald-600/80 px-2 py-1 rounded">
                            T{i + 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Images */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-violet-300">Additional Images</h4>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="h-7 text-xs text-violet-400 border-violet-400/30 bg-transparent hover:bg-violet-950/50"
                  >
                    {isUploading ? (
                      <>
                        <Repeat className="w-3 h-3 animate-spin mr-1" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3 h-3 mr-1" />
                        Upload Images
                      </>
                    )}
                  </Button>
                </div>

                {customImages.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {customImages.map((url, i) => (
                      <div
                        key={`custom-${i}`}
                        className="group relative aspect-video rounded-lg overflow-hidden transition-all duration-200 cursor-pointer hover:ring-2 hover:ring-violet-400"
                        onClick={() => {
                          if (selectingFor) {
                            setTransitionFrame(selectingFor.panelId, selectingFor.slot, url)
                          } else {
                            addSinglePanel(url, "custom", i)
                          }
                        }}
                      >
                        <Image src={url || "/placeholder.svg"} alt={`Custom ${i + 1}`} fill className="object-cover" />

                        {/* Remove button */}
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeCustomImage(i)
                            }}
                            className="h-5 w-5 p-0 bg-red-500/80 hover:bg-red-500"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="absolute bottom-2 right-2">
                          <span className="text-xs font-mono text-white bg-violet-600/80 px-2 py-1 rounded">
                            C{i + 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-violet-800/40 rounded-lg gap-2 cursor-pointer hover:border-violet-600/60 hover:bg-violet-950/20 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="w-6 h-6 text-violet-500/60" />
                    <p className="text-violet-400/60 text-xs">Click to upload custom images</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Final Sequence */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Final Sequence ({finalPanels.length})</h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={loadDemoSequence}
                className="text-violet-400 border-violet-400/30 bg-transparent"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Load Demo
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={addTransitionSlot}
                className="text-emerald-400 border-emerald-400/30 bg-transparent"
                title="Add a start→end keyframe pair for motion, transitions, or any A-to-B animation"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Keyframe Pair
              </Button>
            </div>
          </div>

          <div className="space-y-3 min-h-[400px]">
            {finalPanels.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-zinc-700 rounded-lg gap-4">
                <p className="text-zinc-500 text-sm">Click panels to build your sequence</p>
                <p className="text-zinc-600 text-xs">or add a keyframe pair for start→end animations</p>
              </div>
            ) : (
              finalPanels.map((panel, index) => (
                <div
                  key={panel.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    panel.type === "transition"
                      ? "bg-emerald-950/20 border-emerald-800/30"
                      : "bg-zinc-900 border-zinc-800"
                  }`}
                >
                  {/* Move buttons */}
                  <div className="flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => movePanel(index, "up")}
                      disabled={index === 0}
                      className="h-6 w-6 p-0"
                    >
                      <MoveUp className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => movePanel(index, "down")}
                      disabled={index === finalPanels.length - 1}
                      className="h-6 w-6 p-0"
                    >
                      <MoveDown className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Position */}
                  <div className="text-sm font-mono text-zinc-400 min-w-[2ch]">{index + 1}</div>

                  {panel.type === "single" && panel.imageUrl ? (
                    <div className="flex gap-2 flex-1 items-center">
                      <div className="relative w-32 aspect-video rounded overflow-hidden">
                        <Image
                          src={panel.imageUrl || "/placeholder.svg"}
                          alt={`Panel ${panel.originalIndex! + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Single
                      </Badge>
                    </div>
                  ) : panel.type === "transition" ? (
                    <div className="flex gap-2 flex-1 items-center">
                      {/* Start Frame Slot */}
                      <div
                        className={`relative w-24 aspect-video rounded overflow-hidden border-2 ${
                          panel.imageUrl ? "border-emerald-500" : "border-dashed border-zinc-600"
                        } cursor-pointer hover:border-emerald-400 transition-colors`}
                        onClick={() => setSelectingFor({ panelId: panel.id, slot: "first" })}
                      >
                        {panel.imageUrl ? (
                          <>
                            <Image
                              src={panel.imageUrl || "/placeholder.svg"}
                              alt="Start frame"
                              fill
                              className="object-cover"
                            />
                            <Badge className="absolute top-1 left-1 h-4 text-[10px] bg-emerald-500 text-black">
                              START
                            </Badge>
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-full text-zinc-500 text-xs">
                            Select Start
                          </div>
                        )}
                      </div>

                      <div className="text-emerald-400">→</div>

                      {/* End Frame Slot */}
                      <div
                        className={`relative w-24 aspect-video rounded overflow-hidden border-2 ${
                          panel.linkedImageUrl ? "border-emerald-500" : "border-dashed border-zinc-600"
                        } cursor-pointer hover:border-emerald-400 transition-colors`}
                        onClick={() => setSelectingFor({ panelId: panel.id, slot: "last" })}
                      >
                        {panel.linkedImageUrl ? (
                          <>
                            <Image
                              src={panel.linkedImageUrl || "/placeholder.svg"}
                              alt="End frame"
                              fill
                              className="object-cover"
                            />
                            <Badge className="absolute top-1 left-1 h-4 text-[10px] bg-emerald-500 text-black">
                              END
                            </Badge>
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-full text-zinc-500 text-xs">
                            Select End
                          </div>
                        )}
                      </div>

                      {/* Swap button (only if both frames set) */}
                      {panel.imageUrl && panel.linkedImageUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => swapTransitionFrames(panel.id)}
                          className="h-7 text-xs"
                          title="Swap start/end order"
                        >
                          ⇄
                        </Button>
                      )}

                      <Badge
                        variant="outline"
                        className="text-xs text-emerald-400 border-emerald-400/30 cursor-help"
                        title="Start→End animation: pans, zooms, morphs, transitions, or any motion between two frames"
                      >
                        Start → End
                      </Badge>
                    </div>
                  ) : null}

                  {/* Remove button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removePanel(panel.id)}
                    className="h-7 w-7 p-0 text-zinc-400 hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8 border-t border-zinc-800">
        <Button
          size="lg"
          onClick={handleConfirm}
          disabled={finalPanels.length === 0}
          className="bg-white text-black hover:bg-zinc-200 min-w-[200px]"
        >
          <Play className="w-4 h-4 mr-2" />
          Continue with {finalPanels.length} Panels
        </Button>
      </div>
    </Card>
  )
}
