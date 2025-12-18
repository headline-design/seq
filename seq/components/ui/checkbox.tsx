"use client"

import * as React from "react"
import * as CheckboxPrimitives from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/seq/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitives.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitives.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-[var(--border-strong)] shadow",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "disabled:cursor-not-allowed disabled:opacity-50",
      // Use tertiary color for checked state
      "data-[state=unchecked]:bg-[var(--surface-3)]",
      "data-[state=checked]:bg-[var(--tertiary)] data-[state=checked]:border-[var(--tertiary)]",
      "focus-visible:ring-[var(--tertiary-ring)]",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitives.Indicator className={cn("flex items-center justify-center text-white")}>
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </CheckboxPrimitives.Indicator>
  </CheckboxPrimitives.Root>
))
Checkbox.displayName = CheckboxPrimitives.Root.displayName

export { Checkbox }
