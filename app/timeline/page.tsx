import Editor from "@/seq-ai-studio/editor/app"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Timeline Editor - Seq",
  description: "Professional magnetic timeline editor for video sequencing",
}

// The demo parameter is handled inside TimelineEditor via useSearchParams
export default function TimelinePage() {
  return <Editor />
}
