"use client"

import type React from "react"
import { memo, useState } from "react"
import { ChevronDownIcon, ChevronRightIcon, PanelLeftClose } from "./icons"

/**
 * Shared Panel Header Component
 * Used at the top of all side panels for consistent styling
 */
export const PanelHeader = memo(function PanelHeader({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children?: React.ReactNode
}) {
  return (
    <div className="h-14 flex items-center px-4 justify-between shrink-0 border-b border-[var(--border-default)]">
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">{title}</h2>
      <div className="flex items-center gap-2">
        {children}
        <button
          className="p-1.5 rounded hover:bg-[var(--hover-overlay)] cursor-pointer text-[var(--text-secondary)] transition-colors"
          onClick={onClose}
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
})

PanelHeader.displayName = "PanelHeader"

/**
 * Collapsible Panel Section with border (for Settings-style panels)
 */
export const PanelSectionBordered = memo(function PanelSectionBordered({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-[var(--border-default)] rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 p-3 bg-[var(--hover-overlay)] hover:bg-[var(--active-overlay)] transition-colors rounded-t-lg"
      >
        {isOpen ? (
          <ChevronDownIcon className="w-4 h-4 text-[var(--text-secondary)]" />
        ) : (
          <ChevronRightIcon className="w-4 h-4 text-[var(--text-secondary)]" />
        )}
        {icon}
        <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wide">{title}</span>
      </button>
      {isOpen && <div className="p-4 space-y-4 border-t border-[var(--border-default)] rounded-b-lg">{children}</div>}
    </div>
  )
})

PanelSectionBordered.displayName = "PanelSectionBordered"

/**
 * Simple Collapsible Panel Section (for Inspector-style panels)
 */
export const PanelSection = memo(function PanelSection({
  title,
  defaultOpen = true,
  children,
  badge,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  badge?: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="flex flex-col">
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between py-2 group">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-tertiary)] transition-colors">
            {title}
          </span>
          {badge}
        </div>
        <svg
          className={`w-3 h-3 text-[var(--text-muted)] transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {isOpen && <div className="flex flex-col gap-3 pb-3">{children}</div>}
    </div>
  )
})

PanelSection.displayName = "PanelSection"

/**
 * Panel Divider - horizontal line between sections
 */
export const PanelDivider = memo(function PanelDivider() {
  return <div className="h-px bg-[var(--border-default)]" />
})

PanelDivider.displayName = "PanelDivider"

/**
 * Panel Container - wrapper for panel content
 */
export const PanelContainer = memo(function PanelContainer({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`w-full flex flex-col bg-[var(--surface-0)] border-r border-[var(--border-default)] h-full ${className}`}
    >
      {children}
    </div>
  )
})

PanelContainer.displayName = "PanelContainer"

/**
 * Panel Content - scrollable content area
 */
export const PanelContent = memo(function PanelContent({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4 ${className}`}>{children}</div>
  )
})

PanelContent.displayName = "PanelContent"

/**
 * Shared Toggle Component
 */
export const Toggle = memo(function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-0.5">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
        <div
          className={`w-9 h-5 rounded-full transition-colors ${checked ? "bg-[var(--accent-primary)]" : "bg-[var(--surface-3)]"}`}
        />
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </div>
      <div className="flex-1">
        <div className="text-sm text-[var(--text-primary)] group-hover:text-accent-text-white transition-colors">
          {label}
        </div>
        {description && <div className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</div>}
      </div>
    </label>
  )
})

Toggle.displayName = "Toggle"

/**
 * Shared Select Component
 */
export const Select = memo(function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string | number
  options: { value: string | number; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-[var(--text-tertiary)]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[var(--surface-0)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] appearance-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
})

Select.displayName = "Select"

/**
 * Shared Number Input Component
 */
export const NumberInput = memo(function NumberInput({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  unit?: string
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-[var(--text-tertiary)]">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 bg-[var(--surface-0)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
        />
        {unit && <span className="text-xs text-[var(--text-secondary)]">{unit}</span>}
      </div>
    </div>
  )
})

NumberInput.displayName = "NumberInput"

/**
 * Shared Action Button Component
 */
export const ActionButton = memo(function ActionButton({
  icon,
  label,
  onClick,
  disabled = false,
  variant = "default",
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  variant?: "default" | "danger"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border transition-all ${
        disabled
          ? "opacity-40 cursor-not-allowed border-[var(--border-default)] bg-[var(--hover-overlay)]"
          : variant === "danger"
            ? "border-[var(--border-default)] hover:border-red-500/30 hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400"
            : "border-[var(--border-default)] hover:border-[var(--border-emphasis)] hover:bg-[var(--hover-overlay)] text-[var(--text-tertiary)] hover:text-white"
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
})

ActionButton.displayName = "ActionButton"

/**
 * Info Card - for displaying metadata or info blocks
 */
export const InfoCard = memo(function InfoCard({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-[var(--surface-3)] rounded-lg border border-[var(--border-default)] p-3 ${className}`}>
      {children}
    </div>
  )
})

InfoCard.displayName = "InfoCard"

/**
 * Info Row - for key-value pairs in info cards
 */
export const InfoRow = memo(function InfoRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="text-[var(--text-primary)] font-mono">{value}</span>
    </div>
  )
})

InfoRow.displayName = "InfoRow"
