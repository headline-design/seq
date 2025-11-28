"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface HowItWorksModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HowItWorksModal({ open, onOpenChange }: HowItWorksModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-black/95 border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">How it works</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 text-sm text-gray-300 max-h-[60vh] overflow-y-auto pr-2">
          <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-teal-400 mb-2">Setup Required</h3>
            <p className="leading-relaxed mb-3">
              To use this playground, you need to add your Vercel AI Gateway API key as an environment variable:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>
                Get your API key from{" "}
                <a
                  href="https://vercel.com/ai-gateway"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-400 hover:text-teal-300 underline"
                >
                  Vercel AI Gateway
                </a>
              </li>
              <li>
                Add the environment variable{" "}
                <code className="px-1.5 py-0.5 bg-white/10 rounded text-xs">AI_GATEWAY_API_KEY</code> to your project
              </li>
              <li>Publish or Deploy</li>
            </ol>
          </div>
          {/* </CHANGE> */}

          <div>
            <h3 className="text-lg font-semibold text-white mb-2">About Nano Banana Pro</h3>
            <p className="leading-relaxed">
              Nano Banana Pro is Google's newest and most advanced AI image generation model. Built on cutting-edge
              diffusion technology, it delivers exceptional quality, speed, and creative control for both text-to-image
              generation and intelligent image editing. All generations are processed through the{" "}
              <a
                href="https://vercel.com/ai-gateway"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:text-teal-300 underline"
              >
                Vercel AI Gateway
              </a>
              , providing enterprise-grade reliability and performance.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Text-to-Image Generation</h3>
            <p className="leading-relaxed">
              Simply describe what you want to create in the prompt box and click Run. Nano Banana Pro will generate
              high-quality, photorealistic images from your text descriptions in seconds.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Image Editing</h3>
            <p className="leading-relaxed mb-2">
              Upload one or two images and describe the changes you want to make. The AI will intelligently edit your
              images based on your instructions.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Upload images by clicking the upload areas or drag and drop</li>
              <li>Paste image URLs directly for quick editing</li>
              <li>Combine multiple images with AI-powered composition</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Aspect Ratios</h3>
            <p className="leading-relaxed">
              Choose from multiple aspect ratios (1:1, 16:9, 9:16, 4:3, 3:4) to fit your needs. When uploading images,
              the app automatically detects the best aspect ratio.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Generation History</h3>
            <p className="leading-relaxed mb-2">All your generations are saved locally in your browser. You can:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>View and switch between previous generations</li>
              <li>Delete unwanted results</li>
              <li>Load a generated image as input for further editing</li>
              <li>Download or copy images to clipboard</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Keyboard Shortcuts</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">⌘/Ctrl + Enter</kbd> - Generate image
              </li>
              <li>
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">⌘/Ctrl + C</kbd> - Copy image to clipboard
              </li>
              <li>
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">⌘/Ctrl + D</kbd> - Download image
              </li>
              <li>
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">⌘/Ctrl + U</kbd> - Load generated image as
                input
              </li>
              <li>
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">Esc</kbd> - Close fullscreen viewer
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
