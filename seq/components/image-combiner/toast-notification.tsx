"use client"

import { cn } from "@/seq/lib/utils"
import { AlertCircle, CheckCircle } from "lucide-react"

interface ToastNotificationProps {
  message: string
  type: "success" | "error"
}

export function ToastNotification({ message, type }: ToastNotificationProps) {
  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300 select-none">
      <div
        className={cn(
          "bg-[var(--surface-2)]/95 backdrop-blur-sm border rounded-lg p-4 shadow-lg max-w-sm",
          type === "success"
            ? "border-[var(--success)]/30 text-[var(--success)]"
            : "border-[var(--error)]/30 text-[var(--error)]",
        )}
      >
        <div className="flex items-center gap-3">
          {type === "success" ? (
            <CheckCircle className="w-5 h-5 text-[var(--success)] shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-[var(--error)] shrink-0" />
          )}
          <p className="text-sm font-medium text-white">{message}</p>
        </div>
      </div>
    </div>
  )
}
