"use client"

import type React from "react"
import { useState, createContext, useContext, useCallback, useMemo } from "react"

interface ToastMessage {
  id: string
  message: string
  type: "success" | "error" | "info"
}

interface ToastContextType {
  toasts: ToastMessage[]
  toast: {
    success: (message: string) => void
    error: (message: string) => void
    info: (message: string) => void
  }
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToastContext() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Return a no-op if outside provider
    return {
      toasts: [],
      toast: {
        success: () => {},
        error: () => {},
        info: () => {},
      },
    }
  }
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((message: string, type: ToastMessage["type"]) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const toast = useMemo(
    () => ({
      success: (message: string) => addToast(message, "success"),
      error: (message: string) => addToast(message, "error"),
      info: (message: string) => addToast(message, "info"),
    }),
    [addToast],
  )

  const value = useMemo(() => ({ toasts, toast }), [toasts, toast])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function Toaster() {
  const { toasts } = useToastContext()

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg text-sm font-medium shadow-lg animate-in slide-in-from-right-5 fade-in duration-200 ${
            t.type === "error"
              ? "bg-destructive text-destructive-foreground"
              : t.type === "success"
                ? "bg-secondary text-foreground border border-border"
                : "bg-secondary text-foreground border border-border"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

// Standalone toast function for components that import { toast } from "sonner"
let globalToast: ToastContextType["toast"] | null = null

export function setGlobalToast(toast: ToastContextType["toast"]) {
  globalToast = toast
}

export const toast = {
  success: (message: string) => globalToast?.success(message),
  error: (message: string) => globalToast?.error(message),
  info: (message: string) => globalToast?.info(message),
}
