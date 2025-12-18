"use client"

import { useState, useEffect } from "react"
import { MasterGenerator } from "@/seq/components/automator/master-generator"
import { PanelProcessor } from "@/seq/components/automator/panel-processor"
import { PanelSelector } from "@/seq/components/automator/panel-selector"
import { StoryboardContainer } from "@/seq/components/storyboard/storyboard-container"
import { Button } from "@/seq/components/ui/button"
import { Save, Trash2, X, AlertTriangle, Info, Check, Wand2, Layers, Settings, LayoutGrid, Film } from "lucide-react"
import { saveSession, loadSession, clearSession } from "@/seq/lib/session-storage"
import { useToastContext } from "@/seq/components/ui/sonner"
import { DevPanel } from "@/seq/components/dev-panel"
import { TransitionGenerator } from "@/seq/components/automator/transition-generator"
import { cn } from "@/seq/lib/utils"
import { AppShell } from "@/seq/components/app-shell"

const STEPS = [
  { key: "prompt", label: "Generate", icon: Wand2 },
  { key: "transition", label: "Transitions", icon: Layers },
  { key: "process", label: "Process", icon: Settings },
  { key: "selection", label: "Select", icon: LayoutGrid },
  { key: "result", label: "Video", icon: Film },
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

  const handleStorageModeChange = (mode: string) => {
    const storageValue = mode as "persistent" | "temporal"
    setStorageMode(storageValue)
    localStorage.setItem("storyboard-storage-mode", storageValue)
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
    <AppShell>
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

        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
          <div className="px-6">
            {/* Top bar */}
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                <h1 className="text-page-title">Storyboard</h1>
                <span className="text-xs text-muted-foreground hidden sm:inline">Video Sequence Editor</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Storage mode */}
                <div className="flex p-0.5 rounded-lg bg-muted/50">
                  <button
                    onClick={() => handleStorageModeChange("temporal")}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                      storageMode === "temporal"
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Temp
                  </button>
                  <button
                    onClick={() => handleStorageModeChange("persistent")}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                      storageMode === "persistent"
                        ? "bg-muted text-foreground"
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
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="py-4">
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                {STEPS.map((s, i) => {
                  const isActive = i === currentStepIndex
                  const isCompleted = i < currentStepIndex
                  const canNavigate = canNavigateToStep(i)
                  const Icon = s.icon

                  return (
                    <div key={s.key} className="flex items-center flex-1 last:flex-none">
                      <button
                        onClick={() => canNavigate && setStep(s.key as typeof step)}
                        disabled={!canNavigate}
                        className={cn(
                          "flex flex-col items-center gap-1.5 group transition-all",
                          canNavigate ? "cursor-pointer" : "cursor-not-allowed opacity-40",
                        )}
                      >
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-lg"
                              : isCompleted
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "bg-muted text-muted-foreground border border-border hover:border-border-emphasis",
                          )}
                        >
                          {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <span
                          className={cn(
                            "text-[10px] font-medium transition-colors",
                            isActive ? "text-foreground" : isCompleted ? "text-primary" : "text-muted-foreground",
                          )}
                        >
                          {s.label}
                        </span>
                      </button>
                      {i < STEPS.length - 1 && (
                        <div className="flex-1 flex items-center px-3">
                          <div
                            className={cn(
                              "flex-1 h-px transition-colors",
                              i < currentStepIndex ? "bg-primary/50" : "bg-border",
                            )}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </header>

        <main className="px-6 py-6 max-w-6xl mx-auto">
          {storageMode === "temporal" && step !== "prompt" && !dismissedBanners.has("temporal") && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-foreground/80 flex-1">
                <span className="font-medium text-amber-400">Temporary mode</span> — Save before leaving.
              </p>
              <button
                onClick={() => dismissBanner("temporal")}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {hasLoadedSession && step !== "prompt" && !dismissedBanners.has("session") && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-muted border border-border rounded-xl text-sm">
              <Info className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <p className="text-muted-foreground flex-1">
                <span className="font-medium text-foreground">Session restored</span> — Continue or clear to start
                fresh.
              </p>
              <button
                onClick={() => dismissBanner("session")}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step Content */}
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
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-3">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  Ready to produce
                </div>
                <h2 className="text-xl font-semibold mb-2">Storyboard Complete</h2>
                <p className="text-sm text-muted-foreground">
                  Generate videos for each panel, then export your sequence.
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
    </AppShell>
  )
}
