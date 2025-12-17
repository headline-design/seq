"use client"

import type React from "react"
import { memo, useState, useRef, useCallback, useEffect } from "react"
import { MagicIcon, ChevronDownIcon, ChevronRightIcon } from "./icons"
import { Upload, X, Clock, Trash2, GripVertical, Wand2, Copy, Check } from "lucide-react"
import { VIDEO_MODELS } from "../constants"
import { useToastContext } from "@/seq/components/ui/sonner"
import { PanelContainer, PanelHeader, PanelContent } from "./panel-primitives"

interface GeneratedItem {
  id: string
  url: string
  type: "video" | "image"
  prompt: string
  timestamp: number
  aspectRatio: string
  model: string
}

interface CreatePanelProps {
  onGenerate: (prompt: string, aspectRatio: string, type: "video" | "image", model: string, image?: string) => void
  isGenerating: boolean
  onClose: () => void
  generatedItem: { url: string; type: "video" | "image" } | null
  onAddToTimeline?: (url: string, type: "video" | "image") => void
}

const Section = memo(function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-[var(--border-default)] rounded-lg">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-[var(--hover-overlay)] hover:bg-[var(--active-overlay)] transition-colors rounded-t-lg"
      >
        <span className="text-xs font-medium text-neutral-300">{title}</span>
        {isOpen ? (
          <ChevronDownIcon className="w-3.5 h-3.5 text-neutral-500" />
        ) : (
          <ChevronRightIcon className="w-3.5 h-3.5 text-neutral-500" />
        )}
      </button>
      {isOpen && <div className="p-3 space-y-3 bg-[var(--surface-0)]/30 rounded-b-lg">{children}</div>}
    </div>
  )
})

const AspectRatioSelector = memo(function AspectRatioSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const ratios = [
    { value: "16:9", label: "Landscape", icon: "▬" },
    { value: "9:16", label: "Portrait", icon: "▮" },
    { value: "1:1", label: "Square", icon: "◼" },
  ]

  return (
    <div className="grid grid-cols-3 gap-2">
      {ratios.map((ratio) => (
        <button
          key={ratio.value}
          type="button"
          onClick={() => onChange(ratio.value)}
          className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border transition-all ${
            value === ratio.value
              ? "bg-[var(--accent-bg-emphasis)] border-[var(--accent-primary)] text-[var(--accent-text)]"
              : "bg-[var(--hover-overlay)] border-[var(--border-default)] text-neutral-400 hover:border-[var(--border-strong)] hover:text-neutral-300"
          }`}
        >
          <div
            className={`flex items-center justify-center ${
              ratio.value === "16:9" ? "w-10 h-6" : ratio.value === "9:16" ? "w-6 h-10" : "w-8 h-8"
            } rounded border ${
              value === ratio.value
                ? "border-[var(--accent-text)] bg-[var(--accent-muted)]"
                : "border-[var(--border-strong)] bg-[var(--hover-overlay)]"
            }`}
          />
          <span className="text-[10px] font-medium">{ratio.label}</span>
          <span className="text-[10px] text-neutral-500">{ratio.value}</span>
        </button>
      ))}
    </div>
  )
})

const ModelCard = memo(function ModelCard({
  id,
  name,
  description,
  selected,
  onClick,
  badge,
}: {
  id: string
  name: string
  description: string
  selected: boolean
  onClick: () => void
  badge?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
        selected
          ? "bg-[var(--accent-bg-emphasis)] border-[var(--accent-primary)]"
          : "bg-[var(--hover-overlay)] border-[var(--border-default)] hover:border-[var(--border-strong)] hover:bg-[var(--active-overlay)]"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          selected ? "bg-[var(--accent-muted)]" : "bg-[var(--hover-overlay)]"
        }`}
      >
        <Wand2 className={`w-5 h-5 ${selected ? "text-[var(--accent-text)]" : "text-neutral-500"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${selected ? "text-[var(--accent-hover)]" : "text-neutral-300"}`}>
            {name}
          </span>
          {badge && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] text-neutral-500 truncate">{description}</p>
      </div>
      <div
        className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
          selected ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]" : "border-neutral-600"
        }`}
      >
        {selected && <Check className="w-2.5 h-2.5 text-white" />}
      </div>
    </button>
  )
})

const GenerationHistoryItem = memo(function GenerationHistoryItem({
  item,
  onUse,
  onDelete,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  item: GeneratedItem
  onUse: () => void
  onDelete: () => void
  isDragging?: boolean
  onDragStart?: () => void
  onDragEnd?: () => void
}) {
  const [showCopied, setShowCopied] = useState(false)

  const handleCopyPrompt = useCallback(() => {
    navigator.clipboard.writeText(item.prompt)
    setShowCopied(true)
    setTimeout(() => setShowCopied(false), 1500)
  }, [item.prompt])

  return (
    <div
      className={`group relative rounded-lg border transition-all ${
        isDragging ? "opacity-50 scale-95" : "opacity-100"
      } border-[var(--border-default)] bg-[var(--hover-overlay)] hover:bg-[var(--active-overlay)] hover:border-[var(--border-strong)]`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-3 p-2.5">
        {/* Drag Handle */}
        <div className="flex items-center cursor-grab active:cursor-grabbing text-neutral-600 hover:text-neutral-400 transition-colors">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Thumbnail */}
        <div className="relative w-16 h-12 rounded bg-black shrink-0 overflow-hidden border border-[var(--border-default)]">
          {item.type === "video" ? (
            <video src={item.url} className="w-full h-full object-cover" muted />
          ) : (
            <img src={item.url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <span className="absolute bottom-0.5 left-1 text-[8px] font-bold text-white/80 uppercase">
            {item.aspectRatio}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <p className="text-[11px] text-neutral-300 line-clamp-2 leading-tight">{item.prompt}</p>
          <div className="flex items-center gap-2 text-[10px] text-neutral-500">
            <Clock className="w-3 h-3" />
            <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
            <span className="text-neutral-700">•</span>
            <span className="truncate">{item.model}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopyPrompt}
            className="p-1.5 rounded bg-[var(--hover-overlay)] hover:bg-[var(--active-overlay)] text-neutral-400 hover:text-white transition-colors"
            title="Copy prompt"
          >
            {showCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded bg-[var(--hover-overlay)] hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Use Button - visible on hover */}
      <button
        onClick={onUse}
        className="absolute inset-x-0 bottom-0 py-1.5 bg-[var(--accent-primary)] text-accent-text-white text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg hover:bg-[var(--accent-hover)]"
      >
        Add to Timeline
      </button>
    </div>
  )
})

export const CreatePanel = memo(function CreatePanel({
  onGenerate,
  isGenerating,
  onClose,
  generatedItem,
  onAddToTimeline,
}: CreatePanelProps) {
  const [prompt, setPrompt] = useState("")
  const [aspectRatio, setAspectRatio] = useState("16:9")
  const [selectedModel, setSelectedModel] = useState<string>(VIDEO_MODELS[0].id)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [history, setHistory] = useState<GeneratedItem[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToastContext()

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("generation-history")
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch {}
    }
  }, [])

  // Save history when generatedItem changes
  useEffect(() => {
    if (generatedItem && prompt) {
      const newItem: GeneratedItem = {
        id: crypto.randomUUID(),
        url: generatedItem.url,
        type: generatedItem.type,
        prompt,
        timestamp: Date.now(),
        aspectRatio,
        model: selectedModel,
      }
      setHistory((prev) => {
        const updated = [newItem, ...prev].slice(0, 20) // Keep last 20
        localStorage.setItem("generation-history", JSON.stringify(updated))
        return updated
      })
    }
  }, [generatedItem])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!prompt.trim() || isGenerating) return
      onGenerate(prompt, aspectRatio, "video", selectedModel, imagePreview || undefined)
    },
    [prompt, aspectRatio, selectedModel, imagePreview, isGenerating, onGenerate],
  )

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast?.error("Please upload an image file")
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const clearImagePreview = useCallback(() => {
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const handleUseHistoryItem = useCallback(
    (item: GeneratedItem) => {
      onAddToTimeline?.(item.url, item.type)
    },
    [onAddToTimeline],
  )

  const handleDeleteHistoryItem = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id)
      localStorage.setItem("generation-history", JSON.stringify(updated))
      return updated
    })
  }, [])

  const currentModel = VIDEO_MODELS.find((m) => m.id === selectedModel)

  return (
    <PanelContainer>
      <PanelHeader title="Create" onClose={onClose}>
        {isGenerating && (
          <div className="flex items-center gap-2 px-2 py-1 bg-[var(--accent-muted)] rounded border border-[var(--accent-border)]">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-text)] animate-pulse" />
            <span className="text-[10px] font-medium text-[var(--accent-text)]">Generating...</span>
          </div>
        )}
      </PanelHeader>

      <PanelContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your video..."
              rows={3}
              className="w-full bg-[var(--surface-0)] border border-[var(--border-default)] rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-600 resize-none focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--focus-ring)]"
            />
          </div>

          {/* Aspect Ratio */}
          <Section title="Aspect Ratio">
            <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} />
          </Section>

          {/* Model Selection */}
          <Section title="Model">
            <div className="space-y-2">
              {VIDEO_MODELS.map((model) => (
                <ModelCard
                  key={model.id}
                  id={model.id}
                  name={model.name}
                  description={model.description}
                  badge={undefined}
                  selected={selectedModel === model.id}
                  onClick={() => setSelectedModel(model.id)}
                />
              ))}
            </div>
          </Section>

          {/* Image to Video (Optional) */}
          <Section title="Reference Image (Optional)" defaultOpen={false}>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border border-[var(--border-default)]">
                <img src={imagePreview || "/placeholder.svg"} alt="Reference" className="w-full h-32 object-cover" />
                <button
                  type="button"
                  onClick={clearImagePreview}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 border border-dashed border-[var(--border-strong)] rounded-lg flex flex-col items-center gap-2 text-neutral-400 hover:text-neutral-200 hover:border-[var(--border-emphasis)] hover:bg-[var(--hover-overlay)] transition-all"
              >
                <Upload className="w-5 h-5" />
                <span className="text-xs">Click to upload an image</span>
              </button>
            )}
          </Section>

          {/* Generate Button */}
          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm transition-all ${
              !prompt.trim() || isGenerating
                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                : "bg-[var(--accent-primary)] text-accent-text-white hover:bg-[var(--accent-hover)] shadow-lg shadow-[var(--accent-shadow)]"
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <MagicIcon className="w-4 h-4" />
                <span>Generate Video</span>
              </>
            )}
          </button>
        </form>

        {/* Generation History */}
        {history.length > 0 && (
          <div className="mt-6 pt-4 border-t border-[var(--border-default)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Recent Generations</h3>
              <button
                onClick={() => {
                  setHistory([])
                  localStorage.removeItem("generation-history")
                }}
                className="text-[10px] text-neutral-500 hover:text-red-400 transition-colors"
              >
                Clear All
              </button>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
              {history.map((item) => (
                <GenerationHistoryItem
                  key={item.id}
                  item={item}
                  onUse={() => handleUseHistoryItem(item)}
                  onDelete={() => handleDeleteHistoryItem(item.id)}
                  isDragging={draggingId === item.id}
                  onDragStart={() => setDraggingId(item.id)}
                  onDragEnd={() => setDraggingId(null)}
                />
              ))}
            </div>
          </div>
        )}
      </PanelContent>
    </PanelContainer>
  )
})

CreatePanel.displayName = "CreatePanel"
