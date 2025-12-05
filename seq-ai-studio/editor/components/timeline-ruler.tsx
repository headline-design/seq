
"use client"

import React, { useRef, useEffect, useState } from "react"
import { getZoomConfig } from "../utils/timeline-scale"

interface TimelineRulerProps {
  duration: number
  zoomLevel: number
  scrollContainerRef: React.RefObject<HTMLDivElement>
  onClick?: (time: number) => void
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({
  duration,
  zoomLevel,
  scrollContainerRef,
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [width, setWidth] = useState(0)

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    const f = Math.floor((seconds % 1) * 30) // Approx 30fps frames
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}:${f.toString().padStart(2, "0")}`
  }

  const draw = (ctx: CanvasRenderingContext2D, scrollLeft: number, canvasWidth: number) => {
    const height = 32 // Match h-8
    
    // Clear
    ctx.clearRect(0, 0, canvasWidth, height)
    
    ctx.fillStyle = "#71717a" // Zinc 500
    ctx.strokeStyle = "#3f3f46" // Zinc 700
    ctx.lineWidth = 1
    ctx.font = `500 10px "Inter", sans-serif` // Match app font
    ctx.textBaseline = "top"

    // Get strict tick configuration based on zoom level
    const { majorInterval, minorDivisions } = getZoomConfig(zoomLevel)
    
    // Calculate visible range (add buffer)
    const startSec = Math.max(0, (scrollLeft - 50) / zoomLevel)
    const endSec = (scrollLeft + canvasWidth + 50) / zoomLevel
    
    // Snap start to grid
    const startGrid = Math.floor(startSec / majorInterval) * majorInterval

    ctx.beginPath()

    for (let sec = startGrid; sec <= endSec; sec += majorInterval) {
      const x = (sec * zoomLevel) - scrollLeft
      
      // Draw Major Tick
      ctx.moveTo(x, 12) // Start a bit lower
      ctx.lineTo(x, height)
      
      // Draw Text
      if (x > -20) { // Simple culling
          let timeStr = ""
          // Format text based on resolution
          if (majorInterval < 1) {
              // Sub-second precision
              timeStr = formatTime(sec)
          } else if (majorInterval >= 60) {
              // Minutes only
              const m = Math.floor(sec / 60)
              const s = Math.floor(sec % 60)
              timeStr = `${m}:${s.toString().padStart(2, '0')}`
          } else {
              // Standard seconds
              const m = Math.floor(sec / 60)
              const s = Math.floor(sec % 60)
              timeStr = `${m}:${s.toString().padStart(2, '0')}`
          }
          ctx.fillText(timeStr, x + 4, 2)
      }

      // Draw Minor Ticks
      const minorInterval = majorInterval / minorDivisions
      for (let i = 1; i < minorDivisions; i++) {
        const minorSec = sec + (i * minorInterval)
        const minorX = (minorSec * zoomLevel) - scrollLeft
        
        // Skip if out of view
        if (minorX > canvasWidth) break; 
        
        // Dynamic height for minor ticks
        const isMid = i === minorDivisions / 2;
        const tickY = isMid ? 20 : 24;

        ctx.moveTo(minorX, tickY)
        ctx.lineTo(minorX, height)
      }
    }
    
    ctx.stroke()
  }

  useEffect(() => {
    const updateWidth = () => {
      if (scrollContainerRef.current) {
        setWidth(scrollContainerRef.current.clientWidth)
      }
    }
    
    window.addEventListener('resize', updateWidth)
    // Check immediately and periodically to ensure sync with parent resize
    updateWidth()
    const interval = setInterval(updateWidth, 500)
    
    return () => {
        window.removeEventListener('resize', updateWidth)
        clearInterval(interval)
    }
  }, [scrollContainerRef])

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current
    const container = scrollContainerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    
    // Always match display size
    if (canvas.width !== width * dpr || canvas.height !== 32 * dpr) {
        canvas.width = width * dpr
        canvas.height = 32 * dpr
        ctx.scale(dpr, dpr)
    }
    canvas.style.width = `${width}px`
    canvas.style.height = `32px`

    let animationFrameId: number

    const render = () => {
      draw(ctx, container.scrollLeft, width)
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => cancelAnimationFrame(animationFrameId)
  }, [width, zoomLevel, duration, scrollContainerRef])

  const handleCanvasClick = (e: React.MouseEvent) => {
     if (!onClick || !scrollContainerRef.current) return
     const rect = e.currentTarget.getBoundingClientRect()
     const x = e.clientX - rect.left
     const scrollLeft = scrollContainerRef.current.scrollLeft
     const time = Math.max(0, (x + scrollLeft) / zoomLevel)
     onClick(time)
  }

  return (
    <div className="h-8 w-full sticky top-0 left-0 z-30 bg-[#09090b] border-b border-neutral-800 pointer-events-auto overflow-hidden">
        <canvas 
            ref={canvasRef} 
            className="block w-full h-full cursor-pointer"
            onClick={handleCanvasClick}
        />
    </div>
  )
}
