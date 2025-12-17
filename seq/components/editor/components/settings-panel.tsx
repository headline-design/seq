"use client"
import { memo, useCallback, useState } from "react"
import { SettingsIcon } from "./icons"
import { ASPECT_RATIOS, PLAYBACK_CONSTANTS } from "../constants"
import { clearAutosave, hasAutosave } from "../services/project-service"
import {
  PanelContainer,
  PanelHeader,
  PanelContent,
  PanelSectionBordered,
  Toggle,
  Select,
  NumberInput,
} from "./panel-primitives"

interface ProjectSettings {
  projectName: string
  aspectRatio: string
  frameRate: number
  defaultClipDuration: number
  autoSave: boolean
  autoSaveInterval: number
  snapToGrid: boolean
  showWaveforms: boolean
  showThumbnails: boolean
}

interface SettingsPanelProps {
  onClose: () => void
  onClearTimeline: () => void
  onClearLibrary: () => void
  onClearAll: () => void
  defaultDuration: number
  onDurationChange: (val: number) => void
  projectSettings?: Partial<ProjectSettings>
  onSettingsChange?: (settings: Partial<ProjectSettings>) => void
}

export const SettingsPanel = memo(function SettingsPanel({
  onClose,
  onClearTimeline,
  onClearLibrary,
  onClearAll,
  defaultDuration,
  onDurationChange,
  projectSettings,
  onSettingsChange,
}: SettingsPanelProps) {
  const [settings, setSettings] = useState<ProjectSettings>({
    projectName: projectSettings?.projectName || "Untitled Project",
    aspectRatio: projectSettings?.aspectRatio || "16:9",
    frameRate: projectSettings?.frameRate || PLAYBACK_CONSTANTS.DEFAULT_FPS,
    defaultClipDuration: defaultDuration,
    autoSave: projectSettings?.autoSave ?? true,
    autoSaveInterval: projectSettings?.autoSaveInterval || 60,
    snapToGrid: projectSettings?.snapToGrid ?? true,
    showWaveforms: projectSettings?.showWaveforms ?? true,
    showThumbnails: projectSettings?.showThumbnails ?? true,
  })

  const updateSetting = useCallback(
    <K extends keyof ProjectSettings>(key: K, value: ProjectSettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value }
        onSettingsChange?.(next)
        return next
      })
      if (key === "defaultClipDuration") {
        onDurationChange(value as number)
      }
    },
    [onSettingsChange, onDurationChange],
  )

  const handleClearTimeline = useCallback(() => {
    if (window.confirm("Are you sure you want to clear the timeline? This cannot be undone.")) {
      onClearTimeline()
    }
  }, [onClearTimeline])

  const handleClearLibrary = useCallback(() => {
    if (window.confirm("Are you sure you want to clear the media library? This cannot be undone.")) {
      onClearLibrary()
    }
  }, [onClearLibrary])

  const handleResetSettings = useCallback(() => {
    if (window.confirm("Reset all settings to defaults?")) {
      const defaults: ProjectSettings = {
        projectName: "Untitled Project",
        aspectRatio: "16:9",
        frameRate: 30,
        defaultClipDuration: 5,
        autoSave: true,
        autoSaveInterval: 60,
        snapToGrid: true,
        showWaveforms: true,
        showThumbnails: true,
      }
      setSettings(defaults)
      onSettingsChange?.(defaults)
      onDurationChange(5)
    }
  }, [onSettingsChange, onDurationChange])

  const handleClearAll = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to start a new project? This will clear ALL data including timeline, library, and storyboard. This cannot be undone.",
      )
    ) {
      onClearAll()
    }
  }, [onClearAll])

  const handleClearAutosave = useCallback(() => {
    if (
      window.confirm("Clear autosaved data? This will remove any auto-saved project data and reset to default tracks.")
    ) {
      clearAutosave()
      window.location.reload()
    }
  }, [])

  return (
    <PanelContainer>
      <PanelHeader title="Project Settings" onClose={onClose} />

      <PanelContent>
        {/* Project Info Section */}
        <PanelSectionBordered title="Project" icon={<SettingsIcon className="w-4 h-4 text-[var(--accent-text)]" />}>
          <div className="space-y-1.5">
            <label className="text-xs text-neutral-400">Project Name</label>
            <input
              type="text"
              value={settings.projectName}
              onChange={(e) => updateSetting("projectName", e.target.value)}
              className="w-full bg-[var(--surface-0)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-[var(--accent-primary)]"
              placeholder="Enter project name..."
            />
          </div>

          <Select
            label="Aspect Ratio"
            value={settings.aspectRatio}
            options={ASPECT_RATIOS.map((ar) => ({ value: ar.value, label: ar.label }))}
            onChange={(v) => updateSetting("aspectRatio", v)}
          />

          <Select
            label="Frame Rate"
            value={settings.frameRate}
            options={[
              { value: 24, label: "24 fps (Film)" },
              { value: 25, label: "25 fps (PAL)" },
              { value: 30, label: "30 fps (Standard)" },
              { value: 60, label: "60 fps (Smooth)" },
            ]}
            onChange={(v) => updateSetting("frameRate", Number(v))}
          />
        </PanelSectionBordered>

        {/* Timeline Section */}
        <PanelSectionBordered
          title="Timeline"
          icon={
            <svg
              className="w-4 h-4 text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M3 15h18" />
              <path d="M9 3v18" />
            </svg>
          }
        >
          <NumberInput
            label="Default Clip Duration"
            value={settings.defaultClipDuration}
            min={1}
            max={60}
            step={1}
            unit="seconds"
            onChange={(v) => updateSetting("defaultClipDuration", v)}
          />

          <Toggle
            label="Snap to Grid"
            description="Snap clips to other clips and markers"
            checked={settings.snapToGrid}
            onChange={(v) => updateSetting("snapToGrid", v)}
          />

          <Toggle
            label="Show Waveforms"
            description="Display audio waveforms on clips"
            checked={settings.showWaveforms}
            onChange={(v) => updateSetting("showWaveforms", v)}
          />

          <Toggle
            label="Show Thumbnails"
            description="Display video thumbnails on clips"
            checked={settings.showThumbnails}
            onChange={(v) => updateSetting("showThumbnails", v)}
          />
        </PanelSectionBordered>

        {/* Auto-Save Section */}
        <PanelSectionBordered
          title="Auto-Save"
          icon={
            <svg
              className="w-4 h-4 text-amber-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          }
        >
          <Toggle
            label="Enable Auto-Save"
            description="Automatically save your project at regular intervals"
            checked={settings.autoSave}
            onChange={(v) => updateSetting("autoSave", v)}
          />

          {settings.autoSave && (
            <Select
              label="Save Interval"
              value={settings.autoSaveInterval}
              options={[
                { value: 30, label: "Every 30 seconds" },
                { value: 60, label: "Every 1 minute" },
                { value: 120, label: "Every 2 minutes" },
                { value: 300, label: "Every 5 minutes" },
              ]}
              onChange={(v) => updateSetting("autoSaveInterval", Number(v))}
            />
          )}
        </PanelSectionBordered>

        {/* Keyboard Shortcuts */}
        <PanelSectionBordered
          title="Keyboard Shortcuts"
          icon={
            <svg
              className="w-4 h-4 text-purple-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M6 8h.01" />
              <path d="M10 8h.01" />
              <path d="M14 8h.01" />
              <path d="M18 8h.01" />
              <path d="M8 12h.01" />
              <path d="M12 12h.01" />
              <path d="M16 12h.01" />
              <path d="M7 16h10" />
            </svg>
          }
          defaultOpen={false}
        >
          <div className="space-y-2">
            {[
              { keys: "Space", action: "Play / Pause" },
              { keys: "Cmd/Ctrl + Z", action: "Undo" },
              { keys: "Cmd/Ctrl + Shift + Z", action: "Redo" },
              { keys: "Delete / Backspace", action: "Delete clip" },
              { keys: "Cmd/Ctrl + D", action: "Duplicate clip" },
              { keys: "Cmd/Ctrl + A", action: "Select all clips" },
              { keys: "Arrow Left/Right", action: "Navigate clips" },
              { keys: "Alt + Arrow", action: "Nudge clip" },
              { keys: "Home / End", action: "Jump to start/end" },
              { keys: "J / K / L", action: "Rewind / Pause / Forward" },
            ].map((shortcut) => (
              <div key={shortcut.action} className="flex items-center justify-between py-1">
                <span className="text-xs text-neutral-400">{shortcut.action}</span>
                <kbd className="px-2 py-0.5 bg-[var(--hover-overlay)] border border-[var(--border-default)] rounded text-[10px] text-neutral-300 font-mono">
                  {shortcut.keys}
                </kbd>
              </div>
            ))}
          </div>
        </PanelSectionBordered>

        {/* Danger Zone */}
        <PanelSectionBordered
          title="Danger Zone"
          icon={
            <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          }
          defaultOpen={false}
        >
          <div className="space-y-3">
            <button
              onClick={handleClearAll}
              className="w-full py-2.5 px-4 rounded-lg border border-red-500/50 bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-semibold transition-colors"
            >
              New Project (Clear All)
            </button>

            <div className="border-t border-[var(--border-default)] pt-3 space-y-3">
              <button
                onClick={handleClearTimeline}
                className="w-full py-2.5 px-4 rounded-lg border border-red-900/30 bg-red-900/10 text-red-400 hover:bg-red-900/20 text-xs font-medium transition-colors"
              >
                Clear Timeline
              </button>

              <button
                onClick={handleClearLibrary}
                className="w-full py-2.5 px-4 rounded-lg border border-red-900/30 bg-red-900/10 text-red-400 hover:bg-red-900/20 text-xs font-medium transition-colors"
              >
                Clear Media Library
              </button>

              {hasAutosave() && (
                <button
                  onClick={handleClearAutosave}
                  className="w-full py-2.5 px-4 rounded-lg border border-amber-900/30 bg-amber-900/10 text-amber-400 hover:bg-amber-900/20 text-xs font-medium transition-colors"
                >
                  Clear Autosave Data
                </button>
              )}

              <button
                onClick={handleResetSettings}
                className="w-full py-2.5 px-4 rounded-lg border border-[var(--border-default)] bg-[var(--hover-overlay)] text-neutral-400 hover:bg-[var(--active-overlay)] text-xs font-medium transition-colors"
              >
                Reset All Settings
              </button>
            </div>
          </div>
        </PanelSectionBordered>

        {/* Footer */}
        <div className="mt-auto pt-4 text-center border-t border-[var(--border-default)]">
          <p className="text-[10px] text-neutral-600">Seq Video Editor v1.0.2</p>
          <p className="text-[10px] text-neutral-700 mt-1">Built with Next.js & FFmpeg</p>
        </div>
      </PanelContent>
    </PanelContainer>
  )
})

SettingsPanel.displayName = "SettingsPanel"
