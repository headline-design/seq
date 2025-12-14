export interface MediaInfo {
  duration: number
  width?: number
  height?: number
  aspectRatio?: string
}

export const getVideoInfo = (src: string): Promise<MediaInfo> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    video.preload = "metadata"
    video.onloadedmetadata = () => {
      const duration = video.duration
      const width = video.videoWidth
      const height = video.videoHeight
      let aspectRatio = "16:9"
      
      const r = width / height
      if (Math.abs(r - 16 / 9) < 0.1) aspectRatio = "16:9"
      else if (Math.abs(r - 9 / 16) < 0.1) aspectRatio = "9:16"
      else if (Math.abs(r - 1) < 0.1) aspectRatio = "1:1"
      else aspectRatio = "custom"

      resolve({ duration, width, height, aspectRatio })
    }
    video.onerror = (e) => reject(e)
    video.src = src
  })
}

export const getAudioInfo = (src: string): Promise<MediaInfo> => {
  return new Promise((resolve, reject) => {
    const audio = document.createElement("audio")
    audio.preload = "metadata"
    audio.onloadedmetadata = () => {
      resolve({ duration: audio.duration })
    }
    audio.onerror = (e) => reject(e)
    audio.src = src
  })
}
