"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useMobile } from "@/seq/hooks/use-mobile"
import { useImageUpload } from "./hooks/use-image-upload"
import { useImageGeneration } from "./hooks/use-image-generation"
import { useAspectRatio } from "./hooks/use-aspect-ratio"
import { HowItWorksModal } from "./how-it-works-modal"
import { usePersistentHistory } from "./hooks/use-persistent-history"
import { InputSection } from "./input-section"
import { OutputSection } from "./output-section"
import { ToastNotification } from "./toast-notification"
import { GenerationHistory } from "./generation-history"
import { GlobalDropZone } from "./global-drop-zone"
import { FullscreenViewer } from "./fullscreen-viewer"
import { Badge } from "../ui/badge"

function EmptyFooterHistory() {
  return (
    <div className="flex flex-col items-center justify-center py-2 px-4 text-center">
      <h3 className="text-lg font-medium text-white mb-1">No Generations Yet</h3>
      <p className="text-sm text-neutral-400 max-w-sm">Start generating images to see them appear here.</p>
    </div>
  )
}

export function ImageCombiner() {
  const isMobile = useMobile()
  const [prompt, setPrompt] = useState("A beautiful landscape with mountains and a lake at sunset")
  const [useUrls, setUseUrls] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState("")
  const [mode, setMode] = useState<"simple" | "custom">("custom")
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const [dropZoneHover, setDropZoneHover] = useState<1 | 2 | null>(null)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [logoLoaded, setLogoLoaded] = useState(false)
  const [apiKeyMissing, setApiKeyMissing] = useState(false)

  const [leftWidth, setLeftWidth] = useState(50)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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

  const { aspectRatio, setAspectRatio, availableAspectRatios, detectAspectRatio } = useAspectRatio()

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
    onApiKeyMissing: () => setApiKeyMissing(true),
  })

  const selectedGeneration = persistedGenerations.find((g) => g.id === selectedGenerationId) || persistedGenerations[0]
  const isLoading = persistedGenerations.some((g) => g.status === "loading")
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
        const response = await fetch("/api/seq/check-api-key")
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
      link.download = `nano-banana-pro-${currentMode}-result.png`
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
      console.error("Error opening image:", error)
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
                if (blob) {
                  resolve(blob)
                } else {
                  reject(new Error("Failed to convert to blob"))
                }
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
      window.focus()

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
        if (canGenerate) {
          runGeneration()
        }
      }
    },
    [canGenerate, runGeneration],
  )

  const handleGlobalKeyboard = useCallback(
    (e: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isTyping = activeElement?.tagName === "TEXTAREA" || activeElement?.tagName === "INPUT"

      if ((e.metaKey || e.ctrlKey) && e.key === "c" && generatedImage && !e.shiftKey) {
        if (!isTyping) {
          e.preventDefault()
          copyImageToClipboard()
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "d" && generatedImage) {
        if (!isTyping) {
          e.preventDefault()
          downloadImage()
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "u" && generatedImage) {
        if (!isTyping) {
          e.preventDefault()
          loadGeneratedAsInput()
        }
      }
      if (e.key === "Escape" && showFullscreen) {
        closeFullscreen()
      }
      if (showFullscreen && (e.key === "ArrowLeft" || e.key === "ArrowRight") && !isTyping) {
        e.preventDefault()
        const completedGenerations = persistedGenerations.filter((g) => g.status === "complete" && g.imageUrl)
        if (completedGenerations.length <= 1) return

        const currentIndex = completedGenerations.findIndex((g) => g.imageUrl === fullscreenImageUrl)
        if (currentIndex === -1) return

        if (e.key === "ArrowLeft") {
          const prevIndex = currentIndex === 0 ? completedGenerations.length - 1 : currentIndex - 1
          setFullscreenImageUrl(completedGenerations[prevIndex].imageUrl!)
          setSelectedGenerationId(completedGenerations[prevIndex].id)
        } else if (e.key === "ArrowRight") {
          const nextIndex = currentIndex === completedGenerations.length - 1 ? 0 : currentIndex + 1
          setFullscreenImageUrl(completedGenerations[nextIndex].imageUrl!)
          setSelectedGenerationId(completedGenerations[nextIndex].id)
        }
      }
    },
    [
      generatedImage,
      showFullscreen,
      copyImageToClipboard,
      downloadImage,
      loadGeneratedAsInput,
      closeFullscreen,
      persistedGenerations,
      fullscreenImageUrl,
      setSelectedGenerationId,
    ],
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
                  showToast("Image replaced first slot", "success")
                }
              }
              return
            }
          }
        }

        const pastedText = e.clipboardData?.getData("text")
        if (!pastedText) return

        const urlPattern = /https?:\/\/[^\s]+/i
        const imagePattern = /\.(jpg|jpeg|png|gif|webp|bmp|svg)|format=(jpg|jpeg|png|gif|webp)/i

        const match = pastedText.match(urlPattern)
        if (match) {
          const url = match[0]
          if (imagePattern.test(url) || url.includes("/media/") || url.includes("/images/")) {
            e.preventDefault()
            const targetSlot = !image1Url ? 1 : !image2Url ? 2 : 1
            setUseUrls(true)
            setTimeout(() => {
              handleUrlChange(url, targetSlot)
              showToast(`Image URL pasted to ${targetSlot === 1 ? "first" : "second"} slot`, "success")
            }, 150)
          }
        }
      }
    },
    [image1, image2, image1Url, image2Url, handleImageUpload, handleUrlChange],
  )

  const handlePromptPaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const pastedText = e.clipboardData.getData("text")
      const urlPattern = /https?:\/\/[^\s]+/i
      const imagePattern = /\.(jpg|jpeg|png|gif|webp|bmp|svg)|format=(jpg|jpeg|png|gif|webp)/i

      const match = pastedText.match(urlPattern)
      if (match) {
        const url = match[0]
        if (imagePattern.test(url) || url.includes("/media/") || url.includes("/images/")) {
          e.preventDefault()
          if (!useUrls) {
            setUseUrls(true)
          }
          if (!image1Url) {
            handleUrlChange(url, 1)
            showToast("Image URL loaded into first slot", "success")
          } else if (!image2Url) {
            handleUrlChange(url, 2)
            showToast("Image URL loaded into second slot", "success")
          } else {
            handleUrlChange(url, 1)
            showToast("Image URL replaced first slot", "success")
          }
        }
      }
    },
    [useUrls, image1Url, image2Url, handleUrlChange],
  )

  const handleGlobalDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragCounter((prev) => prev + 1)
    const items = e.dataTransfer?.items
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === "file" && items[i].type.startsWith("image/")) {
          setIsDraggingOver(true)
          break
        }
      }
    }
  }, [])

  const handleGlobalDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy"
    }
  }, [])

  const handleGlobalDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    setDragCounter((prev) => {
      const newCount = prev - 1
      if (newCount <= 0) {
        setIsDraggingOver(false)
        return 0
      }
      return newCount
    })
  }, [])

  const handleGlobalDrop = useCallback(
    async (e: DragEvent | React.DragEvent, slot?: 1 | 2) => {
      e.preventDefault()
      setIsDraggingOver(false)
      setDragCounter(0)
      setDropZoneHover(null)

      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        const file = files[0]
        if (file.type.startsWith("image/")) {
          setUseUrls(false)
          const targetSlot = slot || 1
          await handleImageUpload(file, targetSlot)
          showToast(`Image dropped to ${targetSlot === 1 ? "first" : "second"} slot`, "success")
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
    setPrompt("")
    clearImage(1)
    clearImage(2)
    setTimeout(() => {
      promptTextareaRef.current?.focus()
    }, 0)
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

  return (
    <div className="h-screen bg-[var(--surface-0)] flex flex-col">
      {toast && <ToastNotification message={toast.message} type={toast.type as any} />}

      {isDraggingOver && (
        <GlobalDropZone dropZoneHover={dropZoneHover} onSetDropZoneHover={setDropZoneHover} onDrop={handleGlobalDrop} />
      )}

      <div
        ref={containerRef}
        className="flex-1 flex overflow-hidden"
        style={{ userSelect: isResizing ? "none" : "auto" }}
      >
        <div
          className="flex flex-col overflow-hidden bg-[var(--surface-1)]"
          style={{ width: `${leftWidth}%`, minWidth: "300px" }}
        >
          <div className="flex-shrink-0 h-16 px-4 flex items-center justify-between border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">

              <div className="flex items-center bg-[var(--surface-2)] rounded-lg p-0.5">
                <button
                  onClick={() => setMode("simple")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${mode === "simple" ? "bg-[var(--surface-3)] text-white" : "text-neutral-400 hover:text-neutral-200"
                    }`}
                >
                  Simple
                </button>
                <button
                  onClick={() => setMode("custom")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${mode === "custom" ? "bg-[var(--surface-3)] text-white" : "text-neutral-400 hover:text-neutral-200"
                    }`}
                >
                  Custom
                </button>
              </div>
              {apiKeyMissing && (
                <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                  API Key Missing
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs px-2 py-1">
                {currentMode === "text-to-image" ? "Text to Image" : "Image Editing"}
              </Badge>


            </div>
          </div>


          <>
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
              canGenerate={canGenerate as boolean}
              hasImages={hasImages as any}
              onGenerate={runGeneration}
              onClearAll={clearAll}
              onImageUpload={handleImageUpload}
              onUrlChange={handleUrlChange}
              onClearImage={clearImage}
              onKeyDown={handleKeyDown}
              onPromptPaste={handlePromptPaste}
              onImageFullscreen={openImageFullscreen}
              promptTextareaRef={promptTextareaRef}
              isAuthenticated={true}
              remaining={100}
              decrementOptimistic={() => { }}
              usageLoading={false}
              onShowAuthModal={() => { }}
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
          </>



        </div>

        <div
          className="relative w-1 cursor-col-resize flex-shrink-0 hover:bg-[var(--accent-hover)] transition-colors bg-[var(--border-default)]"
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
        />

        <div className="flex-1 flex flex-col overflow-hidden bg-[var(--surface-0)]" style={{ minWidth: "300px" }}>
          <div className="flex-shrink-0 h-16 px-4 flex items-center justify-between">
            <span className="text-base font-medium text-neutral-200">Output</span>
            {persistedGenerations.length > 0 && (
              <span className="text-xs text-neutral-400">
                {persistedGenerations.filter((g) => g.status === "complete").length} generated
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4 flex flex-col h-full">
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
              />
            </div>

          </div>
          {/* History Panel */}
          {persistedGenerations.length > 0 && (
            <div className="border-t border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-2 pt-4">


              <GenerationHistory
                generations={persistedGenerations}
                selectedId={selectedGenerationId}
                onSelect={setSelectedGenerationId}
                onDelete={deleteGeneration}
                onClear={clearHistory}
                isLoading={historyLoading}
                hasMore={hasMore}
                onLoadMore={loadMore}
                isLoadingMore={isLoadingMore}
                onImageFullscreen={openImageFullscreen}
                onCancel={cancelGeneration}
              />
            </div>
          )}
        </div>
      </div>

      {showFullscreen && fullscreenImageUrl && (
        <FullscreenViewer
          imageUrl={fullscreenImageUrl}
          generations={persistedGenerations}
          onClose={closeFullscreen}
          onNavigate={handleFullscreenNavigate}
        />
      )}

      {showHowItWorks && <HowItWorksModal open={showHowItWorks} onOpenChange={setShowHowItWorks} />}
    </div>
  )
}
