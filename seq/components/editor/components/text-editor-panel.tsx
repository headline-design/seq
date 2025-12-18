"use client"
import { memo } from "react"
import type { TimelineClip, TextOverlayStyle } from "../types"
import { Label } from "@/seq/components/ui/label"
import { Input } from "@/seq/components/ui/input"
import { Slider } from "@/seq/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/seq/components/ui/select"
import { Button } from "@/seq/components/ui/button"
import { Textarea } from "@/seq/components/ui/textarea"

interface TextEditorPanelProps {
  clip: TimelineClip
  onUpdateClip: (clipId: string, updates: Partial<TimelineClip>) => void
}

const FONT_OPTIONS = [
  { value: "Inter, sans-serif", label: "Inter" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Times New Roman, serif", label: "Times New Roman" },
  { value: "Courier New, monospace", label: "Courier New" },
  { value: "Impact, sans-serif", label: "Impact" },
  { value: "Comic Sans MS, cursive", label: "Comic Sans" },
]

const ANIMATION_OPTIONS = [
  { value: "none", label: "None" },
  { value: "fade-in", label: "Fade In" },
  { value: "fade-out", label: "Fade Out" },
  { value: "slide-up", label: "Slide Up" },
  { value: "slide-down", label: "Slide Down" },
  { value: "typewriter", label: "Typewriter" },
]

const PRESET_POSITIONS = [
  { label: "Top Left", x: 15, y: 15 },
  { label: "Top Center", x: 50, y: 15 },
  { label: "Top Right", x: 85, y: 15 },
  { label: "Center Left", x: 15, y: 50 },
  { label: "Center", x: 50, y: 50 },
  { label: "Center Right", x: 85, y: 50 },
  { label: "Bottom Left", x: 15, y: 85 },
  { label: "Bottom Center", x: 50, y: 85 },
  { label: "Bottom Right", x: 85, y: 85 },
]

export const TextEditorPanel = memo(function TextEditorPanel({ clip, onUpdateClip }: TextEditorPanelProps) {
  const textOverlay = clip.textOverlay

  if (!textOverlay) return null

  const updateTextOverlay = (updates: Partial<TextOverlayStyle>) => {
    onUpdateClip(clip.id, {
      textOverlay: { ...textOverlay, ...updates },
    })
  }

  return (
    <div className="space-y-4">
      {/* Text Content */}
      <div className="space-y-2">
        <Label className="text-xs text-[var(--text-muted)]">Text Content</Label>
        <Textarea
          value={textOverlay.text}
          onChange={(e) => updateTextOverlay({ text: e.target.value })}
          placeholder="Enter text..."
          className="h-20 text-sm bg-[var(--surface-0)] border-[var(--border-default)] resize-none"
        />
      </div>

      {/* Font Settings */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs text-[var(--text-muted)]">Font Family</Label>
          <Select value={textOverlay.fontFamily} onValueChange={(value) => updateTextOverlay({ fontFamily: value })}>
            <SelectTrigger className="h-8 text-xs bg-[var(--surface-0)] border-[var(--border-default)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((font) => (
                <SelectItem key={font.value} value={font.value} className="text-xs">
                  <span style={{ fontFamily: font.value }}>{font.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-[var(--text-muted)]">Font Size</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[textOverlay.fontSize]}
              onValueChange={([value]) => updateTextOverlay({ fontSize: value })}
              min={12}
              max={120}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-[var(--text-muted)] w-8">{textOverlay.fontSize}</span>
          </div>
        </div>
      </div>

      {/* Font Weight & Alignment */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs text-[var(--text-muted)]">Font Weight</Label>
          <Select
            value={String(textOverlay.fontWeight)}
            onValueChange={(value) => updateTextOverlay({ fontWeight: Number(value) as 400 | 500 | 600 | 700 | 800 })}
          >
            <SelectTrigger className="h-8 text-xs bg-[var(--surface-0)] border-[var(--border-default)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="400" className="text-xs">
                Normal (400)
              </SelectItem>
              <SelectItem value="500" className="text-xs">
                Medium (500)
              </SelectItem>
              <SelectItem value="600" className="text-xs">
                Semibold (600)
              </SelectItem>
              <SelectItem value="700" className="text-xs">
                Bold (700)
              </SelectItem>
              <SelectItem value="800" className="text-xs">
                Extra Bold (800)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-[var(--text-muted)]">Text Align</Label>
          <div className="flex gap-1.5">
            {(["left", "center", "right"] as const).map((align) => (
              <Button
                key={align}
                variant="outline"
                size="sm"
                onClick={() => updateTextOverlay({ textAlign: align })}
                className={`flex-1 h-8 ${
                  textOverlay.textAlign === align
                    ? "bg-[var(--tertiary-muted)] border-[var(--tertiary)] text-[var(--tertiary)]"
                    : "bg-[var(--hover-overlay)] border-[var(--border-default)] hover:bg-[var(--active-overlay)]"
                }`}
              >
                {align.charAt(0).toUpperCase() + align.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs text-[var(--text-muted)]">Text Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={textOverlay.color}
              onChange={(e) => updateTextOverlay({ color: e.target.value })}
              className="w-8 h-8 rounded border border-[var(--border-default)] cursor-pointer"
            />
            <Input
              value={textOverlay.color}
              onChange={(e) => updateTextOverlay({ color: e.target.value })}
              className="h-8 text-xs bg-[var(--surface-0)] border-[var(--border-default)] flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-[var(--text-muted)]">Background Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={textOverlay.backgroundColor}
              onChange={(e) => updateTextOverlay({ backgroundColor: e.target.value })}
              className="w-8 h-8 rounded border border-[var(--border-default)] cursor-pointer"
            />
            <Input
              value={textOverlay.backgroundColor}
              onChange={(e) => updateTextOverlay({ backgroundColor: e.target.value })}
              className="h-8 text-xs bg-[var(--surface-0)] border-[var(--border-default)] flex-1"
            />
          </div>
        </div>
      </div>

      {/* Background Opacity */}
      <div className="space-y-2">
        <Label className="text-xs text-[var(--text-muted)]">Background Opacity</Label>
        <div className="flex items-center gap-2">
          <Slider
            value={[textOverlay.backgroundOpacity]}
            onValueChange={([value]) => updateTextOverlay({ backgroundOpacity: value })}
            min={0}
            max={100}
            step={5}
            className="flex-1"
          />
          <span className="text-xs text-[var(--text-muted)] w-8">{textOverlay.backgroundOpacity}%</span>
        </div>
      </div>

      {/* Position */}
      <div className="space-y-2">
        <Label className="text-xs text-[var(--text-muted)]">Position</Label>
        <div className="grid grid-cols-3 gap-1">
          {PRESET_POSITIONS.map((pos) => (
            <Button
              key={pos.label}
              variant="outline"
              size="sm"
              className={`text-[10px] h-7 ${
                textOverlay.position.x === pos.x && textOverlay.position.y === pos.y
                  ? "bg-[var(--tertiary-muted)] border-[var(--tertiary)]"
                  : "bg-[var(--surface-0)] border-[var(--border-default)]"
              }`}
              onClick={() => updateTextOverlay({ position: { x: pos.x, y: pos.y } })}
            >
              {pos.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Custom Position */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs text-[var(--text-muted)]">X Position (%)</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[textOverlay.position.x]}
              onValueChange={([value]) => updateTextOverlay({ position: { ...textOverlay.position, x: value } })}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-[var(--text-muted)] w-8">{textOverlay.position.x}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-[var(--text-muted)]">Y Position (%)</Label>
          <div className="flex items-center gap-2">
            <Slider
              value={[textOverlay.position.y]}
              onValueChange={([value]) => updateTextOverlay({ position: { ...textOverlay.position, y: value } })}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-[var(--text-muted)] w-8">{textOverlay.position.y}</span>
          </div>
        </div>
      </div>

      {/* Animation */}
      <div className="space-y-2">
        <Label className="text-xs text-[var(--text-muted)]">Animation</Label>
        <Select
          value={textOverlay.animation}
          onValueChange={(value) => updateTextOverlay({ animation: value as TextOverlayStyle["animation"] })}
        >
          <SelectTrigger className="h-8 text-xs bg-[var(--surface-0)] border-[var(--border-default)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ANIMATION_OPTIONS.map((anim) => (
              <SelectItem key={anim.value} value={anim.value} className="text-xs">
                {anim.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
})
