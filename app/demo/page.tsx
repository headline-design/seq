import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Play, Sparkles, Film, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SeqLogo } from "@/components/ui/logo"

export const metadata: Metadata = {
  title: "Demo Video - Seq",
  description: "A live-action reimagining of the iconic Ratatouille flashback scene, created entirely with Seq.",
}

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <SeqLogo className="w-6 h-6 text-foreground" />
              <div className="flex items-baseline gap-2">
                <h1 className="text-base font-semibold tracking-tight">Demo</h1>
                <span className="text-xs text-muted-foreground hidden sm:inline">Made with Seq</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/storyboard">
                <Button variant="outline" size="sm" className="h-8 px-3 text-xs bg-transparent">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Try Storyboard
                </Button>
              </Link>
              <Link href="/timeline">
                <Button size="sm" className="h-8 px-3 text-xs">
                  Open Editor
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300 mb-6">
            <Play className="w-3 h-3" />
            Demo Showcase
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">"Anyone Can Cook"</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-balance">
            A live-action reimagining of the iconic flashback scene from Ratatouille — where a single bite transports a
            hardened critic back to the warmth of his mother's kitchen. Made entirely with Seq.
          </p>
        </div>

        {/* Video Player */}
        <div className="relative mb-12 group">
          <div className="absolute -inset-1 bg-gradient-to-b from-indigo-500/20 to-transparent rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
          <div className="relative bg-[#09090b] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            <video src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/git-blob/prj_y6denQY7uSeu9lM3GpnpQCz5KYdE/fbU5DYKN4uclkGtJg_2gXP/public/demo.mp4" controls className="w-full aspect-video bg-black" poster="/demo-poster.png" />
          </div>
        </div>

        {/* How It Was Made Section */}
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">How We Made This</h3>
            <p className="text-muted-foreground text-sm">Recreating cinematic magic with AI-powered tools</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Storyboard Tool */}
            <div className="p-6 rounded-xl bg-secondary/50 border border-border hover:border-indigo-500/30 transition-colors group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold mb-2">Seq Storyboard</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    We described the emotional arc of the scene — the critic's first bite, the rush of memory, and the
                    childhood kitchen. The <strong>Master Generator</strong> created each panel with consistent
                    character design, then we added <strong>transition frames</strong> for the dreamy flashback effect.
                  </p>
                  <Link href="/storyboard">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      Try Storyboard
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Timeline Editor */}
            <div className="p-6 rounded-xl bg-secondary/50 border border-border hover:border-purple-500/30 transition-colors group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-110 transition-transform">
                  <Film className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold mb-2">Seq Timeline Editor</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    We arranged the generated clips on the <strong>magnetic timeline</strong>, layering the present-day
                    restaurant scene with the soft-focus childhood memories. Added ambient audio and used the{" "}
                    <strong>in-browser render engine</strong> to export the final cut.
                  </p>
                  <Link href="/timeline">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-purple-400 hover:text-purple-300"
                    >
                      Open Editor
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="text-center pt-8 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">Powered by</p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Gemini 3 Pro
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Veo 3.1
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Wan 2.5
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer CTA */}
      <footer className="border-t border-border bg-secondary/30 py-12">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h3 className="text-xl font-semibold mb-3">Ready to create your own?</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-lg mx-auto">
            Start with a simple prompt and let Seq handle the rest — from storyboard to final cut.
          </p>
          <Link href="/storyboard">
            <Button size="lg" className="h-11 px-8">
              <Sparkles className="w-4 h-4 mr-2" />
              Start Creating
            </Button>
          </Link>
        </div>
      </footer>
    </div>
  )
}
