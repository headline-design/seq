import { ImageCombiner } from "@/seq/components/image-combiner"
import type { Metadata } from "next"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { Button } from "@/seq/components/ui/button"

export const metadata: Metadata = {
  title: "Nano Banana Pro - Free AI Image Generator & Editor",
  description:
    "Nano Banana Pro is your go-to AI image generation tool. Create stunning images from text, edit existing images with AI, and explore multiple aspect ratios. Powered by Google Gemini 2.5 Flash Image.",
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background relative">
      <div className="absolute top-4 right-4 z-50">
        <Link href="/automator">
          <Button
            variant="outline"
            className="bg-black/50 backdrop-blur-md border-white/10 text-white hover:bg-indigo-600 hover:text-white hover:border-transparent transition-all shadow-lg"
          >
            <Sparkles className="mr-2 h-4 w-4 text-indigo-400" />
            Storyboard Automator
          </Button>
        </Link>
      </div>
      <ImageCombiner />
    </main>
  )
}
