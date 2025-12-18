"use client"

import { memo } from "react"
import { cn } from "@/seq/lib/utils"

interface SkeletonProps {
  className?: string
}

// Base skeleton with pulse animation
export const Skeleton = memo(function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded bg-[var(--surface-3)]", className)} />
})
Skeleton.displayName = "Skeleton"

// Timeline skeleton
export const TimelineSkeleton = memo(function TimelineSkeleton() {
  return (
    <div className="flex h-full flex-col bg-[var(--surface-1)]">
      {/* Toolbar skeleton */}
      <div className="flex h-10 items-center gap-2 border-b border-[var(--border-default)] px-3">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-6" />
        <Skeleton className="h-6 w-6" />
        <div className="flex-1" />
        <Skeleton className="h-6 w-24" />
      </div>

      {/* Timeline content skeleton */}
      <div className="flex flex-1 overflow-hidden">
        {/* Track headers */}
        <div className="flex w-32 flex-col border-r border-[var(--border-default)] bg-[var(--surface-0)]">
          <Skeleton className="m-2 h-12" />
          <Skeleton className="m-2 h-12" />
          <Skeleton className="m-2 h-12" />
        </div>

        {/* Timeline tracks */}
        <div className="flex-1 overflow-hidden">
          {/* Ruler */}
          <div className="flex h-6 items-center gap-8 border-b border-[var(--border-default)] px-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-8" />
            ))}
          </div>

          {/* Tracks with clips */}
          <div className="flex flex-col">
            <div className="flex h-16 items-center gap-2 border-b border-[var(--border-subtle)] px-4">
              <Skeleton className="h-12 w-32 rounded" />
              <Skeleton className="h-12 w-48 rounded" />
              <Skeleton className="h-12 w-24 rounded" />
            </div>
            <div className="flex h-16 items-center gap-2 border-b border-[var(--border-subtle)] px-4">
              <div className="w-20" />
              <Skeleton className="h-12 w-40 rounded" />
            </div>
            <div className="flex h-16 items-center gap-2 border-b border-[var(--border-subtle)] px-4">
              <Skeleton className="h-8 w-64 rounded bg-[var(--success-muted)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
TimelineSkeleton.displayName = "TimelineSkeleton"

// Preview player skeleton
export const PreviewSkeleton = memo(function PreviewSkeleton() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-black">
      <Skeleton className="aspect-video w-full max-w-2xl" />
      <div className="mt-4 flex items-center gap-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="mt-2 h-4 w-24" />
    </div>
  )
})
PreviewSkeleton.displayName = "PreviewSkeleton"

// Library skeleton
export const LibrarySkeleton = memo(function LibrarySkeleton() {
  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 flex-1" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <Skeleton className="aspect-video w-full rounded" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  )
})
LibrarySkeleton.displayName = "LibrarySkeleton"

// Storyboard skeleton
export const StoryboardSkeleton = memo(function StoryboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-32" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-24" />
      </div>

      {/* Panels */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-lg border border-[var(--border-default)] p-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 flex-1" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="aspect-video w-1/2 rounded" />
            <Skeleton className="aspect-video w-1/2 rounded" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
})
StoryboardSkeleton.displayName = "StoryboardSkeleton"

// Inspector skeleton
export const InspectorSkeleton = memo(function InspectorSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="aspect-video w-full rounded" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-16" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </div>
    </div>
  )
})
InspectorSkeleton.displayName = "InspectorSkeleton"

// Full editor loading state
export const EditorLoadingSkeleton = memo(function EditorLoadingSkeleton() {
  return (
    <div className="flex h-screen w-full flex-col bg-[var(--surface-0)]">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-[var(--border-default)] px-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="flex w-12 flex-col items-center gap-2 border-r border-[var(--border-default)] bg-[var(--surface-0)] py-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>

        {/* Panel */}
        <div className="w-72 border-r border-[var(--border-default)]">
          <LibrarySkeleton />
        </div>

        {/* Preview */}
        <div className="flex-1">
          <PreviewSkeleton />
        </div>

        {/* Inspector */}
        <div className="w-72 border-l border-[var(--border-default)]">
          <InspectorSkeleton />
        </div>
      </div>

      {/* Timeline */}
      <div className="h-64 border-t border-[var(--border-default)]">
        <TimelineSkeleton />
      </div>
    </div>
  )
})
EditorLoadingSkeleton.displayName = "EditorLoadingSkeleton"

// Loading spinner for inline use
export const LoadingSpinner = memo(function LoadingSpinner({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }

  return (
    <svg
      className={cn("animate-spin text-[var(--text-muted)]", sizeClasses[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
})
LoadingSpinner.displayName = "LoadingSpinner"

// Progress bar for export/generation
export const ProgressBar = memo(function ProgressBar({
  progress,
  label,
  className,
}: {
  progress: number
  label?: string
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && <span className="text-xs text-[var(--text-tertiary)]">{label}</span>}
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
        <div
          className="h-full rounded-full bg-[var(--tertiary)] transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  )
})
ProgressBar.displayName = "ProgressBar"
