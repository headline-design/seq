"use client"

import type React from "react"
import { memo } from "react"
import { SettingsIcon, GridIcon, PlusIcon, TransitionIcon, InfoIcon, StoryboardIcon, LogoIcon } from "./icons"

export type SidebarView = "library" | "create" | "settings" | "transitions" | "inspector" | "storyboard"

export interface EditorSidebarProps {
  activeView: SidebarView
  isPanelOpen: boolean
  onViewChange: (view: SidebarView) => void
  onTogglePanel: () => void
  onBack: () => void
}

const SIDEBAR_ITEMS: { id: SidebarView; icon: React.FC<{ className?: string }>; label: string }[] = [
  { id: "create", icon: PlusIcon, label: "Create" },
  { id: "library", icon: GridIcon, label: "Library" },
  { id: "storyboard", icon: StoryboardIcon, label: "Storyboard" },
  { id: "transitions", icon: TransitionIcon, label: "Transitions" },
  { id: "inspector", icon: InfoIcon, label: "Inspector" },
  { id: "settings", icon: SettingsIcon, label: "Settings" },
]

export const EditorSidebar = memo(function EditorSidebar({
  activeView,
  isPanelOpen,
  onViewChange,
  onTogglePanel,
  onBack,
}: EditorSidebarProps) {
  return (
    <div className="w-[72px] flex flex-col items-center py-6 border-r border-neutral-800 bg-[#09090b] z-50 shrink-0">
      {/* Logo */}
      <div
        onClick={onBack}
        className="w-10 h-10 bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] rounded-xl flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-105 transition-transform mb-8"
      >
        <LogoIcon className="w-6 h-6" />
      </div>

      {/* Navigation items */}
      <div className="flex flex-col gap-6 w-full items-center">
        {SIDEBAR_ITEMS.map(({ id, icon: Icon, label }) => {
          const isActive = activeView === id && isPanelOpen
          return (
            <div
              key={id}
              onClick={() => {
                if (activeView === id) {
                  onTogglePanel()
                } else {
                  onViewChange(id)
                }
              }}
              className={`flex flex-col items-center gap-1 cursor-pointer ${isActive ? "text-indigo-400" : "text-neutral-500"}`}
            >
              <div className={`p-2 rounded-lg ${isActive ? "bg-indigo-500/10" : "hover:bg-neutral-800"}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] capitalize">{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
})

export default EditorSidebar
