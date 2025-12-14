"use client"

import { useEffect } from "react"

interface ShortcutHandlers {
  onPlayPause?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onCut?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onRippleDelete?: () => void
  onEscape?: () => void
}

export function useShortcuts(handlers: ShortcutHandlers, dependencies: unknown[] = []) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return
      }

      // Space: Play/Pause
      if (e.code === "Space" && handlers.onPlayPause) {
        e.preventDefault()
        handlers.onPlayPause()
      }

      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ" && !e.shiftKey && handlers.onUndo) {
        e.preventDefault()
        handlers.onUndo()
      }

      // Ctrl/Cmd + Shift + Z: Redo
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ" && e.shiftKey && handlers.onRedo) {
        e.preventDefault()
        handlers.onRedo()
      }

      // Ctrl/Cmd + C: Cut/Razor Tool (Context specific)
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyC" && handlers.onCut) {
        e.preventDefault()
        handlers.onCut()
      }

      // Ctrl/Cmd + D: Duplicate
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyD" && handlers.onDuplicate) {
        e.preventDefault()
        handlers.onDuplicate()
      }

      // Delete / Backspace
      if ((e.code === "Delete" || e.code === "Backspace") && !e.shiftKey && handlers.onDelete) {
        e.preventDefault()
        handlers.onDelete()
      }

      // Shift + Delete: Ripple Delete
      if ((e.code === "Delete" || e.code === "Backspace") && e.shiftKey && handlers.onRippleDelete) {
        e.preventDefault()
        handlers.onRippleDelete()
      }

      // Escape
      if (e.code === "Escape" && handlers.onEscape) {
        e.preventDefault()
        handlers.onEscape()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handlers, ...dependencies])
}
