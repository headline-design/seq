"use client"

import { memo, useState, useEffect, useCallback } from "react"
import { DownloadIcon, CheckCircleIcon } from "./icons"

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  onStartExport: (resolution: "720p" | "1080p") => void
  isExporting: boolean
  exportProgress: number
  exportPhase: "idle" | "init" | "audio" | "video" | "encoding" | "complete"
  downloadUrl: string | null
  onCancel: () => void
  hasRenderedPreview?: boolean
  ffmpegError?: string | null
}

const getPhaseInfo = (phase: ExportModalProps["exportPhase"], progress: number) => {
  switch (phase) {
    case "init":
      return { label: "Initializing", detail: "Loading FFmpeg engine...", showProgress: false }
    case "audio":
      return { label: "Processing Audio", detail: "Mixing audio tracks and applying effects...", showProgress: true }
    case "video":
      return { label: "Rendering Frames", detail: `Rendering video frames...`, showProgress: true }
    case "encoding":
      return { label: "Encoding Video", detail: "Finalizing MP4 file...", showProgress: true }
    case "complete":
      return { label: "Complete", detail: "Export finished!", showProgress: false }
    default:
      return { label: "Preparing", detail: "Getting ready...", showProgress: false }
  }
}

const StepIndicator = memo(function StepIndicator({
  exportPhase,
}: {
  exportPhase: ExportModalProps["exportPhase"]
}) {
  const phases = ["init", "audio", "video", "encoding", "complete"]
  const currentIdx = phases.indexOf(exportPhase)

  return (
    <div className="flex items-center justify-between px-2">
      {(["audio", "video", "encoding"] as const).map((step, idx) => {
        const stepLabels = { audio: "Audio", video: "Video", encoding: "Encode" }
        const stepIdx = phases.indexOf(step)
        const isActive = exportPhase === step
        const isComplete = currentIdx > stepIdx

        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${
                  isComplete
                    ? "bg-emerald-500 text-white"
                    : isActive
                      ? "bg-indigo-500 text-white ring-4 ring-indigo-500/30"
                      : "bg-neutral-800 text-neutral-500"
                }
              `}
              >
                {isComplete ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`text-[10px] mt-1.5 font-medium ${isActive ? "text-indigo-400" : isComplete ? "text-emerald-400" : "text-neutral-600"}`}
              >
                {stepLabels[step]}
              </span>
            </div>
            {idx < 2 && <div className={`h-0.5 flex-1 mx-1 ${isComplete ? "bg-emerald-500" : "bg-neutral-800"}`} />}
          </div>
        )
      })}
    </div>
  )
})

const ResolutionSelector = memo(function ResolutionSelector({
  resolution,
  onSelect,
  hasRenderedPreview,
}: {
  resolution: "720p" | "1080p"
  onSelect: (res: "720p" | "1080p") => void
  hasRenderedPreview: boolean
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => onSelect("1080p")}
        className={`p-3 rounded-lg border text-left transition-all ${resolution === "1080p" ? "bg-indigo-500/10 border-indigo-500" : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"}`}
      >
        <div className={`text-sm font-medium ${resolution === "1080p" ? "text-indigo-200" : "text-neutral-300"}`}>
          1080p High
        </div>
        <div className="text-[10px] text-neutral-500 mt-1">1920x1080 - Best quality</div>
      </button>
      <button
        onClick={() => onSelect("720p")}
        className={`p-3 rounded-lg border text-left transition-all ${resolution === "720p" ? "bg-indigo-500/10 border-indigo-500" : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"}`}
      >
        <div className={`text-sm font-medium ${resolution === "720p" ? "text-indigo-200" : "text-neutral-300"}`}>
          720p Fast
        </div>
        <div className="text-[10px] text-neutral-500 mt-1">
          1280x720 - {hasRenderedPreview ? "Instant export" : "Faster export"}
        </div>
      </button>
    </div>
  )
})

export const ExportModal = memo(function ExportModal({
  isOpen,
  onClose,
  onStartExport,
  isExporting,
  exportProgress,
  exportPhase,
  downloadUrl,
  onCancel,
  hasRenderedPreview = false,
  ffmpegError,
}: ExportModalProps) {
  const [resolution, setResolution] = useState<"720p" | "1080p">("1080p")
  const [isInitializing, setIsInitializing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsInitializing(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (isExporting) {
      setIsInitializing(false)
    }
  }, [isExporting])

  useEffect(() => {
    if (ffmpegError) {
      setIsInitializing(false)
    }
  }, [ffmpegError])

  const handleStartClick = useCallback(async () => {
    setIsInitializing(true)
    onStartExport(resolution)
  }, [onStartExport, resolution])

  const handleResolutionChange = useCallback((res: "720p" | "1080p") => {
    setResolution(res)
  }, [])

  if (!isOpen) return null

  const willReusePreview = hasRenderedPreview && resolution === "720p"
  const phaseInfo = getPhaseInfo(exportPhase, exportProgress)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#18181b] border border-neutral-700 rounded-xl shadow-2xl w-[500px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-14 px-6 flex items-center justify-between border-b border-neutral-800 bg-[#09090b]">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Export Video</h3>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors"
            disabled={isExporting}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {ffmpegError ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-2">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-white">Export Unavailable</h4>
              <p className="text-sm text-neutral-400 text-center max-w-sm">{ffmpegError}</p>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setIsInitializing(true)
                    onStartExport(resolution)
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : downloadUrl ? (
            <div className="flex flex-col items-center gap-4 py-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                <CheckCircleIcon className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-semibold text-white">Export Complete!</h4>

              <a
                href={downloadUrl}
                download="project_export.mp4"
                className="mt-2 w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all shadow-lg"
              >
                <DownloadIcon className="w-4 h-4" />
                Download MP4
              </a>
              <button onClick={onClose} className="text-sm text-neutral-500 hover:text-white">
                Close
              </button>
            </div>
          ) : isExporting || isInitializing ? (
            <div className="flex flex-col gap-5 py-4">
              <StepIndicator exportPhase={exportPhase} />

              {/* Current phase info */}
              <div className="text-center">
                <p className="text-sm font-medium text-white">{phaseInfo.label}</p>
                <p className="text-xs text-neutral-500 mt-1">{phaseInfo.detail}</p>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                  {exportPhase === "init" ? (
                    <div className="h-full bg-indigo-500/50 w-full animate-pulse" />
                  ) : (
                    <div
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${exportProgress}%` }}
                    />
                  )}
                </div>
                {phaseInfo.showProgress && (
                  <div className="flex justify-end">
                    <span className="text-xs text-indigo-400 font-medium">{Math.round(exportProgress)}%</span>
                  </div>
                )}
              </div>

              <button onClick={onCancel} className="mt-1 text-sm text-red-400 hover:text-red-300 transition-colors">
                Cancel Export
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {hasRenderedPreview && resolution === "720p" ? (
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-emerald-200 font-medium">Ready for fast export</p>
                    <p className="text-xs text-emerald-400/80 mt-1">
                      Your rendered preview will be used. Export will complete in seconds.
                    </p>
                  </div>
                </div>
              ) : hasRenderedPreview && resolution === "1080p" ? (
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-400 shrink-0 mt-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                  <div>
                    <p className="text-sm text-blue-200 font-medium">Full render required for 1080p</p>
                    <p className="text-xs text-blue-400/80 mt-1">
                      Your preview is 720p. Choose 720p for instant export, or continue with 1080p for a fresh render at
                      higher quality.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-amber-400 shrink-0 mt-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <div>
                    <p className="text-sm text-amber-200 font-medium">Preview not rendered</p>
                    <p className="text-xs text-amber-400/80 mt-1">
                      We recommend using the <span className="font-semibold">Render</span> button in the timeline to
                      preview your video before exporting. This helps catch any issues before the full export.
                    </p>
                  </div>
                </div>
              )}

              {/* Resolution */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-neutral-500 uppercase">Quality</label>
                <ResolutionSelector
                  resolution={resolution}
                  onSelect={handleResolutionChange}
                  hasRenderedPreview={hasRenderedPreview}
                />
              </div>

              <button
                onClick={handleStartClick}
                className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition-colors shadow-lg mt-2 flex items-center justify-center gap-2"
              >
                {willReusePreview ? "Export Now" : "Start Export"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

ExportModal.displayName = "ExportModal"
