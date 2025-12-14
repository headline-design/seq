"use client"
import { memo, useState, useRef, useEffect } from "react"
import { DownloadIcon, UndoIcon, RedoIcon, KeyboardIcon, SaveIcon, FolderOpenIcon } from "./icons"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/seq/components/ui/tooltip"

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
      <header className="h-14 border-b border-neutral-800 bg-[#09090b] flex items-center justify-between px-6 z-40 shrink-0">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onBack} className="text-xs text-neutral-500 hover:text-white flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Back
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Return to Home
            </TooltipContent>
          </Tooltip>
          <div className="h-4 w-px bg-neutral-800 mx-2"></div>
          <span className="text-white font-semibold">Timeline</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative" ref={fileMenuRef}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 rounded transition-colors"
                >
                  <FolderOpenIcon className="w-4 h-4" />
                  File
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
              <div className="absolute top-full right-0 mt-1 w-48 bg-neutral-900 border border-neutral-800 rounded-md shadow-xl z-50 py-1">
                <button
                  onClick={() => {
                    onSave()
                    setIsFileMenuOpen(false)
                  }}
                  disabled={isSaving}
                  className="w-full px-3 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2 disabled:opacity-50"
                >
                  <SaveIcon className={`w-4 h-4 ${isSaving ? "animate-pulse" : ""}`} />
                  Save Project
                  <span className="ml-auto text-xs text-neutral-500">⌘S</span>
                </button>
                <button
                  onClick={() => {
                    onLoad()
                    setIsFileMenuOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2"
                >
                  <FolderOpenIcon className="w-4 h-4" />
                  Open Project
                  <span className="ml-auto text-xs text-neutral-500">⌘O</span>
                </button>
                <div className="h-px bg-neutral-800 my-1" />
                <button
                  onClick={() => {
                    onLoadDemo()
                    setIsFileMenuOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2"
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

          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onShowShortcuts} className="text-neutral-500 hover:text-white">
                <KeyboardIcon className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Keyboard Shortcuts <span className="text-neutral-500">(?)</span>
            </TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded p-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="p-1 text-neutral-400 hover:text-white disabled:opacity-30"
                >
                  <UndoIcon className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Undo <span className="text-neutral-500">(⌘Z)</span>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="p-1 text-neutral-400 hover:text-white disabled:opacity-30"
                >
                  <RedoIcon className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Redo <span className="text-neutral-500">(⌘⇧Z)</span>
              </TooltipContent>
            </Tooltip>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onExport}
                className="bg-white text-black px-4 py-2 rounded text-xs font-bold flex items-center gap-2 hover:bg-neutral-200"
              >
                <DownloadIcon className="w-3.5 h-3.5" /> Export
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Export Project <span className="text-neutral-500">(⌘E)</span>
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  )
})

export default EditorHeader
