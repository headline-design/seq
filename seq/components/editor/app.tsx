"use client"

import type { MediaItem, StoryboardPanel, TimelineClip } from "./types"
import dynamic from "next/dynamic"
import { DEMO_FINAL_SEQUENCE } from "@/seq/lib/demo-data"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"

const Editor = dynamic(() => import("./components/editor").then((mod) => mod.Editor), { ssr: false })

function createDemoData() {
  const initialMedia: MediaItem[] = DEMO_FINAL_SEQUENCE.panels.map((p, i) => ({
    id: `media-${i}`,
    url: p.videoUrl,
    prompt: p.prompt,
    duration: p.duration,
    aspectRatio: DEMO_FINAL_SEQUENCE.videoConfig.aspectRatio,
    status: "ready" as const,
    type: "video" as const,
    resolution: { width: 1280, height: 720 },
  }))

  const initialClips: TimelineClip[] = []
  let startTime = 0

  initialMedia.forEach((m, i) => {
    initialClips.push({
      speed: 1,
      id: `clip-${i}`,
      mediaId: m.id,
      trackId: "v1",
      start: startTime,
      duration: m.duration,
      offset: 0,
      transition: undefined,
    })
    startTime += m.duration
  })

  const initialStoryboard: StoryboardPanel[] = DEMO_FINAL_SEQUENCE.panels.map((p, i) => ({
    id: `sb-${i}`,
    prompt: p.prompt,
    imageUrl: p.imageUrl,
    linkedImageUrl: p.linkedImageUrl,
    videoUrl: p.videoUrl,
    mediaId: `media-${i}`,
    status: "idle" as const,
    type: p.linkedImageUrl ? ("transition" as const) : ("scene" as const),
    duration: p.duration as 5 | 8,
  }))

  return { initialMedia, initialClips, initialStoryboard }
}

export { createDemoData }

function EditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const loadDemo = searchParams.get("demo") === "true"

  const demoData = loadDemo ? createDemoData() : null

  return (
    <Editor
      initialStoryboard={demoData?.initialStoryboard}
      initialMedia={demoData?.initialMedia}
      initialClips={demoData?.initialClips}
      onBack={() => {
        router.push("/")
      }}
    />
  )
}

function App() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-neutral-950 text-white">Loading editor...</div>
      }
    >
      <EditorContent />
    </Suspense>
  )
}

export default App
