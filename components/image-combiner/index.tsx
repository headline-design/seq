"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import Link from "next/link"
import { Film, Sparkles, Plus, Layers, ArrowUpRight } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { usePersistentHistory } from "./hooks/use-persistent-history"
import { useImageUpload } from "./hooks/use-image-upload"
import { useAspectRatio } from "./hooks/use-aspect-ratio"
import { useImageGeneration } from "./hooks/use-image-generation"
import { useToastContext } from "@/components/ui/sonner"
import { v4 as uuidv4 } from "uuid"
import { InputSection } from "./input-section"
import { OutputSection } from "./output-section"
import { GenerationHistory } from "./generation-history"
import { ToastNotification } from "./toast-notification"
import { GlobalDropZone } from "./global-drop-zone"
import { HowItWorksModal } from "./how-it-works-modal"
import { FullscreenViewer } from "./fullscreen-viewer"
import { ApiKeyWarning } from "./api-key-warning"
import type { StoryboardPanelData } from "@/components/storyboard/types"
import { Button } from "@/components/ui/button"
import { SeqLogo } from "@/components/ui/logo"

type AspectRatioKey = "1:1" | "16:9" | "9:16" | "4:3" | "3:4"

export function ImageCombiner() {
  const isMobile = useMobile()
  const { toast: toastCtx } = useToastContext()
  const [prompt, setPrompt] = useState("A beautiful landscape with mountains and a lake at sunset")
  const [useUrls, setUseUrls] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState("")
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const [dropZoneHover, setDropZoneHover] = useState<1 | 2 | null>(null)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [apiKeyMissing, setApiKeyMissing] = useState(false)
  const [showGenerator, setShowGenerator] = useState(false)

  const [storyboardPanels, setStoryboardPanels] = useState<StoryboardPanelData[]>([])

  const [leftWidth, setLeftWidth] = useState(50)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const generatorRef = useRef<HTMLDivElement>(null)

  const promptTextareaRef = useRef<HTMLTextAreaElement>(null)

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const {
    image1,
    image1Preview,
    image1Url,
    image2,
    image2Preview,
    image2Url,
    isConvertingHeic,
    heicProgress,
    handleImageUpload,
    handleUrlChange,
    clearImage,
    showToast: uploadShowToast,
  } = useImageUpload()

  const { aspectRatio, setAspectRatio, availableAspectRatios } = useAspectRatio()

  const {
    generations: persistedGenerations,
    setGenerations: setPersistedGenerations,
    addGeneration,
    clearHistory,
    deleteGeneration,
    isLoading: historyLoading,
    hasMore,
    loadMore,
    isLoadingMore,
  } = usePersistentHistory(showToast)

  const {
    selectedGenerationId,
    setSelectedGenerationId,
    imageLoaded,
    setImageLoaded,
    generateImage: runGeneration,
    cancelGeneration,
    loadGeneratedAsInput,
  } = useImageGeneration({
    prompt,
    aspectRatio,
    image1,
    image2,
    image1Url,
    image2Url,
    useUrls,
    generations: persistedGenerations,
    setGenerations: setPersistedGenerations,
    addGeneration,
    onToast: showToast,
    onImageUpload: handleImageUpload,
    onOutOfCredits: () => {},
    onApiKeyMissing: () => setApiKeyMissing(true),
  })

  const selectedGeneration = persistedGenerations.find((g) => g.id === selectedGenerationId) || persistedGenerations[0]
  const generatedImage =
    selectedGeneration?.status === "complete" && selectedGeneration.imageUrl
      ? { url: selectedGeneration.imageUrl, prompt: selectedGeneration.prompt }
      : null

  const hasImages = useUrls ? image1Url || image2Url : image1 || image2
  const currentMode = hasImages ? "image-editing" : "text-to-image"
  const canGenerate = prompt.trim().length > 0 && (currentMode === "text-to-image" || (useUrls ? image1Url : image1))

  useEffect(() => {
    if (selectedGeneration?.status === "complete" && selectedGeneration?.imageUrl) {
      setImageLoaded(false)
    }
  }, [selectedGenerationId, selectedGeneration?.imageUrl, setImageLoaded])

  useEffect(() => {
    uploadShowToast.current = showToast
  }, [uploadShowToast])

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const response = await fetch("/api/check-api-key")
        const data = await response.json()
        if (!data.configured) {
          setApiKeyMissing(true)
        }
      } catch (error) {
        console.error("Error checking API key:", error)
      }
    }
    checkApiKey()
  }, [])

  const scrollToGenerator = () => {
    setShowGenerator(true)
    setTimeout(() => {
      generatorRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const openFullscreen = useCallback(() => {
    if (generatedImage?.url) {
      setFullscreenImageUrl(generatedImage.url)
      setShowFullscreen(true)
      document.body.style.overflow = "hidden"
    }
  }, [generatedImage?.url])

  const openImageFullscreen = useCallback((imageUrl: string) => {
    setFullscreenImageUrl(imageUrl)
    setShowFullscreen(true)
    document.body.style.overflow = "hidden"
  }, [])

  const closeFullscreen = useCallback(() => {
    setShowFullscreen(false)
    setFullscreenImageUrl("")
    document.body.style.overflow = "unset"
  }, [])

  const downloadImage = useCallback(async () => {
    if (!generatedImage) return
    try {
      const response = await fetch(generatedImage.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `seq-${currentMode}-result.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading image:", error)
      window.open(generatedImage.url, "_blank")
    }
  }, [generatedImage, currentMode])

  const openImageInNewTab = useCallback(() => {
    if (!generatedImage?.url) return
    try {
      if (generatedImage.url.startsWith("data:")) {
        const parts = generatedImage.url.split(",")
        const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png"
        const bstr = atob(parts[1])
        const n = bstr.length
        const u8arr = new Uint8Array(n)
        for (let i = 0; i < n; i++) {
          u8arr[i] = bstr.charCodeAt(i)
        }
        const blob = new Blob([u8arr], { type: mime })
        const blobUrl = URL.createObjectURL(blob)
        const newWindow = window.open(blobUrl, "_blank", "noopener,noreferrer")
        if (newWindow) {
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000)
        }
      } else {
        window.open(generatedImage.url, "_blank", "noopener,noreferrer")
      }
    } catch (error) {
      window.open(generatedImage.url, "_blank")
    }
  }, [generatedImage])

  const copyImageToClipboard = useCallback(async () => {
    if (!generatedImage) return
    try {
      const convertToPngBlob = async (imageUrl: string): Promise<Blob> => {
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.onload = () => {
            const canvas = document.createElement("canvas")
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext("2d")
            if (!ctx) {
              reject(new Error("Failed to get canvas context"))
              return
            }
            ctx.drawImage(img, 0, 0)
            canvas.toBlob(
              (blob) => {
                if (blob) resolve(blob)
                else reject(new Error("Failed to convert to blob"))
              },
              "image/png",
              1.0,
            )
          }
          img.onerror = () => reject(new Error("Failed to load image"))
          img.src = imageUrl
        })
      }

      setToast({ message: "Copying image...", type: "success" })
      const pngBlob = await convertToPngBlob(generatedImage.url)
      const clipboardItem = new ClipboardItem({ "image/png": pngBlob })
      await navigator.clipboard.write([clipboardItem])
      setToast({ message: "Image copied to clipboard!", type: "success" })
      setTimeout(() => setToast(null), 2000)
    } catch (error) {
      console.error("Error copying image:", error)
      setToast({ message: "Failed to copy image", type: "error" })
      setTimeout(() => setToast(null), 2000)
    }
  }, [generatedImage])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        if (canGenerate) runGeneration()
      }
    },
    [canGenerate, runGeneration],
  )

  const handleGlobalKeyboard = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        if (canGenerate) runGeneration()
      }
    },
    [canGenerate, runGeneration],
  )

  const handleGlobalPaste = useCallback(
    async (e: ClipboardEvent) => {
      const activeElement = document.activeElement
      if (activeElement?.tagName !== "TEXTAREA" && activeElement?.tagName !== "INPUT") {
        const items = e.clipboardData?.items
        if (items) {
          for (let i = 0; i < items.length; i++) {
            const item = items[i]
            if (item.type.startsWith("image/")) {
              e.preventDefault()
              const file = item.getAsFile()
              if (file) {
                setUseUrls(false)
                if (!image1) {
                  await handleImageUpload(file, 1)
                  showToast("Image pasted successfully", "success")
                } else if (!image2) {
                  await handleImageUpload(file, 2)
                  showToast("Image pasted to second slot", "success")
                } else {
                  await handleImageUpload(file, 1)
                  showToast("Image replaced in first slot", "success")
                }
              }
              break
            }
          }
        }
      }
    },
    [image1, image2, handleImageUpload],
  )

  const handlePromptPaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = e.clipboardData?.items
      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          if (item.type.startsWith("image/")) {
            e.preventDefault()
            const file = item.getAsFile()
            if (file) {
              setUseUrls(false)
              if (!image1) {
                await handleImageUpload(file, 1)
                showToast("Image pasted successfully", "success")
              } else if (!image2) {
                await handleImageUpload(file, 2)
                showToast("Image pasted to second slot", "success")
              } else {
                await handleImageUpload(file, 1)
                showToast("Image replaced in first slot", "success")
              }
            }
            return
          }
        }
      }
    },
    [image1, image2, handleImageUpload],
  )

  const handleGlobalDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy"
    }
  }, [])

  const handleGlobalDragEnter = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragCounter((prev) => {
        const newCount = prev + 1
        if (newCount === 1) {
          const items = e.dataTransfer?.items
          if (items) {
            for (let i = 0; i < items.length; i++) {
              if (items[i].kind === "file" && items[i].type.startsWith("image/")) {
                setIsDraggingOver(true)
                break
              }
            }
          }
        }
        return newCount
      })
    },
    [setIsDraggingOver],
  )

  const handleGlobalDragLeave = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragCounter((prev) => {
        const newCount = prev - 1
        if (newCount === 0) {
          setIsDraggingOver(false)
          setDropZoneHover(null)
        }
        return newCount
      })
    },
    [setIsDraggingOver],
  )

  const handleGlobalDrop = useCallback(
    async (e: React.DragEvent, targetSlot: 1 | 2) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDraggingOver(false)
      setDragCounter(0)
      setDropZoneHover(null)

      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        const file = files[0]
        if (file.type.startsWith("image/") || file.name.toLowerCase().endsWith(".heic")) {
          setUseUrls(false)
          await handleImageUpload(file, targetSlot)
          showToast(`Image added to slot ${targetSlot}`, "success")
        }
      }
    },
    [handleImageUpload],
  )

  useEffect(() => {
    document.addEventListener("keydown", handleGlobalKeyboard)
    document.addEventListener("paste", handleGlobalPaste)
    document.addEventListener("dragover", handleGlobalDragOver)
    document.addEventListener("dragleave", handleGlobalDragLeave)
    document.addEventListener("dragenter", handleGlobalDragEnter)

    return () => {
      document.removeEventListener("keydown", handleGlobalKeyboard)
      document.removeEventListener("paste", handleGlobalPaste)
      document.removeEventListener("dragover", handleGlobalDragOver)
      document.removeEventListener("dragleave", handleGlobalDragLeave)
      document.removeEventListener("dragenter", handleGlobalDragEnter)
    }
  }, [handleGlobalKeyboard, handleGlobalPaste, handleGlobalDragOver, handleGlobalDragLeave, handleGlobalDragEnter])

  const clearAll = useCallback(() => {
    clearImage(1)
    clearImage(2)
    setPrompt("")
  }, [clearImage])

  const handleFullscreenNavigate = useCallback(
    (direction: "prev" | "next") => {
      const completedGenerations = persistedGenerations.filter((g) => g.status === "complete" && g.imageUrl)
      const currentIndex = completedGenerations.findIndex((g) => g.imageUrl === fullscreenImageUrl)
      if (currentIndex === -1) return
      let newIndex: number
      if (direction === "prev") {
        newIndex = currentIndex === 0 ? completedGenerations.length - 1 : currentIndex - 1
      } else {
        newIndex = currentIndex === completedGenerations.length - 1 ? 0 : currentIndex + 1
      }
      setFullscreenImageUrl(completedGenerations[newIndex].imageUrl!)
      setSelectedGenerationId(completedGenerations[newIndex].id)
    },
    [persistedGenerations, fullscreenImageUrl, setSelectedGenerationId],
  )

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return
      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      const offsetX = e.clientX - containerRect.left
      const percentage = (offsetX / containerRect.width) * 100
      const clampedPercentage = Math.max(30, Math.min(70, percentage))
      setLeftWidth(clampedPercentage)
    },
    [isResizing],
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  const handleDoubleClick = useCallback(() => {
    setLeftWidth(50)
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const handleAddToStoryboard = useCallback(
    (url: string) => {
      if (storyboardPanels.length >= 6) {
        toastCtx.error("Storyboard is full (max 6 panels)")
        return
      }
      const newPanel: StoryboardPanelData = {
        id: uuidv4(),
        imageUrl: url,
        prompt: "",
        isGenerating: false,
      }
      setStoryboardPanels((prev) => [...prev, newPanel])
      toastCtx.success("Added to storyboard!")
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
      }, 100)
    },
    [storyboardPanels.length, toastCtx],
  )

  return (
    <div className="bg-background min-h-screen select-none">
      {toast && <ToastNotification message={toast.message} type={toast.type} />}

      {isDraggingOver && (
        <GlobalDropZone dropZoneHover={dropZoneHover} onSetDropZoneHover={setDropZoneHover} onDrop={handleGlobalDrop} />
      )}

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <SeqLogo className="w-7 h-7 text-foreground" />
              <span className="text-foreground font-semibold text-lg tracking-tight">Seq</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/storyboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Storyboard
              </Link>
              <Link href="/timeline" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Timeline
              </Link>
              <button
                onClick={() => setShowHowItWorks(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                How it works
              </button>
            </div>
          </div>
          <Button
            onClick={scrollToGenerator}
            size="sm"
            className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-4"
          >
            Get Started
          </Button>
        </div>
      </nav>

      {/* Choose Your Adventure Section */}
      <section className="pt-24 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border text-sm text-muted-foreground mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Veo 3.1, Wan2.1 & Wan2.5</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 tracking-tight">
              What do you want to create?
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Choose your starting point and we'll guide you from there.
            </p>
          </div>

          {/* Adventure Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {/* Storyboard Path */}
            <Link
              href="/storyboard"
              className="group relative bg-card border border-border rounded-2xl p-6 hover:border-foreground/20 hover:bg-card/80 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                  <Film className="w-6 h-6 text-foreground" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Start with Storyboard</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Plan your sequence visually. Generate AI panels, arrange shots, add transitions, then convert to video.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground">AI Generation</span>
                <span className="px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground">Shot Planning</span>
                <span className="px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground">Transitions</span>
              </div>
            </Link>

            {/* Timeline Path */}
            <Link
              href="/timeline"
              className="group relative bg-card border border-border rounded-2xl p-6 hover:border-foreground/20 hover:bg-card/80 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                  <Layers className="w-6 h-6 text-foreground" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Jump to Timeline</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Already have clips? Drop them on the magnetic timeline to arrange, trim, and export your final sequence.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground">Drag & Drop</span>
                <span className="px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground">Magnetic Snap</span>
                <span className="px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground">Export</span>
              </div>
            </Link>
          </div>

          {/* Quick Action - Generate Panel */}
          <button
            onClick={scrollToGenerator}
            className="w-full group bg-secondary/50 border border-dashed border-border rounded-xl p-4 hover:border-foreground/30 hover:bg-secondary transition-all duration-200 flex items-center justify-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-background transition-colors">
              <Plus className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Or generate a quick panel below
            </span>
          </button>
        </div>
      </section>

      {/* Generator Section */}
      <section ref={generatorRef} className="relative px-4 py-16 border-t border-border">
        <div className="max-w-[98vw] lg:max-w-[96vw] 2xl:max-w-[94vw] mx-auto">
          <div className="bg-card border border-border rounded-2xl p-4 md:p-6 lg:p-8">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-1">Generate Storyboard Panels</h2>
                <p className="text-sm text-muted-foreground">Create AI-generated images for your video sequence</p>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  href="/storyboard"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  <Film className="w-4 h-4" />
                  Storyboard Editor
                </Link>
              </div>
            </div>

            {apiKeyMissing && <ApiKeyWarning />}

            {/* Generator Content */}
            <div className="flex flex-col gap-4 xl:gap-0">
              <div
                ref={containerRef}
                className="flex flex-col xl:flex-row gap-4 xl:gap-0 xl:min-h-[60vh] 2xl:min-h-[62vh]"
              >
                <div
                  className="flex flex-col xl:pr-4 xl:border-r xl:border-border flex-shrink-0 xl:overflow-y-auto xl:max-h-[85vh] 2xl:max-h-[80vh]"
                  style={{ width: isMobile ? "100%" : `${leftWidth}%` }}
                >
                  <InputSection
                    prompt={prompt}
                    setPrompt={setPrompt}
                    aspectRatio={aspectRatio}
                    setAspectRatio={setAspectRatio}
                    availableAspectRatios={availableAspectRatios}
                    useUrls={useUrls}
                    setUseUrls={setUseUrls}
                    image1Preview={image1Preview}
                    image2Preview={image2Preview}
                    image1Url={image1Url}
                    image2Url={image2Url}
                    isConvertingHeic={isConvertingHeic}
                    canGenerate={canGenerate}
                    hasImages={hasImages}
                    onGenerate={runGeneration}
                    onClearAll={clearAll}
                    onImageUpload={handleImageUpload}
                    onUrlChange={handleUrlChange}
                    onClearImage={clearImage}
                    onKeyDown={handleKeyDown}
                    onPromptPaste={handlePromptPaste}
                    onImageFullscreen={openImageFullscreen}
                    promptTextareaRef={promptTextareaRef}
                    generations={persistedGenerations}
                    selectedGenerationId={selectedGenerationId}
                    onSelectGeneration={setSelectedGenerationId}
                    onCancelGeneration={cancelGeneration}
                    onDeleteGeneration={deleteGeneration}
                    historyLoading={historyLoading}
                    hasMore={hasMore}
                    onLoadMore={loadMore}
                    isLoadingMore={isLoadingMore}
                  />

                  <div className="hidden xl:block mt-3 flex-shrink-0">
                    <GenerationHistory
                      generations={persistedGenerations}
                      selectedId={selectedGenerationId}
                      onSelect={setSelectedGenerationId}
                      onCancel={cancelGeneration}
                      onDelete={deleteGeneration}
                      isLoading={historyLoading}
                      hasMore={hasMore}
                      onLoadMore={loadMore}
                      isLoadingMore={isLoadingMore}
                    />
                  </div>
                </div>

                <div
                  className="hidden xl:flex items-center justify-center cursor-col-resize hover:bg-secondary/50 transition-colors relative group"
                  style={{ width: "8px", flexShrink: 0 }}
                  onMouseDown={handleMouseDown}
                  onDoubleClick={handleDoubleClick}
                >
                  <div className="w-0.5 h-8 bg-border group-hover:bg-muted-foreground transition-colors rounded-full" />
                </div>

                <div
                  className="flex flex-col xl:pl-4 h-[400px] sm:h-[500px] md:h-[600px] xl:h-auto flex-shrink-0"
                  style={{ width: isMobile ? "100%" : `${100 - leftWidth}%` }}
                >
                  <OutputSection
                    selectedGeneration={selectedGeneration}
                    generations={persistedGenerations}
                    selectedGenerationId={selectedGenerationId}
                    setSelectedGenerationId={setSelectedGenerationId}
                    isConvertingHeic={isConvertingHeic}
                    heicProgress={heicProgress}
                    imageLoaded={imageLoaded}
                    setImageLoaded={setImageLoaded}
                    onCancelGeneration={cancelGeneration}
                    onDeleteGeneration={deleteGeneration}
                    onOpenFullscreen={openFullscreen}
                    onLoadAsInput={loadGeneratedAsInput}
                    onCopy={copyImageToClipboard}
                    onDownload={downloadImage}
                    onOpenInNewTab={openImageInNewTab}
                    onAddToStoryboard={handleAddToStoryboard}
                  />
                </div>
              </div>

              <div className="xl:hidden flex-shrink-0">
                <GenerationHistory
                  generations={persistedGenerations}
                  selectedId={selectedGenerationId}
                  onSelect={setSelectedGenerationId}
                  onCancel={cancelGeneration}
                  onDelete={deleteGeneration}
                  isLoading={historyLoading}
                  hasMore={hasMore}
                  onLoadMore={loadMore}
                  isLoadingMore={isLoadingMore}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SeqLogo className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Seq</span>
          </div>
          <p className="text-xs text-muted-foreground">Powered by fal.ai</p>
        </div>
      </footer>

      <HowItWorksModal open={showHowItWorks} onOpenChange={setShowHowItWorks} />

      {showFullscreen && fullscreenImageUrl && (
        <FullscreenViewer
          imageUrl={fullscreenImageUrl}
          generations={persistedGenerations}
          onClose={closeFullscreen}
          onNavigate={handleFullscreenNavigate}
        />
      )}
    </div>
  )
}

export default ImageCombiner
