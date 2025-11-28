"use client"

import { cn } from "@/lib/utils"
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
          "bg-black/90 backdrop-blur-sm border p-4 shadow-lg max-w-sm",
          type === "success" ? "border-green-500/50 text-green-100" : "border-gray-500/50 text-gray-100",
        )}
      >
        <div className="flex items-center gap-3">
          {type === "success" ? (
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{message}</p>
        </div>
      </div>
    </div>
  )
}
