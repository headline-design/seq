"use client"

import type React from "react"
import { memo, useState, useRef, useCallback, useEffect } from "react"
import { MagicIcon, PanelLeftClose, ChevronDownIcon, ChevronRightIcon } from "./icons"
import { Upload, X, Clock, Trash2, GripVertical, Wand2, Copy, Check } from "lucide-react"
import { VIDEO_MODELS } from "../constants"
import { useToastContext } from "@/seq/components/ui/sonner"

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
    <div className="border border-neutral-800 rounded-lg">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-neutral-900/50 hover:bg-neutral-800/50 transition-colors rounded-t-lg"
      >
        <span className="text-xs font-medium text-neutral-300">{title}</span>
        {isOpen ? (
          <ChevronDownIcon className="w-3.5 h-3.5 text-neutral-500" />
        ) : (
          <ChevronRightIcon className="w-3.5 h-3.5 text-neutral-500" />
        )}
      </button>
      {isOpen && <div className="p-3 space-y-3 bg-neutral-950/30 rounded-b-lg">{children}</div>}
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
              ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
              : "bg-neutral-900/50 border-neutral-700 text-neutral-400 hover:border-neutral-600 hover:text-neutral-300"
          }`}
        >
          <div
            className={`flex items-center justify-center ${
              ratio.value === "16:9" ? "w-10 h-6" : ratio.value === "9:16" ? "w-6 h-10" : "w-8 h-8"
            } rounded border ${
              value === ratio.value ? "border-indigo-400 bg-indigo-500/30" : "border-neutral-600 bg-neutral-800"
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
          ? "bg-indigo-600/20 border-indigo-500"
          : "bg-neutral-900/50 border-neutral-700 hover:border-neutral-600"
      }`}
    >
      <div
        className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
          selected ? "border-indigo-400" : "border-neutral-600"
        }`}
      >
        {selected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${selected ? "text-indigo-300" : "text-neutral-300"}`}>{name}</span>
          {badge && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {badge}
            </span>
          )}
        </div>
        <span className="text-[10px] text-neutral-500">{description}</span>
      </div>
    </button>
  )
})

const STYLE_PRESETS = [
  { id: "cinematic", label: "Cinematic", prefix: "Cinematic shot, dramatic lighting, film grain, " },
  { id: "anime", label: "Anime", prefix: "Anime style, vibrant colors, detailed illustration, " },
  { id: "realistic", label: "Realistic", prefix: "Photorealistic, high detail, natural lighting, " },
  { id: "3d", label: "3D Render", prefix: "3D render, octane render, highly detailed, " },
  { id: "abstract", label: "Abstract", prefix: "Abstract art, flowing shapes, vibrant colors, " },
]

const HistoryItem = memo(function HistoryItem({
  item,
  onUsePrompt,
  onAddToTimeline,
  onDelete,
}: {
  item: GeneratedItem
  onUsePrompt: (prompt: string) => void
  onAddToTimeline?: (url: string, type: "video" | "image") => void
  onDelete: (id: string) => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(item.prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [item.prompt])

  return (
    <div className="group relative bg-neutral-900/50 rounded-lg border border-neutral-800 overflow-hidden hover:border-neutral-700 transition-colors">
      <div className="aspect-video relative">
        {item.type === "video" ? (
          <video src={item.url} className="w-full h-full object-cover" muted />
        ) : (
          <img src={item.url || "/placeholder.svg"} alt={item.prompt} className="w-full h-full object-cover" />
        )}
        {/* Drag handle overlay */}
        {onAddToTimeline && (
          <div
            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/json", JSON.stringify({ url: item.url, type: item.type }))
            }}
            onClick={() => onAddToTimeline(item.url, item.type)}
          >
            <div className="flex flex-col items-center gap-1 text-white">
              <GripVertical className="w-5 h-5" />
              <span className="text-[10px]">Drag to timeline</span>
            </div>
          </div>
        )}
        {/* Type badge */}
        <div className="absolute top-1.5 left-1.5">
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
              item.type === "video" ? "bg-indigo-500/80 text-white" : "bg-blue-500/80 text-white"
            }`}
          >
            {item.type.toUpperCase()}
          </span>
        </div>
      </div>
      <div className="p-2 space-y-1.5">
        <p className="text-[10px] text-neutral-400 line-clamp-2">{item.prompt}</p>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-neutral-600">
            {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors"
              title="Copy prompt"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            </button>
            <button
              onClick={() => onUsePrompt(item.prompt)}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors"
              title="Use prompt"
            >
              <Wand2 className="w-3 h-3" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-1 rounded hover:bg-red-500/20 text-neutral-500 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

const IMAGE_MODELS = [
  { id: "google/gemini-3-pro-image", name: "Gemini 3 Pro", description: "Best quality" },
  { id: "fal-ai/flux/schnell", name: "FLUX Schnell", description: "Fast generation" },
  { id: "fal-ai/flux/dev", name: "FLUX Dev", description: "High quality" },
]

export const CreatePanel = memo(function CreatePanel({
  onGenerate,
  isGenerating,
  onClose,
  generatedItem,
  onAddToTimeline,
}: CreatePanelProps) {
  const [activeTab, setActiveTab] = useState<"video" | "image">("video")
  const [prompt, setPrompt] = useState("")
  const [aspectRatio, setAspectRatio] = useState("16:9")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [videoModel, setVideoModel] = useState("fal-ai/minimax-video")
  const [imageModel, setImageModel] = useState("google/gemini-3-pro-image")
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [history, setHistory] = useState<GeneratedItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prevGeneratedRef = useRef<typeof generatedItem>(null)
 const { toast } = useToastContext()

  useEffect(() => {
    if (generatedItem && generatedItem !== prevGeneratedRef.current && prompt.trim()) {
      const newItem: GeneratedItem = {
        id: Date.now().toString(),
        url: generatedItem.url,
        type: generatedItem.type,
        prompt: prompt,
        timestamp: Date.now(),
        aspectRatio,
        model: activeTab === "video" ? videoModel : imageModel,
      }
      setHistory((prev) => [newItem, ...prev].slice(0, 10)) // Keep last 10
      setPrompt("")
      prevGeneratedRef.current = generatedItem
    }
  }, [generatedItem, prompt, aspectRatio, activeTab, videoModel, imageModel])

  const handleEnhancePrompt = useCallback(async () => {
    if (!prompt.trim() || isEnhancing) return
    setIsEnhancing(true)
    try {
      const response = await fetch("/api/seq/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, type: activeTab }),
      })
      if (response.ok) {
        const data = await response.json()
        setPrompt(data.enhancedPrompt || prompt)
       toast.success("Prompt enhanced successfully")
      } else {
       toast.error("Failed to enhance prompt")
      }
    } catch (err) {
      console.error("Failed to enhance prompt:", err)
      toast.error("Failed to enhance prompt")
    } finally {
      setIsEnhancing(false)
    }
  }, [prompt, activeTab, isEnhancing, toast])

  const handleApplyPreset = useCallback((prefix: string) => {
    setPrompt((prev) => prefix + prev)
  }, [])

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setSelectedImage(result)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (prompt.trim()) {
        const model = activeTab === "video" ? videoModel : imageModel
        onGenerate(prompt, aspectRatio, activeTab, model, selectedImage || undefined)
      }
    },
    [prompt, activeTab, videoModel, imageModel, aspectRatio, selectedImage, onGenerate],
  )

  const handleDeleteHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const handleUsePrompt = useCallback((promptText: string) => {
    setPrompt(promptText)
  }, [])

  const currentModels = activeTab === "video" ? VIDEO_MODELS : IMAGE_MODELS
  const currentModel = activeTab === "video" ? videoModel : imageModel
  const setCurrentModel = activeTab === "video" ? setVideoModel : setImageModel

  return (
    <div className="w-full flex flex-col bg-[#09090b] border-r border-neutral-800 h-full">
      {/* Header */}
      <div className="h-14 flex items-center px-4 justify-between shrink-0 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-neutral-200">Create</h2>
        </div>
        <button
          className="p-1.5 rounded hover:bg-neutral-800 cursor-pointer text-neutral-500 hover:text-neutral-300 transition-colors"
          onClick={onClose}
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center p-2 gap-1 border-b border-neutral-800">
        {(["video", "image"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all ${
              activeTab === tab
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50"
            }`}
          >
            {tab === "video" ? "Video" : "Image"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-3">
        {/* Prompt Section */}
        <Section title="Prompt" defaultOpen={true}>
          <div className="space-y-2">
            <div className="relative">
              <textarea
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 pr-10 text-[13px] text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 min-h-[100px] resize-none transition-all"
                placeholder={
                  activeTab === "video"
                    ? "Describe the video you want to generate..."
                    : "Describe the image you want to generate..."
                }
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
              />
              <button
                type="button"
                onClick={handleEnhancePrompt}
                disabled={!prompt.trim() || isEnhancing}
                className="absolute right-2 top-2 p-1.5 rounded-md bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Enhance prompt with AI"
              >
                {isEnhancing ? (
                  <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
              </button>
            </div>
            {/* Style presets */}
            <div className="flex flex-wrap gap-1.5">
              {STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset.prefix)}
                  className="text-[10px] px-2 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 border border-neutral-700 hover:border-neutral-600 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Model Section */}
        <Section title="Model" defaultOpen={true}>
          <div className="space-y-2">
            {currentModels.map((model) => (
              <ModelCard
                key={model.id}
                id={model.id}
                name={model.name}
                description={model.description}
                selected={currentModel === model.id}
                onClick={() => setCurrentModel(model.id)}
                badge={model.id.includes("minimax") || model.id.includes("schnell") ? "FAST" : undefined}
              />
            ))}
          </div>
        </Section>

        {/* Aspect Ratio Section */}
        <Section title="Aspect Ratio" defaultOpen={true}>
          <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} />
        </Section>

        {/* Reference Image Section */}
        <Section title="Reference Image (Optional)" defaultOpen={false}>
          {!selectedImage ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full border border-dashed border-neutral-700 rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-neutral-800/50 hover:border-neutral-600 transition-all group"
            >
              <div className="p-2.5 rounded-full bg-neutral-800 group-hover:bg-neutral-700 transition-colors">
                <Upload className="w-5 h-5 text-neutral-400 group-hover:text-neutral-300" />
              </div>
              <span className="text-xs text-neutral-500 group-hover:text-neutral-400">Click to upload</span>
              <span className="text-[10px] text-neutral-600">PNG, JPG up to 10MB</span>
            </div>
          ) : (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-neutral-700 group">
              <img src={selectedImage || "/placeholder.svg"} alt="Input" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={handleRemoveImage}
                  className="p-2 rounded-full bg-neutral-800/80 hover:bg-red-500/20 text-white hover:text-red-400 border border-white/10 hover:border-red-500/50 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
        </Section>

        {/* Generate Button */}
        <form onSubmit={handleSubmit}>
          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium text-sm transition-all ${
              isGenerating || !prompt.trim()
                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-900/25 hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <MagicIcon className="w-4 h-4" />
                <span>Generate {activeTab === "video" ? "Video" : "Image"}</span>
              </>
            )}
          </button>
        </form>

        {/* Generation Note */}
        <div className="flex items-start gap-2 p-3 bg-neutral-900/50 border border-neutral-800 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-neutral-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            {activeTab === "video"
              ? "Video generation takes 30-90 seconds depending on model and complexity."
              : "Image generation takes 5-15 seconds."}
          </p>
        </div>

        {/* History Section */}
        {history.length > 0 && (
          <Section title={`History (${history.length})`} defaultOpen={true}>
            <div className="grid grid-cols-2 gap-2">
              {history.map((item) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  onUsePrompt={handleUsePrompt}
                  onAddToTimeline={onAddToTimeline}
                  onDelete={handleDeleteHistory}
                />
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
})

CreatePanel.displayName = "CreatePanel"
