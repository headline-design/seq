import type { AspectRatioOption } from "./types"

export const DEFAULT_ASPECT_RATIOS: AspectRatioOption[] = [
  {
    value: "square",
    label: "1:1",
    ratio: 1,
    icon: (
      <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
        <rect x="6" y="6" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
  {
    value: "portrait",
    label: "9:16",
    ratio: 9 / 16,
    icon: (
      <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
        <rect x="8" y="4" width="8" height="16" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
  {
    value: "landscape",
    label: "16:9",
    ratio: 16 / 9,
    icon: (
      <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
        <rect x="4" y="8" width="16" height="8" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
  {
    value: "wide",
    label: "21:9",
    ratio: 21 / 9,
    icon: (
      <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
        <rect x="2" y="9" width="20" height="6" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
]

export const ALL_ASPECT_RATIOS: AspectRatioOption[] = [
  ...DEFAULT_ASPECT_RATIOS,
  {
    value: "4:3",
    label: "4:3",
    ratio: 4 / 3,
    icon: (
      <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
        <rect x="5" y="7" width="14" height="10" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
  {
    value: "3:2",
    label: "3:2",
    ratio: 3 / 2,
    icon: (
      <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
        <rect x="4" y="8" width="16" height="8" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
  {
    value: "2:3",
    label: "2:3",
    ratio: 2 / 3,
    icon: (
      <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
        <rect x="8" y="4" width="8" height="16" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
  {
    value: "3:4",
    label: "3:4",
    ratio: 3 / 4,
    icon: (
      <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
        <rect x="7" y="5" width="10" height="14" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
  {
    value: "5:4",
    label: "5:4",
    ratio: 5 / 4,
    icon: (
      <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
        <rect x="5" y="7" width="14" height="10" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
  {
    value: "4:5",
    label: "4:5",
    ratio: 4 / 5,
    icon: (
      <svg className="w-3 h-3 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
        <rect x="7" y="5" width="10" height="14" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
]
