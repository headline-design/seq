"use client"

import type React from "react"

import { useRef, useEffect, memo } from "react"

interface DitheringProps {
  colorBack?: string
  colorFront?: string
  speed?: number
  shape?: "wave" | "grid" | "circle"
  type?: "4x4" | "2x2" | "8x8"
  pxSize?: number
  scale?: number
  style?: React.CSSProperties
}

function Dithering({
  colorBack = "#00000000",
  colorFront = "#ffffff",
  speed = 0.2,
  shape = "wave",
  type = "4x4",
  pxSize = 2,
  scale = 1.5,
  style,
}: DitheringProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    let time = 0

    const ditherMatrix4x4 = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ]

    const animate = () => {
      if (!ctx || !canvas) return

      ctx.fillStyle = colorBack
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const cols = Math.ceil(canvas.width / pxSize)
      const rows = Math.ceil(canvas.height / pxSize)

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          let value = 0

          if (shape === "wave") {
            const waveX = Math.sin((x / cols) * Math.PI * 2 * scale + time) * 0.5 + 0.5
            const waveY = Math.cos((y / rows) * Math.PI * 2 * scale + time * 0.7) * 0.5 + 0.5
            value = (waveX + waveY) / 2
          } else if (shape === "circle") {
            const cx = cols / 2
            const cy = rows / 2
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
            const maxDist = Math.sqrt(cx ** 2 + cy ** 2)
            value = Math.sin((dist / maxDist) * Math.PI * scale + time) * 0.5 + 0.5
          } else {
            value = ((x + y + time * 10) % 16) / 16
          }

          const threshold = ditherMatrix4x4[y % 4][x % 4] / 16

          if (value > threshold) {
            ctx.fillStyle = colorFront
            ctx.fillRect(x * pxSize, y * pxSize, pxSize, pxSize)
          }
        }
      }

      time += speed * 0.02
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [colorBack, colorFront, speed, shape, type, pxSize, scale])

  return (
    <div style={{ position: "relative", overflow: "hidden", ...style }}>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  )
}

export const MemoizedDithering = memo(Dithering)
export default Dithering
