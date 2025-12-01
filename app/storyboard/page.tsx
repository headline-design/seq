"use client"

import { useState, useEffect } from "react"
import { MasterGenerator } from "@/components/automator/master-generator"
import { PanelProcessor } from "@/components/automator/panel-processor"
import { PanelSelector } from "@/components/automator/panel-selector"
import { StoryboardContainer } from "@/components/storyboard/storyboard-container"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save, Trash2, X, AlertTriangle, Info } from "lucide-react"
import Link from "next/link"
import { saveSession, loadSession, clearSession } from "@/lib/session-storage"
import { useToastContext } from "@/components/ui/sonner"
import { DevPanel } from "@/components/dev-panel"
import { TransitionGenerator } from "@/components/automator/transition-generator"
import { cn } from "@/lib/utils"
import { SeqLogo } from "@/components/ui/logo"

const STEPS = [
  { key: "prompt", label: "Generate", shortLabel: "1" },
  { key: "transition", label: "Transitions", shortLabel: "2" },
  { key: "process", label: "Process", shortLabel: "3" },
  { key: "selection", label: "Select", shortLabel: "4" },
  { key: "result", label: "Video", shortLabel: "5" },
] as const

export default function StoryboardPage() {
  const { toast } = useToastContext()
  const [step, setStep] = useState<"prompt" | "transition" | "process" | "selection" | "result">("prompt")
  const [masterData, setMasterData] = useState<{ url: string; prompt: string; panelCount: number } | null>(null)
  const [processedPanels, setProcessedPanels] = useState<string[]>([])
  const [finalPanels, setFinalPanels] = useState<string[]>([])
  const [linkedPanelData, setLinkedPanelData] = useState<Record<number, string>>({})
  const [hasLoadedSession, setHasLoadedSession] = useState(false)
  const [storageMode, setStorageMode] = useState<"persistent" | "temporal">("temporal")
  const [transitionPanels, setTransitionPanels] = useState<string[]>([])
  const [prompts, setPrompts] = useState<Record<number, string>>({})
  const [durations, setDurations] = useState<Record<number, number>>({})
  const [videoUrls, setVideoUrls] = useState<Record<number, string>>({})
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set())

  useEffect(() => {
    const savedMode = localStorage.getItem("storyboard-storage-mode") as "persistent" | "temporal" | null
    if (savedMode) {
      setStorageMode(savedMode)
    }
  }, [])

  useEffect(() => {
    const session = loadSession()
    if (session) {
      setStep(session.step)
      if (session.masterData) setMasterData(session.masterData)
      if (session.processedPanels) setProcessedPanels(session.processedPanels)
      if (session.finalPanels) setFinalPanels(session.finalPanels)
      if (session.linkedPanelData) setLinkedPanelData(session.linkedPanelData)
      if (session.transitionPanels) setTransitionPanels(session.transitionPanels)
      if (session.prompts) setPrompts(session.prompts)
      if (session.durations) setDurations(session.durations)
      if (session.videoUrls) setVideoUrls(session.videoUrls)
      setHasLoadedSession(true)
      toast.success("Session restored from previous work")
    }
  }, [toast])

  const handleMasterGenerated = (url: string, prompt: string, panelCount: number) => {
    const data = { url, prompt, panelCount }
    setMasterData(data)
    setStep("transition")
    saveSession({ step: "transition", masterData: data })
  }

  const handleTransitionGenerated = (panels: string[]) => {
    setTransitionPanels(panels)
    setStep("process")
    saveSession({ step: "process", transitionPanels: panels })
  }

  const handleTransitionSkipped = () => {
    setStep("process")
    saveSession({ step: "process" })
  }

  const handleProcessingComplete = (panels: string[]) => {
    setProcessedPanels(panels)
    setStep("selection")
    saveSession({ step: "selection", processedPanels: panels })
  }

  const handleSelectionComplete = (
    selectedPanels: string[],
    linkedPanelData: Record<number, string>,
    prompts?: Record<number, string>,
    durations?: Record<number, number>,
    videoUrls?: Record<number, string>,
  ) => {
    setFinalPanels(selectedPanels)
    setLinkedPanelData(linkedPanelData)
    if (prompts) setPrompts(prompts)
    if (durations) setDurations(durations)
    if (videoUrls) setVideoUrls(videoUrls)

    const sessionData = {
      step: "result" as const,
      masterData,
      processedPanels,
      transitionPanels,
      finalPanels: selectedPanels,
      linkedPanelData: linkedPanelData,
      prompts,
      durations,
      videoUrls: videoUrls || {},
      timestamp: Date.now(),
    }

    try {
      const jsonString = JSON.stringify(sessionData)
      localStorage.setItem("seq-storyboard-session", jsonString)
      toast.success(`Saved ${selectedPanels.length} panels`)
    } catch (error) {
      console.error("Failed to save to localStorage:", error)
      toast.error("Failed to save progress!")
    }

    setStep("result")
  }

  const handleSaveProgress = () => {
    saveSession({
      step,
      masterData: masterData || undefined,
      processedPanels: processedPanels.length > 0 ? processedPanels : undefined,
      finalPanels: finalPanels.length > 0 ? finalPanels : undefined,
      linkedPanelData: Object.keys(linkedPanelData).length > 0 ? linkedPanelData : undefined,
      transitionPanels: transitionPanels.length > 0 ? transitionPanels : undefined,
      prompts: Object.keys(prompts).length > 0 ? prompts : undefined,
      durations: Object.keys(durations).length > 0 ? durations : undefined,
      videoUrls: Object.keys(videoUrls).length > 0 ? videoUrls : undefined,
    })
    toast.success("Progress saved to browser storage")
  }

  const handleClearSession = () => {
    if (confirm("Clear all saved progress? This cannot be undone.")) {
      clearSession()
      setStep("prompt")
      setMasterData(null)
      setProcessedPanels([])
      setFinalPanels([])
      setLinkedPanelData({})
      setTransitionPanels([])
      setPrompts({})
      setDurations({})
      setVideoUrls({})
      toast.info("Session cleared")
    }
  }

  const handleStorageModeChange = (mode: "persistent" | "temporal") => {
    setStorageMode(mode)
    localStorage.setItem("storyboard-storage-mode", mode)
  }

  const dismissBanner = (id: string) => {
    setDismissedBanners((prev) => new Set([...prev, id]))
  }

  const getStepIndex = (s: string) => STEPS.findIndex((step) => step.key === s)
  const currentStepIndex = getStepIndex(step)

  const canNavigateToStep = (index: number) => {
    if (index === 0) return true
    if (index === 1) return !!masterData
    if (index === 2) return !!masterData
    if (index === 3) return processedPanels.length > 0
    if (index === 4) return finalPanels.length > 0
    return false
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DevPanel
        currentStep={step}
        masterData={masterData}
        processedPanels={processedPanels}
        finalPanels={finalPanels}
        storageMode={storageMode}
        linkedPanelData={linkedPanelData}
        transitionPanels={transitionPanels}
      />

      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6">
          {/* Top bar with logo and actions */}
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <SeqLogo className="w-6 h-6 text-foreground" />
              <div className="flex items-baseline gap-2">
                <h1 className="text-base font-semibold tracking-tight">Seq Storyboard</h1>
                <span className="text-xs text-muted-foreground hidden sm:inline">Video Sequence Editor</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Storage mode toggle - minimal design */}
              <div className="flex items-center h-7 bg-secondary rounded-md p-0.5">
                <button
                  onClick={() => handleStorageModeChange("temporal")}
                  className={cn(
                    "px-2.5 h-6 text-xs font-medium rounded transition-all",
                    storageMode === "temporal"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Temp
                </button>
                <button
                  onClick={() => handleStorageModeChange("persistent")}
                  className={cn(
                    "px-2.5 h-6 text-xs font-medium rounded transition-all",
                    storageMode === "persistent"
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Persist
                </button>
              </div>

              {step !== "prompt" && (
                <>
                  <Button variant="ghost" size="sm" onClick={handleSaveProgress} className="h-8 px-3 text-xs">
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSession}
                    className="h-8 px-3 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="py-3">
            <div className="flex items-center justify-between max-w-xl mx-auto">
              {STEPS.map((s, i) => {
                const isActive = i === currentStepIndex
                const isCompleted = i < currentStepIndex
                const canNavigate = canNavigateToStep(i)

                return (
                  <div key={s.key} className="flex items-center flex-1 last:flex-none">
                    <button
                      onClick={() => canNavigate && setStep(s.key as any)}
                      disabled={!canNavigate}
                      className={cn(
                        "flex flex-col items-center gap-1 group transition-all",
                        canNavigate ? "cursor-pointer" : "cursor-not-allowed",
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all border-2",
                          isActive
                            ? "bg-foreground text-background border-foreground"
                            : isCompleted
                              ? "bg-foreground/20 text-foreground border-foreground/40"
                              : canNavigate
                                ? "bg-transparent text-muted-foreground border-border hover:border-foreground/50"
                                : "bg-transparent text-muted-foreground/50 border-border/50",
                        )}
                      >
                        {s.shortLabel}
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-medium transition-colors",
                          isActive ? "text-foreground" : isCompleted ? "text-foreground/70" : "text-muted-foreground",
                        )}
                      >
                        {s.label}
                      </span>
                    </button>
                    {i < STEPS.length - 1 && (
                      <div
                        className={cn(
                          "flex-1 h-px mx-2 transition-colors",
                          i < currentStepIndex ? "bg-foreground/40" : "bg-border",
                        )}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {storageMode === "temporal" && step !== "prompt" && !dismissedBanners.has("temporal") && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-secondary/50 border border-border rounded-lg text-sm">
            <AlertTriangle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <p className="text-muted-foreground flex-1">
              <span className="font-medium text-foreground">Temporary mode</span> — Work is stored in memory. Save
              before leaving or refreshing.
            </p>
            <button
              onClick={() => dismissBanner("temporal")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {hasLoadedSession &&
          step !== "prompt" &&
          !dismissedBanners.has("session") &&
          !dismissedBanners.has("temporal") === false && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-secondary/50 border border-border rounded-lg text-sm">
              <Info className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <p className="text-muted-foreground flex-1">
                <span className="font-medium text-foreground">Session restored</span> — Continue where you left off or
                clear to start fresh.
              </p>
              <button
                onClick={() => dismissBanner("session")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

        {step === "prompt" && <MasterGenerator onGenerate={handleMasterGenerated} />}

        {step === "transition" && masterData && (
          <TransitionGenerator
            masterUrl={masterData.url}
            masterPrompt={masterData.prompt}
            storageMode={storageMode}
            onGenerate={handleTransitionGenerated}
            onSkip={handleTransitionSkipped}
          />
        )}

        {step === "process" && masterData && (
          <PanelProcessor
            masterUrl={masterData.url}
            masterPrompt={masterData.prompt}
            panelCount={masterData.panelCount}
            storageMode={storageMode}
            onComplete={handleProcessingComplete}
          />
        )}

        {step === "selection" && masterData && (
          <PanelSelector
            panels={processedPanels}
            masterUrl={masterData.url}
            transitionPanels={transitionPanels}
            savedFinalPanels={finalPanels.length > 0 ? finalPanels : []}
            savedLinkedPanelData={Object.keys(linkedPanelData).length > 0 ? linkedPanelData : {}}
            savedPrompts={prompts}
            savedDurations={durations}
            savedVideoUrls={videoUrls}
            onConfirm={handleSelectionComplete}
          />
        )}

        {step === "result" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Your Storyboard is Ready</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Your selected panels are ready. Generate videos for each panel using Veo3, Wan2.1, or Wan2.5.
              </p>
            </div>

            <StoryboardContainer
              initialPanels={finalPanels}
              linkedPanelData={linkedPanelData}
              prompts={prompts}
              durations={durations}
              videoUrls={videoUrls}
            />
          </div>
        )}
      </main>
    </div>
  )
}
