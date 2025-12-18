"use client"

import { Button } from "@/seq/components/ui/button"

interface ProgressBarProps {
  progress: number
  onCancel: () => void
  isConverting?: boolean
}

export function ProgressBar({ progress, onCancel, isConverting = false }: ProgressBarProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-4 select-none">
      <div className="w-full max-w-md">
        <div
          className="relative h-4 md:h-8 bg-card border border-border rounded-lg overflow-hidden mb-4"
          style={{ zIndex: 30 }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(90deg, transparent 0%, transparent 49%, #333 49%, #333 51%, transparent 51%),
                linear-gradient(0deg, transparent 0%, transparent 49%, #333 49%, #333 51%, transparent 51%)
              `,
              backgroundSize: "8px 8px",
            }}
          />

          <div
            className="absolute top-0 left-0 h-full transition-all duration-100 ease-out rounded-l-lg"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, hsl(var(--accent)), hsl(var(--accent)) 70%, hsl(var(--accent)) 100%)`,
            }}
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs md:text-sm font-mono text-foreground font-medium" style={{ zIndex: 40 }}>
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-xs md:text-sm font-medium text-muted-foreground animate-pulse">
            {isConverting ? "Converting HEIC image..." : "Generating..."}
          </p>
          {!isConverting && (
            <Button onClick={onCancel} variant="outline" size="sm">
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
