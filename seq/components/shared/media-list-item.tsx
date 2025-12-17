"use client"
import { cn } from "@/seq/lib/utils"
import { Play, MoreHorizontal, ThumbsUp, ThumbsDown, Share2, MessageSquare } from "lucide-react"
import { Button } from "@/seq/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/seq/components/ui/dropdown-menu"

interface MediaListItemProps {
  thumbnail: string
  title: string
  description?: string
  duration?: string
  tags?: { label: string; color?: string }[]
  metadata?: { label: string; value: string | number }[]
  isSelected?: boolean
  isPlaying?: boolean
  onPlay?: () => void
  onClick?: () => void
  onLike?: () => void
  onDislike?: () => void
  onShare?: () => void
  onComment?: () => void
  menuItems?: { label: string; onClick: () => void; destructive?: boolean }[]
  className?: string
}

export function MediaListItem({
  thumbnail,
  title,
  description,
  duration,
  tags = [],
  metadata = [],
  isSelected,
  isPlaying,
  onPlay,
  onClick,
  onLike,
  onDislike,
  onShare,
  onComment,
  menuItems = [],
  className,
}: MediaListItemProps) {
  return (
    <div
      className={cn(
        "group flex items-start gap-4 p-3 rounded-lg transition-colors cursor-pointer",
        "hover:bg-[var(--hover-overlay)]",
        isSelected && "bg-[var(--active-overlay)]",
        className,
      )}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-[120px] aspect-video rounded-lg overflow-hidden bg-[var(--surface-2)]">
        <img src={thumbnail || "/placeholder.svg"} alt={title} className="w-full h-full object-cover" />
        {/* Duration badge */}
        {duration && (
          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/80 rounded text-[10px] font-medium text-white">
            {duration}
          </div>
        )}
        {/* Play overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPlay?.()
          }}
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity",
            isPlaying && "opacity-100",
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Play
              className={cn("h-5 w-5 text-white", isPlaying && "text-[var(--accent-text)]")}
              fill={isPlaying ? "currentColor" : "none"}
            />
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-0.5">
        {/* Title row */}
        <div className="flex items-start gap-2">
          <h3 className="text-sm font-medium text-white truncate">{title}</h3>
          {tags.map((tag, index) => (
            <span
              key={index}
              className={cn(
                "flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium",
                tag.color || "bg-[var(--accent-bg-subtle)] text-[var(--accent-text)]",
              )}
            >
              {tag.label}
            </span>
          ))}
        </div>

        {/* Description */}
        {description && <p className="mt-0.5 text-xs text-neutral-400 line-clamp-2">{description}</p>}

        {/* Tags & Metadata row */}
        <div className="flex items-center gap-3 mt-2">
          {metadata.map((item, index) => (
            <div key={index} className="flex items-center gap-1 text-xs text-neutral-500">
              <span>{item.label}</span>
              <span className="text-neutral-400">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {onLike && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-neutral-500 hover:text-white hover:bg-[var(--hover-overlay)]"
            onClick={(e) => {
              e.stopPropagation()
              onLike()
            }}
          >
            <ThumbsUp className="h-4 w-4" />
          </Button>
        )}
        {onDislike && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-neutral-500 hover:text-white hover:bg-[var(--hover-overlay)]"
            onClick={(e) => {
              e.stopPropagation()
              onDislike()
            }}
          >
            <ThumbsDown className="h-4 w-4" />
          </Button>
        )}
        {onComment && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-neutral-500 hover:text-white hover:bg-[var(--hover-overlay)]"
            onClick={(e) => {
              e.stopPropagation()
              onComment()
            }}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        )}
        {onShare && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-neutral-500 hover:text-white hover:bg-[var(--hover-overlay)]"
            onClick={(e) => {
              e.stopPropagation()
              onShare()
            }}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        )}
        {menuItems.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-neutral-500 hover:text-white hover:bg-[var(--hover-overlay)]"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-[var(--surface-2)] border-[var(--border-default)]">
              {menuItems.map((item, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    item.onClick()
                  }}
                  className={cn("cursor-pointer", item.destructive && "text-red-400 focus:text-red-400")}
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

export default MediaListItem
