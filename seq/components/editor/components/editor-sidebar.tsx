"use client"

import { cn } from "@/seq/lib/utils"

import type React from "react"
import { memo } from "react"
import { SettingsIcon, GridIcon, PlusIcon, TransitionIcon, InfoIcon, StoryboardIcon, LogoIcon } from "./icons"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/seq/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/seq/components/ui/tooltip"
import { UserMenu } from "./user-menu"

export type SidebarView = "library" | "create" | "settings" | "transitions" | "inspector" | "storyboard"

export interface EditorSidebarProps {
  activeView: SidebarView
  isPanelOpen: boolean
  onViewChange: (view: SidebarView) => void
  onTogglePanel: () => void
  onBack: () => void
}

const SIDEBAR_ITEMS: {
  id: SidebarView
  icon: React.FC<{ className?: string }>
  label: string
  miniLabel: string
  shortcut?: string
}[] = [
  { id: "create", icon: PlusIcon, label: "Create", miniLabel: "Create", shortcut: "1" },
  { id: "library", icon: GridIcon, label: "Library", miniLabel: "Library", shortcut: "2" },
  { id: "storyboard", icon: StoryboardIcon, label: "Storyboard", miniLabel: "Panels", shortcut: "3" },
  { id: "transitions", icon: TransitionIcon, label: "Transitions", miniLabel: "Effects", shortcut: "4" },
  { id: "inspector", icon: InfoIcon, label: "Inspector", miniLabel: "Details", shortcut: "5" },
  { id: "settings", icon: SettingsIcon, label: "Settings", miniLabel: "Config", shortcut: "6" },
]

function EditorSidebarInner({ activeView, isPanelOpen, onViewChange, onTogglePanel, onBack }: EditorSidebarProps) {
  const { state, toggleSidebar } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon" className="border-r border-[var(--border-default)]">
      <SidebarHeader
        className={cn(
          "flex h-[88px] flex-row justify-start p-4 pt-8 ",
          isCollapsed && "relative inline-block h-auto w-full max-w-28 p-2 pt-4 pb-0",
        )}
      >
        <a className="relative inline-block h-auto w-full max-w-28 p-2 " href="/">
          <span
            className={cn(
              " flex items-center justify-center drop-shadow-logo [&_path]:transition-[d] [&_path]:duration-[3s] h-full w-full object-contain drop-shadow-logo md:drop-shadow-none ",
            )}
          >
            <LogoIcon className="h-7 w-7 flex-shrink-0" />
          </span>
        </a>
      </SidebarHeader>

      <SidebarContent className="px-0">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <div className="mb-2 flex justify-center">
              <UserMenu />
            </div>

            <SidebarMenu className="flex flex-col gap-[10px]">
              {SIDEBAR_ITEMS.map(({ id, icon: Icon, label, miniLabel, shortcut }) => {
                const isActive = activeView === id && isPanelOpen
                return (
                  <SidebarMenuItem key={id} className={cn("p-0")}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          onClick={() => {
                            if (activeView === id) {
                              onTogglePanel()
                            } else {
                              onViewChange(id)
                            }
                          }}
                          isActive={isActive}
                          className={cn(
                            !isCollapsed && "h-10 gap-3 rounded-md px-3 transition-colors items-center flex",

                            isCollapsed &&
                              "data-[active=true]:bg-transparent active:bg-transparent focus:bg-transparent hover:bg-transparent h-auto flex flex-col items-center justify-center gap-[2px] text-center text-[11px] leading-[16px] group/sidebar-item font-semibold p-0",
                          )}
                        >
                          <div
                            className={cn(
                              "p-1.5 rounded-md group-hover/sidebar-item:bg-[var(--hover-overlay)] transition-colors",
                              isActive && "bg-[var(--tertiary-muted)]",
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                isActive ? "text-[var(--tertiary)]" : "text-[var(--text-tertiary)]",
                              )}
                            />
                          </div>
                          {isCollapsed && (
                            <span className={cn(isActive ? "text-[var(--tertiary)]" : "text-[var(--text-tertiary)]")}>
                              {miniLabel}
                            </span>
                          )}
                          {!isCollapsed && (
                            <span
                              className={cn(
                                "text-sm",
                                isActive ? "text-[var(--tertiary)] font-medium" : "text-[var(--text-tertiary)]",
                              )}
                            >
                              {label}
                            </span>
                          )}
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8} hidden={!isCollapsed}>
                        <p>
                          {label}
                          {shortcut && <span className="ml-2 text-[var(--text-muted)]">({shortcut})</span>}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t border-[var(--border-default)] p-3">
        {!isCollapsed && (
          <div className="text-xs text-[var(--text-muted)]">
            <span className="font-medium text-white">∞</span> Credits
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}

export const EditorSidebar = memo(function EditorSidebar(props: EditorSidebarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <EditorSidebarInner {...props} />
    </TooltipProvider>
  )
})

export default EditorSidebar
