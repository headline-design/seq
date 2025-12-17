"use client"

import * as React from "react"
import { User, Edit, RotateCcw, Palette, LogOut, ChevronRight } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/seq/components/ui/avatar"
import * as Popover from "@radix-ui/react-popover"

interface UserMenuProps {
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const defaultUser = {
    name: user?.name || "John Doe",
    email: user?.email || "john.doe@example.com",
    avatar:
      user?.avatar ||
      `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(user?.email || "john.doe@example.com")}`,
  }

  const [open, setOpen] = React.useState(false)

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <div className="relative p-2">
          <Avatar className="size-8">
            <AvatarImage src={defaultUser.avatar || "/placeholder.svg"} alt={defaultUser.name} />
            <AvatarFallback className="bg-gradient-to-br from-orange-400 via-purple-500 to-blue-500 text-white text-xs font-semibold">
              {defaultUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Popover.Trigger asChild>
            <button className="absolute inset-0 cursor-pointer outline-none" aria-label="Open user menu" />
          </Popover.Trigger>
        </div>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          align="start"
          side="bottom"
          sideOffset={-48}
          alignOffset={0}
          className="w-[300px] bg-neutral-900/95 backdrop-blur-xl border border-[var(--border-default)] rounded-2xl shadow-2xl z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 outline-none"
        >
          <div className="flex items-center gap-3 p-2">
            <Avatar className="size-8">
              <AvatarImage src={defaultUser.avatar || "/placeholder.svg"} alt={defaultUser.name} />
              <AvatarFallback className="bg-gradient-to-br from-orange-400 via-purple-500 to-blue-500 text-white text-xs font-semibold">
                {defaultUser.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{defaultUser.name}</p>
              <p className="text-neutral-400 text-xs truncate">{defaultUser.email}</p>
            </div>
          </div>

          <div className="h-px bg-[var(--border-default)] mx-3 my-1" />

          <div className="px-2 py-2">
            <MenuItem icon={<User className="size-4" />}>View Profile</MenuItem>
            <MenuItem icon={<Edit className="size-4" />}>Edit Profile</MenuItem>
            <MenuItem icon={<RotateCcw className="size-4" />}>Manage Subscription</MenuItem>

            <div className="relative">
              <button className="flex items-center gap-3 px-3 py-2.5 text-neutral-400 hover:text-white hover:bg-[var(--hover-overlay)] rounded-lg cursor-pointer transition-colors outline-none w-full">
                <Palette className="size-4" />
                <span className="text-sm flex-1 text-left">Theme</span>
                <ChevronRight className="size-4 text-neutral-500" />
              </button>
            </div>

            <div className="h-px bg-[var(--border-default)] my-2" />

            <MenuItem icon={<LogOut className="size-4" />}>Sign Out</MenuItem>
          </div>

          <div className="flex items-center justify-center gap-4 px-3 py-3 border-t border-[var(--border-default)]">
            <button className="text-neutral-500 hover:text-neutral-300 text-xs transition-colors">
              Terms of Service
            </button>
            <button className="text-neutral-500 hover:text-neutral-300 text-xs transition-colors">Privacy</button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

function MenuItem({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <button className="flex items-center gap-3 px-3 py-2.5 text-neutral-400 hover:text-white hover:bg-[var(--hover-overlay)] rounded-lg cursor-pointer transition-colors outline-none w-full">
      {icon}
      <span className="text-sm">{children}</span>
    </button>
  )
}
