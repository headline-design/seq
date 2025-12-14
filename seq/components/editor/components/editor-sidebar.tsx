"use client"

import type React from "react"
import { memo } from "react"
import { SettingsIcon, GridIcon, PlusIcon, TransitionIcon, InfoIcon, StoryboardIcon, LogoIcon } from "./icons"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/seq/components/ui/tooltip"

export type SidebarView = "library" | "create" | "settings" | "transitions" | "inspector" | "storyboard"

export interface EditorSidebarProps {
  activeView: SidebarView
  isPanelOpen: boolean
  onViewChange: (view: SidebarView) => void
  onTogglePanel: () => void
  onBack: () => void
}

const SIDEBAR_ITEMS: { id: SidebarView; icon: React.FC<{ className?: string }>; label: string; shortcut?: string }[] = [
  { id: "create", icon: PlusIcon, label: "Create", shortcut: "1" },
  { id: "library", icon: GridIcon, label: "Library", shortcut: "2" },
  { id: "storyboard", icon: StoryboardIcon, label: "Storyboard", shortcut: "3" },
  { id: "transitions", icon: TransitionIcon, label: "Transitions", shortcut: "4" },
  { id: "inspector", icon: InfoIcon, label: "Inspector", shortcut: "5" },
  { id: "settings", icon: SettingsIcon, label: "Settings", shortcut: "6" },
]

export const EditorSidebar = memo(function EditorSidebar({
  activeView,
  isPanelOpen,
  onViewChange,
  onTogglePanel,
  onBack,
}: EditorSidebarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="w-[72px] flex flex-col items-center py-6 border-r border-neutral-800 bg-[#09090b] z-50 shrink-0 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Logo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              onClick={onBack}
              className="w-10 h-10 bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] rounded-xl flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-105 transition-transform mb-8 shrink-0"
            >
              <LogoIcon className="w-6 h-6" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            Back to Home
          </TooltipContent>
        </Tooltip>

        {/* Navigation items */}
        <div className="flex flex-col gap-6 w-full items-center shrink-0">
          {SIDEBAR_ITEMS.map(({ id, icon: Icon, label, shortcut }) => {
            const isActive = activeView === id && isPanelOpen
            return (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <div
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
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {label} {shortcut && <span className="text-neutral-500 ml-1">({shortcut})</span>}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
})

export default EditorSidebar
