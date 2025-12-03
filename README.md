
# Seq - AI-Native Video Production Studio

![Seq Banner](/public/og-image.png)

[![Built with v0](https://img.shields.io/badge/Built%20with-v0-black?style=for-the-badge&logo=vercel)](https://v0.app)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://seq-studio.vercel.app)
<!-- Updated to Next.js 16 badge -->
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)

**From Concept to Cinema.**

[Live Demo](https://seq-studio.vercel.app) · [v0 Template](PLACEHOLDER_V0_TEMPLATE_URL) · [Report Bug](https://github.com/headline-design/seq/issues)

---

## Overview

Seq is the first AI-native NLE (Non-Linear Editor) designed for storytellers. Generate storyboards from text, animate panels with state-of-the-art video models, and edit everything on a professional timeline—all in one place.

### Features

🎬 **AI Storyboard Generator**
Transform text prompts into visual storyboards using Gemini 3 Pro Image via Vercel AI Gateway.

🎥 **Multi-Model Video Synthesis**
Choose the right model for every shot:

- **Veo 3.1 Fast** - Quick iterations and previews
- **Veo 3.1 Standard** - Balanced quality and speed
<!-- Corrected WAN model descriptions -->
- **WAN 2.2** - Frame-to-frame transitions with turbo mode
- **WAN 2.5** - Higher resolution output (up to 1080p native)

🔗 **First-to-Last Frame Generation**
Generate smooth transitions between storyboard panels with AI-powered bridging frames.

✂️ **Professional Timeline Editor**
Multi-track editing, ripple deletes, magnetic snapping, and real-time preview playback. A real NLE experience in the browser.

<!-- Corrected export specs -->
📤 **Browser-Based Export**
720p and 1080p MP4 export powered by FFmpeg WASM. All rendering happens client-side—no server uploads required.

---

## Quick Start

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/headline-design/seq)

### Or use the v0 Template

Visit [PLACEHOLDER_V0_TEMPLATE_URL] to start building with v0.

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

```plaintext
seq/
├── app/                    # Next.js App Router pages
│   ├── api/               # AI service endpoints
│   ├── storyboard/        # AI storyboard generator
│   ├── editor/            # Video editor (NLE)
│   ├── image-playground/  # Image generation sandbox
│   └── demo/              # Demo video showcase
├── seq-ai-studio/         # Core application modules
│   ├── editor/            # Timeline editor components
│   ├── storyboard/        # Storyboard generator
│   └── landing-page/      # Marketing site
└── components/            # Shared UI components
```

---

## Tech Stack

<!-- Updated tech stack to accurate versions -->
- **Framework:** Next.js 16 (App Router)
- **React:** React 19
- **Language:** TypeScript
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
  _Built with ❤️ by [HEADLINE](https://github.com/headline-design)_
</div>