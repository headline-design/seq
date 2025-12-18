"use client"

import type React from "react"

import { cn } from "@/seq/lib/utils"

interface GlobalDropZoneProps {
  dropZoneHover: 1 | 2 | null
  onSetDropZoneHover: (zone: 1 | 2 | null) => void
  onDrop: (e: React.DragEvent, slot?: 1 | 2) => void
}

export function GlobalDropZone({ dropZoneHover, onSetDropZoneHover, onDrop }: GlobalDropZoneProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center gap-8 px-8"
      onDrop={(e) => {
        e.preventDefault()
        onDrop(e, 1)
      }}
    >
      <div
        className={cn(
          "flex-1 max-w-md h-64 border-4 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer",
          dropZoneHover === 1
            ? "border-accent bg-accent/10 scale-105 shadow-2xl shadow-accent/20"
            : "border-border bg-card hover:bg-muted hover:border-accent/50",
        )}
        onDragEnter={() => onSetDropZoneHover(1)}
        onDragLeave={() => onSetDropZoneHover(null)}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDrop(e, 1)
        }}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <div
            className={cn(
              "w-16 h-16 rounded-xl flex items-center justify-center mb-4 transition-all",
              dropZoneHover === 1 ? "bg-accent/20 scale-110" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "text-3xl font-bold transition-all",
                dropZoneHover === 1 ? "text-accent" : "text-muted-foreground",
              )}
            >
              1
            </span>
          </div>
          <svg
            className={cn(
              "w-12 h-12 mx-auto mb-4 transition-all",
              dropZoneHover === 1 ? "text-accent scale-110" : "text-muted-foreground",
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p
            className={cn(
              "text-xl font-bold transition-all",
              dropZoneHover === 1 ? "text-foreground" : "text-muted-foreground",
            )}
          >
            Input 1
          </p>
          <p
            className={cn(
              "text-sm mt-2 transition-all",
              dropZoneHover === 1 ? "text-muted-foreground" : "text-muted-foreground/70",
            )}
          >
            Drop here for first image
          </p>
        </div>
      </div>

      <div
        className={cn(
          "flex-1 max-w-md h-64 border-4 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer",
          dropZoneHover === 2
            ? "border-accent bg-accent/10 scale-105 shadow-2xl shadow-accent/20"
            : "border-border bg-card hover:bg-muted hover:border-accent/50",
        )}
        onDragEnter={() => onSetDropZoneHover(2)}
        onDragLeave={() => onSetDropZoneHover(null)}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onDrop(e, 2)
        }}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <div
            className={cn(
              "w-16 h-16 rounded-xl flex items-center justify-center mb-4 transition-all",
              dropZoneHover === 2 ? "bg-accent/20 scale-110" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "text-3xl font-bold transition-all",
                dropZoneHover === 2 ? "text-accent" : "text-muted-foreground",
              )}
            >
              2
            </span>
          </div>
          <svg
            className={cn(
              "w-12 h-12 mx-auto mb-4 transition-all",
              dropZoneHover === 2 ? "text-accent scale-110" : "text-muted-foreground",
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p
            className={cn(
              "text-xl font-bold transition-all",
              dropZoneHover === 2 ? "text-foreground" : "text-muted-foreground",
            )}
          >
            Input 2
          </p>
          <p
            className={cn(
              "text-sm mt-2 transition-all",
              dropZoneHover === 2 ? "text-muted-foreground" : "text-muted-foreground/70",
            )}
          >
            Drop here for second image
          </p>
        </div>
      </div>
    </div>
  )
}
