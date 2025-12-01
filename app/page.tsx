import type { Metadata } from "next"
import { LandingPage } from "@/seq-ai-studio/landing-page/components/landing-page"

export const metadata: Metadata = {
  title: "Seq - AI-Powered Storyboard to Video Sequence Editor",
  description:
    "Transform storyboards into cinematic video sequences. Generate storyboard panels with AI, then assemble them in a professional magnetic timeline editor.",
}

export default function Home() {
  return <LandingPage />
}
