import { ImageCombiner } from "@/seq/components/image-combiner"
import type { Metadata } from "next"
import { AppShell } from "@/seq/components/app-shell"

export const metadata: Metadata = {
  title: "Image Playground - Seq",
  description:
    "AI-powered image generation and editing. Create stunning images from text, edit existing images with AI, and explore multiple aspect ratios. Powered by Google Gemini.",
}

export default function Home() {
  return (
    <AppShell>
      <ImageCombiner />
    </AppShell>
  )
}
