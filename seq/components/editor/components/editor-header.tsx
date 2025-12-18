"use client"
import { memo, useState, useRef, useEffect } from "react"
import { DownloadIcon, UndoIcon, RedoIcon, SaveIcon, FolderOpenIcon } from "./icons"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/seq/components/ui/tooltip"
import { useSidebar } from "@/seq/components/ui/sidebar"
import { cn } from "@/seq/lib/utils"
import { ArrowLeftFromLine, PanelLeft } from "lucide-react"
import { IconTypelogo } from "../../typelogo"

export interface EditorHeaderProps {
  onBack: () => void
  onUndo: () => void
  onRedo: () => void
  onExport: () => void
  onShowShortcuts: () => void
  onSave: () => void
  onLoad: () => void
  onLoadDemo: () => void
  isSaving?: boolean
  canUndo: boolean
  canRedo: boolean
}

export const EditorHeader = memo(function EditorHeader({
  onBack,
  onUndo,
  onRedo,
  onExport,
  onShowShortcuts,
  onSave,
  onLoad,
  onLoadDemo,
  isSaving,
  canUndo,
  canRedo,
}: EditorHeaderProps) {
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false)
  const fileMenuRef = useRef<HTMLDivElement>(null)
  const { toggleVisible, visible } = useSidebar()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) {
        setIsFileMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <TooltipProvider delayDuration={300}>
      <header className="h-12 border-b border-[var(--border-default)] bg-[var(--surface-0)] flex items-center justify-between px-4 z-40 shrink-0">
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleVisible}
                className="relative inline-block font-sans font-medium text-center before:absolute before:inset-0 before:pointer-events-none before:rounded-[inherit] before:border before:border-transparent before:bg-transparent after:absolute after:inset-0 after:pointer-events-none after:rounded-[inherit] after:bg-transparent after:opacity-0 enabled:hover:after:opacity-100 transition duration-75 before:transition before:duration-75 after:transition after:duration-75 select-none cursor-pointer text-[15px] leading-[24px] rounded-md aspect-square p-2 text-foreground-primary bg-transparent enabled:hover:before:bg-overlay-on-primary disabled:after:bg-background-primary disabled:after:opacity-50"
              >
                {visible ? (
                  <ArrowLeftFromLine className={cn("w-4 h-4 flex-shrink-0")} />
                ) : (
                  <PanelLeft className={cn("w-4 h-4 flex-shrink-0")} />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {visible ? "Hide Sidebar" : "Show Sidebar"}
            </TooltipContent>
          </Tooltip>

          <IconTypelogo className="text-white" />

          <span className="text-[10px] text-[var(--text-tertiary)] border border-[var(--border-emphasis)] rounded-full px-2 py-0.5">
            Beta V0.2
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* File Menu */}
          <div className="relative" ref={fileMenuRef}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--hover-overlay)] rounded-lg transition-colors"
                >
                  <FolderOpenIcon className="w-4 h-4" />
                  <span className="text-xs">File</span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`transition-transform ${isFileMenuOpen ? "rotate-180" : ""}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                File Menu
              </TooltipContent>
            </Tooltip>

            {isFileMenuOpen && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg shadow-xl z-50 py-1">
                <button
                  onClick={() => {
                    onSave()
                    setIsFileMenuOpen(false)
                  }}
                  disabled={isSaving}
                  className="w-full px-3 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-overlay)] hover:text-white flex items-center gap-2 disabled:opacity-50"
                >
                  <SaveIcon className={`w-4 h-4 ${isSaving ? "animate-pulse" : ""}`} />
                  Save Project
                  <span className="ml-auto text-xs text-[var(--text-tertiary)]">⌘S</span>
                </button>
                <button
                  onClick={() => {
                    onLoad()
                    setIsFileMenuOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-overlay)] hover:text-white flex items-center gap-2"
                >
                  <FolderOpenIcon className="w-4 h-4" />
                  Open Project
                  <span className="ml-auto text-xs text-[var(--text-tertiary)]">⌘O</span>
                </button>
                <div className="h-px bg-[var(--border-default)] my-1" />
                <button
                  onClick={() => {
                    onLoadDemo()
                    setIsFileMenuOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--hover-overlay)] hover:text-white flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                  Load Demo Project
                </button>
              </div>
            )}
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="p-2 text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--hover-overlay)] rounded-lg disabled:opacity-30 transition-colors"
                >
                  <UndoIcon className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Undo <span className="text-[var(--text-tertiary)]">(⌘Z)</span>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="p-2 text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--hover-overlay)] rounded-lg disabled:opacity-30 transition-colors"
                >
                  <RedoIcon className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Redo <span className="text-[var(--text-tertiary)]">(⌘⇧Z)</span>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-[var(--border-default)]" />

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onShowShortcuts}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[var(--text-secondary)] hover:text-white border border-[var(--border-emphasis)] hover:border-[var(--border-strong)] rounded-full text-xs transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </svg>
                Learn
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Keyboard Shortcuts
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onExport}
                className="flex items-center gap-1.5 px-3 py-1.5 text-white bg-[var(--active-overlay)] hover:bg-[var(--hover-overlay)] border border-[var(--border-emphasis)] rounded-full text-xs font-medium transition-colors"
              >
                <DownloadIcon className="w-3.5 h-3.5" />
                Export
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Export Project <span className="text-[var(--text-tertiary)]">(⌘E)</span>
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  )
})

export default EditorHeader
