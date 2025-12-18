import { AlertCircle } from "lucide-react"

export function ApiKeyWarning() {
  return (
    <div className="fixed bottom-6 right-6 bg-[var(--surface-1)] border border-[var(--border-default)] rounded-lg p-4 shadow-2xl max-w-sm z-50 backdrop-blur-sm">
      <div className="flex gap-3">
        <AlertCircle className="w-5 h-5 text-[var(--text-secondary)] shrink-0 mt-0.5" />
        <div>
          <h3 className="text-[var(--text-primary)] font-semibold text-sm mb-1">AI Gateway API Key Required</h3>
          <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
            This playground requires an AI Gateway API key to generate images. Please add your{" "}
            <code className="bg-[var(--surface-3)] px-1.5 py-0.5 rounded text-[var(--text-primary)]">
              AI_GATEWAY_API_KEY
            </code>{" "}
            as an environment variable and redeploy.
          </p>
          <a
            href="https://vercel.com/docs/ai-gateway"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs underline mt-2 inline-block"
          >
            Learn how to get an API key →
          </a>
        </div>
      </div>
    </div>
  )
}
