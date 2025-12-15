"use client"

import type React from "react"

import { useSidebar } from "@/seq/components/ui/sidebar"
import type { ReactNode } from "react"

interface SidebarPanelWrapperProps {
  children: ReactNode
  isPanelOpen: boolean
  isCinemaMode: boolean
  sidebarWidth: number
  onResizeStart: (e: React.MouseEvent) => void
}

export function SidebarPanelWrapper({
  children,
  isPanelOpen,
  isCinemaMode,
  sidebarWidth,
  onResizeStart,
}: SidebarPanelWrapperProps) {
  const { visible } = useSidebar()

  // Don't render panel if sidebar is not visible, panel is closed, or in cinema mode
  if (!visible || !isPanelOpen || isCinemaMode) {
    return null
  }

  return (
    <div
      className="flex flex-col border-r border-neutral-800 bg-[#09090b] shrink-0 relative"
      style={{ width: sidebarWidth }}
    >
      {children}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-indigo-500/50 transition-colors"
        onMouseDown={onResizeStart}
      />
    </div>
  )
}
