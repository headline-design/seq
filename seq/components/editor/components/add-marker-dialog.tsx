"use client"

import { useState, useCallback } from "react"
import type { Marker } from "../types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/seq/components/ui/dialog"
import { Button } from "@/seq/components/ui/button"
import { Input } from "@/seq/components/ui/input"
import { Label } from "@/seq/components/ui/label"

interface AddMarkerDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (marker: Omit<Marker, "id">) => void
  time: number
}

const COLORS: Marker["color"][] = ["red", "orange", "yellow", "green", "blue", "purple", "pink"]

const COLOR_HEX: Record<Marker["color"], string> = {
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#a855f7",
  pink: "#ec4899",
}

export function AddMarkerDialog({ isOpen, onClose, onAdd, time }: AddMarkerDialogProps) {
  const [label, setLabel] = useState("")
  const [color, setColor] = useState<Marker["color"]>("blue")

  const handleAdd = useCallback(() => {
    onAdd({ time, label: label.trim() || `Marker at ${time.toFixed(2)}s`, color })
    setLabel("")
    setColor("blue")
    onClose()
  }, [time, label, color, onAdd, onClose])

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    const ms = Math.floor((t % 1) * 100)
    return `${m}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px] bg-[var(--surface-1)] border-[var(--border-default)]">
        <DialogHeader>
          <DialogTitle className="text-white">Add Marker</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-[var(--text-secondary)]">Time</Label>
            <div className="text-sm font-mono text-[var(--text-tertiary)] bg-[var(--surface-2)] px-3 py-2 rounded">
              {formatTime(time)}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[var(--text-secondary)]">Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter marker label..."
              className="bg-[var(--surface-2)] border-[var(--border-default)] text-white"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[var(--text-secondary)]">Color</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c ? "border-white scale-110" : "border-transparent hover:scale-105"
                  }`}
                  style={{ backgroundColor: COLOR_HEX[c] }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-[var(--text-tertiary)]">
            Cancel
          </Button>
          <Button onClick={handleAdd} className="bg-[var(--tertiary)] hover:bg-[var(--tertiary-hover)]">
            Add Marker
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
