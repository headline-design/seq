export const formatTimecode = (seconds: number, fps: number = 30): string => {
  const totalFrames = Math.floor(seconds * fps)
  const frames = totalFrames % fps
  const totalSeconds = Math.floor(seconds)
  const s = totalSeconds % 60
  const m = Math.floor(totalSeconds / 60)
  const h = Math.floor(totalSeconds / 3600)

  const fStr = frames.toString().padStart(2, "0")
  const sStr = s.toString().padStart(2, "0")
  const mStr = m.toString().padStart(2, "0")

  if (h > 0) {
    const hStr = h.toString().padStart(2, "0")
    return `${hStr}:${mStr}:${sStr}:${fStr}`
  }
  return `${mStr}:${sStr}:${fStr}`
}

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  }
  const m = Math.floor(seconds / 60)
  const s = (seconds % 60).toFixed(0)
  return `${m}m ${s}s`
}
