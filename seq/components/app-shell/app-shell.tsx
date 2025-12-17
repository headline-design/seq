"use client"

import type * as React from "react"
import { AppSidebar, type SidebarView } from "./app-sidebar"
import { cn } from "@/seq/lib/utils"

interface AppShellProps {
  children: React.ReactNode
  // Studio-specific props
  activeView?: SidebarView
  isPanelOpen?: boolean
  onViewChange?: (view: SidebarView) => void
  onTogglePanel?: () => void
  // Whether to show the sidebar (can be hidden on certain pages)
  showSidebar?: boolean
  // Custom class for main content
  contentClassName?: string
}

export function AppShell({
  children,
  activeView,
  isPanelOpen,
  onViewChange,
  onTogglePanel,
  showSidebar = true,
  contentClassName,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[var(--surface-0)]">
      {showSidebar && (
        <AppSidebar
          activeView={activeView}
          isPanelOpen={isPanelOpen}
          onViewChange={onViewChange}
          onTogglePanel={onTogglePanel}
        />
      )}
      <main className={cn("flex-1 min-h-screen", showSidebar && "ml-[60px]", contentClassName)}>{children}</main>
    </div>
  )
}

export default AppShell
