"use client"

import type React from "react"
import { memo, useState, useMemo } from "react"
import { KeyboardIcon } from "./icons"

interface ShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ShortcutCategory {
  name: string
  icon: React.ReactNode
  shortcuts: { key: string; desc: string }[]
}

const Kbd = memo(function Kbd({ children }: { children: string }) {
  if (children === "+") {
    return <span className="text-[var(--text-muted)] mx-0.5">+</span>
  }
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-[var(--surface-1)] border border-[var(--border-default)] rounded text-[11px] text-[var(--text-secondary)] font-mono shadow-sm">
      {children}
    </kbd>
  )
})

const ShortcutRow = memo(function ShortcutRow({ shortcut }: { shortcut: { key: string; desc: string } }) {
  const keys = shortcut.key.split(" ")

  return (
    <div className="flex items-center justify-between px-3 py-2 hover:bg-[var(--hover-overlay)] rounded-lg transition-colors group">
      <span className="text-[var(--text-tertiary)] text-sm group-hover:text-[var(--text-secondary)] transition-colors">
        {shortcut.desc}
      </span>
      <span className="flex items-center gap-0.5">
        {keys.map((k, idx) => (
          <Kbd key={idx}>{k}</Kbd>
        ))}
      </span>
    </div>
  )
})

export const ShortcutsModal = memo(function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const categories: ShortcutCategory[] = useMemo(
    () => [
      {
        name: "Playback",
        icon: (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        ),
        shortcuts: [
          { key: "Space", desc: "Play / Pause" },
          { key: "J", desc: "Rewind" },
          { key: "K", desc: "Stop" },
          { key: "L", desc: "Fast Forward" },
          { key: "Home", desc: "Go to Start" },
          { key: "End", desc: "Go to End" },
          { key: "← / →", desc: "Step Frame" },
          { key: "Shift + ← / →", desc: "Step 1 Second" },
        ],
      },
      {
        name: "Editing",
        icon: (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        ),
        shortcuts: [
          { key: "Cmd/Ctrl + Z", desc: "Undo" },
          { key: "Cmd/Ctrl + Shift + Z", desc: "Redo" },
          { key: "Cmd/Ctrl + D", desc: "Duplicate Clip" },
          { key: "Delete / Backspace", desc: "Delete Clip" },
          { key: "Shift + Delete", desc: "Ripple Delete" },
          { key: "C", desc: "Toggle Razor Tool" },
          { key: "S", desc: "Split at Playhead" },
          { key: "Cmd/Ctrl + A", desc: "Select All Clips" },
        ],
      },
      {
        name: "Navigation",
        icon: (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="5 9 2 12 5 15" />
            <polyline points="9 5 12 2 15 5" />
            <polyline points="15 19 12 22 9 19" />
            <polyline points="19 9 22 12 19 15" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="12" y1="2" x2="12" y2="22" />
          </svg>
        ),
        shortcuts: [
          { key: "↑ / ↓", desc: "Select Clip Above/Below" },
          { key: "← / →", desc: "Select Previous/Next Clip" },
          { key: "Alt + ← / →", desc: "Nudge Clip" },
          { key: "Tab", desc: "Next Panel" },
          { key: "Shift + Tab", desc: "Previous Panel" },
        ],
      },
      {
        name: "Timeline",
        icon: (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M3 15h18" />
            <path d="M9 3v18" />
          </svg>
        ),
        shortcuts: [
          { key: "Scroll", desc: "Horizontal Scroll" },
          { key: "Cmd/Ctrl + Scroll", desc: "Zoom Timeline" },
          { key: "= / -", desc: "Zoom In / Out" },
          { key: "Shift + Z", desc: "Fit Timeline to View" },
          { key: "\\", desc: "Toggle Snap" },
        ],
      },
      {
        name: "Views & Panels",
        icon: (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        ),
        shortcuts: [
          { key: "1", desc: "Library Panel" },
          { key: "2", desc: "Create Panel" },
          { key: "3", desc: "Storyboard Panel" },
          { key: "4", desc: "Inspector Panel" },
          { key: "5", desc: "Transitions Panel" },
          { key: "6", desc: "Settings Panel" },
          { key: "F", desc: "Toggle Fullscreen Preview" },
          { key: "?", desc: "Show Shortcuts" },
        ],
      },
      {
        name: "Export",
        icon: (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        ),
        shortcuts: [
          { key: "Cmd/Ctrl + E", desc: "Export Video" },
          { key: "Cmd/Ctrl + R", desc: "Render Preview" },
          { key: "Cmd/Ctrl + S", desc: "Save Project" },
          { key: "F", desc: "Save Current Frame" },
        ],
      },
    ],
    [],
  )

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories

    const query = searchQuery.toLowerCase()
    return categories
      .map((cat) => ({
        ...cat,
        shortcuts: cat.shortcuts.filter(
          (s) => s.desc.toLowerCase().includes(query) || s.key.toLowerCase().includes(query),
        ),
      }))
      .filter((cat) => cat.shortcuts.length > 0)
  }, [categories, searchQuery])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[var(--surface-1)] border border-[var(--border-default)] rounded-xl shadow-2xl w-[700px] max-h-[80vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-default)] bg-[var(--surface-0)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--tertiary-muted)] text-[var(--tertiary)] flex items-center justify-center">
                <KeyboardIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Keyboard Shortcuts</h3>
                <p className="text-xs text-[var(--text-muted)]">Master the editor with these shortcuts</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--hover-overlay)] rounded-lg text-[var(--text-muted)] hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--surface-2)] border border-[var(--border-default)] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--tertiary)] transition-colors"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--border-subtle)] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeCategory === null
                ? "bg-[var(--tertiary-muted)] text-[var(--tertiary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--hover-overlay)]"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeCategory === cat.name
                  ? "bg-[var(--tertiary-muted)] text-[var(--tertiary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--hover-overlay)]"
              }`}
            >
              {cat.icon}
              {cat.name}
            </button>
          ))}
        </div>

        {/* Shortcuts list */}
        <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)]">
              <svg
                className="w-12 h-12 mb-3 opacity-50"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <p className="text-sm">No shortcuts found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredCategories
                .filter((cat) => activeCategory === null || cat.name === activeCategory)
                .map((category) => (
                  <div key={category.name}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className="text-[var(--tertiary)]">{category.icon}</span>
                      <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                        {category.name}
                      </h4>
                      <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4">
                      {category.shortcuts.map((shortcut, idx) => (
                        <ShortcutRow key={idx} shortcut={shortcut} />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[var(--surface-0)] border-t border-[var(--border-default)] flex items-center justify-between">
          <p className="text-xs text-[var(--text-faint)]">
            <span className="text-[var(--text-muted)]">Tip:</span> Press <Kbd>?</Kbd> anytime to show shortcuts
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--surface-3)] hover:bg-[var(--surface-4)] text-[var(--text-secondary)] rounded-lg text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
})

ShortcutsModal.displayName = "ShortcutsModal"
