"use client"

import type React from "react"

import { Component, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/seq/components/ui/button"

interface Props {
  children: ReactNode
  fallbackTitle?: string
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class PanelErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Panel error:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
            {this.props.fallbackTitle || "Something went wrong"}
          </h3>
          <p className="text-xs text-[var(--text-muted)] mb-4 max-w-[200px]">
            {this.state.error?.message || "An unexpected error occurred in this panel."}
          </p>
          <Button variant="outline" size="sm" onClick={this.handleReset} className="gap-2 bg-transparent">
            <RefreshCw className="w-3 h-3" />
            Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
