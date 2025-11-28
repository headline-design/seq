import { TimelineEditor } from "@/components/timeline/timeline-editor"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Timeline Editor - Nano Banana Pro",
  description: "Professional magnetic timeline editor for video sequencing",
}

// The demo parameter is handled inside TimelineEditor via useSearchParams
export default function TimelinePage() {
  return <TimelineEditor />
}
