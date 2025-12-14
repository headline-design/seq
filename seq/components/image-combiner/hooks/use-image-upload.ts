"use client"

import { useState, useRef } from "react"

export function useImageUpload() {
  const [image1, setImage1] = useState<File | null>(null)
  const [image1Preview, setImage1Preview] = useState("")
  const [image1Url, setImage1Url] = useState("")
  const [image2, setImage2] = useState<File | null>(null)
  const [image2Preview, setImage2Preview] = useState("")
  const [image2Url, setImage2Url] = useState("")
  const [isConvertingHeic, setIsConvertingHeic] = useState(false)
  const [heicProgress, setHeicProgress] = useState(0)

  const showToast = useRef<((message: string, type?: "success" | "error") => void) | null>(null)

  const validateImageFormat = (file: File): boolean => {
    const supportedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
      "image/gif",
      "image/bmp",
      "image/tiff",
    ]

    if (supportedTypes.includes(file.type.toLowerCase())) {
      return true
    }

    const fileName = file.name.toLowerCase()
    const supportedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".gif", ".bmp", ".tiff"]
    return supportedExtensions.some((ext) => fileName.endsWith(ext))
  }

  const compressImage = async (file: File, maxWidth = 1280, quality = 0.75): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      const img = new Image()

      img.onload = () => {
        let { width, height } = img
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height
            height = maxWidth
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              resolve(file)
            }
          },
          "image/jpeg",
          quality,
        )
      }

      img.src = URL.createObjectURL(file)
    })
  }

  const convertHeicToPng = async (file: File): Promise<File> => {
    try {
      setHeicProgress(0)
      const progressInterval = setInterval(() => {
        setHeicProgress((prev) => (prev >= 95 ? prev : prev + Math.random() * 15 + 5))
      }, 50)

      const { heicTo } = await import("heic-to")
      setHeicProgress(70)

      const convertedBlob = await heicTo({
        blob: file,
        type: "image/jpeg",
        quality: 0.9,
      })

      setHeicProgress(90)
      const convertedFile = new File([convertedBlob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
        type: "image/jpeg",
      })

      clearInterval(progressInterval)
      setHeicProgress(100)
      await new Promise((resolve) => setTimeout(resolve, 200))

      return convertedFile
    } catch (error) {
      console.error("HEIC conversion error:", error)
      throw new Error("Could not convert HEIC image. Please try using a different image format.")
    }
  }

  const handleImageUpload = async (file: File, imageNumber: 1 | 2) => {
    if (!validateImageFormat(file)) {
      showToast.current?.("Please select a valid image file.", "error")
      return
    }

    let processedFile = file
    const isHeic =
      file.type.toLowerCase().includes("heic") ||
      file.type.toLowerCase().includes("heif") ||
      file.name.toLowerCase().endsWith(".heic") ||
      file.name.toLowerCase().endsWith(".heif")

    if (isHeic) {
      try {
        setIsConvertingHeic(true)
        processedFile = await convertHeicToPng(file)
        setIsConvertingHeic(false)
      } catch (error) {
        setIsConvertingHeic(false)
        showToast.current?.("Error converting HEIC image. Please try a different format.", "error")
        return
      }
    }

    try {
      processedFile = await compressImage(processedFile)
    } catch (error) {
      console.error("Error compressing image:", error)
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string

      if (imageNumber === 1) {
        setImage1(processedFile)
        setImage1Preview(result)
      } else {
        setImage2(processedFile)
        setImage2Preview(result)
      }
    }
    reader.onerror = () => {
      showToast.current?.("Error reading the image file. Please try again.", "error")
    }
    reader.readAsDataURL(processedFile)
  }

  const handleUrlChange = (url: string, imageNumber: 1 | 2) => {
    if (imageNumber === 1) {
      setImage1Url(url)
      setImage1Preview(url)
      setImage1(null)
    } else {
      setImage2Url(url)
      setImage2Preview(url)
      setImage2(null)
    }
  }

  const clearImage = (imageNumber: 1 | 2) => {
    if (imageNumber === 1) {
      setImage1(null)
      setImage1Preview("")
      setImage1Url("")
    } else {
      setImage2(null)
      setImage2Preview("")
      setImage2Url("")
    }
  }

  return {
    image1,
    image1Preview,
    image1Url,
    image2,
    image2Preview,
    image2Url,
    isConvertingHeic,
    heicProgress,
    handleImageUpload,
    handleUrlChange,
    clearImage,
    showToast,
  }
}
