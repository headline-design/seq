# Seq - AI-Native Video Production Studio

![Seq Banner](/public/og-image.png)

[![Built with v0](https://img.shields.io/badge/Built%20with-v0-black?style=for-the-badge&logo=vercel)](https://v0.app)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://seq-studio.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)

**From Concept to Cinema.**

[Live Demo](https://seq-studio.vercel.app) · [v0 Template](https://v0.app/templates/seq-ZAICjqmFe5w) · [Report Bug](https://github.com/headline-design/seq/issues)

---

## Overview

Seq is the first AI-native NLE (Non-Linear Editor) designed for storytellers. Generate storyboards from text, animate panels with state-of-the-art video models, and edit everything on a professional timeline—all in one place.

### Features

**AI Storyboard Generator**
Transform text prompts into visual storyboards using Gemini 3 Pro Image via Vercel AI Gateway.

**Multi-Model Video Synthesis**
Choose the right model for every shot:

- **Veo 3.1 Fast** - Quick iterations and previews
- **Veo 3.1 Standard** - Balanced quality and speed
- **WAN 2.2** - Frame-to-frame transitions with turbo mode
- **WAN 2.5** - Higher resolution output (up to 1080p native)

**First-to-Last Frame Generation**
Generate smooth transitions between storyboard panels with AI-powered bridging frames.

**Professional Timeline Editor**
Multi-track editing, ripple deletes, magnetic snapping, and real-time preview playback. A real NLE experience in the browser.

**Browser-Based Export**
720p and 1080p MP4 export powered by FFmpeg WASM. All rendering happens client-side—no server uploads required.

---

## Quick Start

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/headline-design/seq)

### Or use the v0 Template

Visit [v0 Template](https://v0.app/templates/seq-ZAICjqmFe5w) to start building with v0.

### Local Development

```bash
# Clone the repository
git clone https://github.com/headline-design/seq.git
cd seq

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your API keys to .env.local

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Architecture

Seq uses a modular architecture designed for maintainability and extensibility. Each feature is self-contained with its own components, hooks, and utilities.

```plaintext
seq/
├── app/                              # Next.js App Router
│   ├── api/seq/                      # Namespaced API routes
│   │   ├── analyze-storyboard/       # Storyboard analysis endpoint
│   │   ├── enhance-prompt/           # AI prompt enhancement
│   │   ├── enhance-text/             # Text enhancement
│   │   ├── generate-image/           # Image generation
│   │   ├── generate-video/           # Video generation
│   │   ├── fal/proxy/                # fal.ai proxy
│   │   └── upscale/                  # Image upscaling
│   ├── demo/                         # Demo video showcase
│   ├── image-playground/             # Image generation sandbox
│   ├── storyboard/                   # AI storyboard generator
│   └── timeline/                     # Video editor (NLE)
│
├── seq/                              # Core Seq modules
│   ├── components/
│   │   ├── editor/                   # Timeline Editor module
│   │   │   ├── components/           # Editor UI components (37 files)
│   │   │   │   └── storyboard/       # Storyboard integration
│   │   │   ├── hooks/                # Editor-specific hooks (16 hooks)
│   │   │   ├── utils/                # Timeline utilities
│   │   │   ├── context/              # Editor state context
│   │   │   ├── services/             # Project persistence
│   │   │   └── data/                 # Demo project data
│   │   │
│   │   ├── image-combiner/           # Image Playground module
│   │   │   ├── hooks/                # Image generation hooks
│   │   │   └── *.tsx                 # UI components
│   │   │
│   │   ├── landing-page/             # Marketing site module
│   │   │   └── components/           # Landing page components
│   │   │
│   │   ├── storyboard/               # Storyboard module
│   │   │   └── *.tsx                 # Storyboard components
│   │   │
│   │   ├── automator/                # AI Automation tools
│   │   │   ├── master-generator.tsx  # Batch generation
│   │   │   ├── panel-processor.tsx   # Panel processing
│   │   │   └── transition-generator.tsx
│   │   │
│   │   └── ui/                       # Seq-specific UI components
│   │
│   ├── hooks/                        # Shared hooks
│   └── lib/                          # Shared utilities
│       ├── fal-client.ts             # fal.ai client
│       ├── session-storage.ts        # Browser storage
│       └── utils.ts                  # Common utilities
│
├── components/                       # Global shadcn/ui components
│   └── ui/                           # Base UI primitives
│
└── hooks/                            # Global hooks
```

### Module Structure

Each feature module follows a consistent pattern:

| Folder | Purpose |
|--------|---------|
| `components/` | UI components specific to the feature |
| `hooks/` | Custom React hooks for state and logic |
| `utils/` | Pure utility functions |
| `context/` | React context providers |
| `types.ts` | TypeScript type definitions |
| `constants.ts` | Configuration constants |

### Editor Module (v0.2 Refactor)

The timeline editor underwent a major refactor in v0.2, reducing the main editor file from 3,000+ lines to ~1,500 lines by extracting logic into dedicated hooks:

| Hook | Purpose |
|------|---------|
| `use-timeline-state` | Core timeline state management |
| `use-timeline-drag` | Drag and drop with magnetic snapping |
| `use-timeline-selection` | Multi-select and marquee selection |
| `use-timeline-snap` | Snap-to-grid and clip alignment |
| `use-playback` | Playback controls and scrubbing |
| `use-timeline-keyboard` | Keyboard shortcuts |
| `use-editor-keyboard` | Global editor shortcuts |
| `use-media-management` | File import and media handling |
| `use-media-generation` | AI video/image generation |
| `use-accessibility` | Reduced motion and ARIA support |
| `use-ffmpeg` | Video export with FFmpeg WASM |
| `use-storyboard` | Storyboard panel integration |
| `use-virtualized-clips` | Performance optimization |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **React:** React 19
- **Language:** TypeScript (99%+ coverage)
- **Styling:** Tailwind CSS 4
- **AI Integration:** Vercel AI SDK, AI Gateway
- **Image Generation:** Gemini 3 Pro Image
- **Video Generation:** Veo 3.1, WAN 2.2, WAN 2.5 (via fal.ai)
- **Export:** FFmpeg WASM
- **Storage:** Vercel Blob
- **Audio:** Web Audio API
- **Video:** Canvas API

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway key for Gemini access |
| `FAL_KEY` | fal.ai API key for video model access |
| `BLOB_READ_WRITE_TOKEN` | (Optional) Vercel Blob for persistent storage |

---

## Workflow

1. **Storyboard** - Describe scenes in natural language, Gemini generates visual panels
2. **Generate** - Animate panels with Veo 3.1 or WAN models
3. **Edit** - Arrange clips on the timeline, adjust timing
4. **Preview** - Render and review your sequence at 720p
5. **Export** - Download as MP4 (720p or 1080p)

---

## What's New in v0.2

### Architecture
- Modular folder structure with self-contained feature modules
- API routes namespaced under `/api/seq/`
- Editor refactored from 3,000+ to ~1,500 lines using custom hooks

### Editor UX
- Empty states for timeline, preview, and track headers
- Magnetic snap-then-overlap drag behavior
- Tooltips with keyboard shortcuts on all buttons
- Hidden scrollbars on toolbars and sidebars
- Default single video/audio track

### Accessibility
- Reduced motion support via `prefers-reduced-motion`
- High contrast mode support
- Enhanced ARIA labels on timeline and preview

### Code Quality
- TypeScript `any` types eliminated (99%+ type coverage)
- Debug console.log statements cleaned up
- User-facing toast notifications for all operations

---

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- Built with [v0](https://v0.app) by Vercel
- Built with the Nano Banana Pro template
- AI models powered by [fal.ai](https://fal.ai) and Vercel AI Gateway
- Inspired by professional NLEs like DaVinci Resolve and Premiere Pro

---

<div align="center">
  Built with care by <a href="https://github.com/headline-design">HEADLINE</a>
</div>
