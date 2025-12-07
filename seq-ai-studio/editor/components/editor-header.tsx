"use client"
import { memo } from "react"
import { DownloadIcon, UndoIcon, RedoIcon, KeyboardIcon } from "./icons"

export interface EditorHeaderProps {
  onBack: () => void
  onUndo: () => void
  onRedo: () => void
  onExport: () => void
  onShowShortcuts: () => void
  canUndo: boolean
  canRedo: boolean
}

export const EditorHeader = memo(function EditorHeader({
  onBack,
  onUndo,
  onRedo,
  onExport,
  onShowShortcuts,
  canUndo,
  canRedo,
}: EditorHeaderProps) {
  return (
    <header className="h-14 border-b border-neutral-800 bg-[#09090b] flex items-center justify-between px-6 z-40 shrink-0">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-xs text-neutral-500 hover:text-white flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </button>
        <div className="h-4 w-px bg-neutral-800 mx-2"></div>
        <span className="text-white font-semibold">Timeline</span>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={onShowShortcuts} className="text-neutral-500 hover:text-white">
          <KeyboardIcon className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded p-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1 text-neutral-400 hover:text-white disabled:opacity-30"
          >
            <UndoIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1 text-neutral-400 hover:text-white disabled:opacity-30"
          >
            <RedoIcon className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={onExport}
          className="bg-white text-black px-4 py-2 rounded text-xs font-bold flex items-center gap-2 hover:bg-neutral-200"
        >
          <DownloadIcon className="w-3.5 h-3.5" /> Export
        </button>
      </div>
    </header>
  )
})

export default EditorHeader
