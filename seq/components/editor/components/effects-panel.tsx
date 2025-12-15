"use client"
import { memo, useCallback } from "react"
import type { TimelineClip, ClipEffects } from "../types"
import { RotateCcw } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/seq/components/ui/tooltip"

interface EffectsPanelProps {
  clip: TimelineClip | null
  onUpdateClip: (id: string, changes: Partial<TimelineClip>) => void
}

const DEFAULT_EFFECTS: ClipEffects = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  blur: 0,
  opacity: 100,
}

const EffectSlider = memo(function EffectSlider({
  label,
  value,
  min,
  max,
  defaultValue,
  unit = "",
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  defaultValue: number
  unit?: string
  onChange: (value: number) => void
}) {
  const percentage = ((value - min) / (max - min)) * 100
  const isModified = value !== defaultValue

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-neutral-500 uppercase font-medium">{label}</span>
        <span className={`text-[10px] font-mono ${isModified ? "text-indigo-400" : "text-neutral-600"}`}>
          {value > 0 && min < 0 ? "+" : ""}
          {value}
          {unit}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 bg-white/[0.06] rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none 
            [&::-webkit-slider-thumb]:w-3 
            [&::-webkit-slider-thumb]:h-3 
            [&::-webkit-slider-thumb]:bg-white 
            [&::-webkit-slider-thumb]:rounded-full 
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-webkit-slider-thumb]:hover:bg-indigo-400
            [&::-webkit-slider-thumb]:transition-colors"
          style={{
            background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${percentage}%, rgba(255,255,255,0.06) ${percentage}%, rgba(255,255,255,0.06) 100%)`,
          }}
        />
        {/* Center marker for bipolar sliders */}
        {min < 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-white/[0.15] pointer-events-none"
            style={{ left: `${((0 - min) / (max - min)) * 100}%` }}
          />
        )}
      </div>
    </div>
  )
})

export const EffectsPanel = memo<EffectsPanelProps>(function EffectsPanel({ clip, onUpdateClip }) {
  const effects = clip?.effects || DEFAULT_EFFECTS

  const updateEffect = useCallback(
    (key: keyof ClipEffects, value: number) => {
      if (!clip) return
      onUpdateClip(clip.id, {
        effects: {
          ...DEFAULT_EFFECTS,
          ...clip.effects,
          [key]: value,
        },
      })
    },
    [clip, onUpdateClip],
  )

  const resetEffects = useCallback(() => {
    if (!clip) return
    onUpdateClip(clip.id, { effects: undefined })
  }, [clip, onUpdateClip])

  const hasModifications =
    clip?.effects &&
    Object.entries(clip.effects).some(([key, value]) => value !== DEFAULT_EFFECTS[key as keyof ClipEffects])

  if (!clip) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 opacity-50">
        <p className="text-xs text-neutral-500">Select a video clip to adjust effects</p>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col gap-4">
        {/* Header with reset */}
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Color & Effects</h3>
          {hasModifications && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={resetEffects}
                  className="p-1.5 rounded hover:bg-white/[0.06] text-neutral-500 hover:text-white transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                Reset all effects
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Color Adjustments */}
        <div className="bg-[#18181b] rounded-lg border border-white/[0.06] p-3 flex flex-col gap-4">
          <span className="text-[9px] text-neutral-600 uppercase font-bold">Color</span>

          <EffectSlider
            label="Brightness"
            value={effects.brightness}
            min={-100}
            max={100}
            defaultValue={0}
            onChange={(v) => updateEffect("brightness", v)}
          />

          <EffectSlider
            label="Contrast"
            value={effects.contrast}
            min={-100}
            max={100}
            defaultValue={0}
            onChange={(v) => updateEffect("contrast", v)}
          />

          <EffectSlider
            label="Saturation"
            value={effects.saturation}
            min={-100}
            max={100}
            defaultValue={0}
            onChange={(v) => updateEffect("saturation", v)}
          />

          <EffectSlider
            label="Hue Rotate"
            value={effects.hue}
            min={-180}
            max={180}
            defaultValue={0}
            unit="°"
            onChange={(v) => updateEffect("hue", v)}
          />
        </div>

        {/* Effects */}
        <div className="bg-[#18181b] rounded-lg border border-white/[0.06] p-3 flex flex-col gap-4">
          <span className="text-[9px] text-neutral-600 uppercase font-bold">Effects</span>

          <EffectSlider
            label="Opacity"
            value={effects.opacity}
            min={0}
            max={100}
            defaultValue={100}
            unit="%"
            onChange={(v) => updateEffect("opacity", v)}
          />

          <EffectSlider
            label="Blur"
            value={effects.blur}
            min={0}
            max={20}
            defaultValue={0}
            unit="px"
            onChange={(v) => updateEffect("blur", v)}
          />
        </div>

        {/* Quick Presets */}
        <div className="flex flex-col gap-2">
          <span className="text-[9px] text-neutral-600 uppercase font-bold">Presets</span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { name: "Vivid", effects: { saturation: 30, contrast: 15 } },
              { name: "Muted", effects: { saturation: -30, contrast: -10 } },
              { name: "B&W", effects: { saturation: -100 } },
              { name: "Warm", effects: { hue: 15, saturation: 10 } },
              { name: "Cool", effects: { hue: -15, saturation: 10 } },
              { name: "Faded", effects: { contrast: -20, brightness: 10 } },
            ].map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  if (!clip) return
                  onUpdateClip(clip.id, {
                    effects: {
                      ...DEFAULT_EFFECTS,
                      ...preset.effects,
                    },
                  })
                }}
                className="py-2 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[10px] font-medium text-neutral-400 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.1] transition-all"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
})

EffectsPanel.displayName = "EffectsPanel"
