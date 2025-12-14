import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createGateway } from "@ai-sdk/gateway"
import { put } from "@vercel/blob"

export const dynamic = "force-dynamic"

const MAX_PROMPT_LENGTH = 5000
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

interface GenerateImageResponse {
  url: string
  prompt: string
  description?: string
}

interface ErrorResponse {
  error: string
  message?: string
  details?: string
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.AI_GATEWAY_API_KEY

    if (!apiKey) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Configuration error",
          details: "No AI Gateway API key configured. Please add AI_GATEWAY_API_KEY to environment variables.",
        },
        { status: 500 },
      )
    }

    const formData = await request.formData()
    const mode = formData.get("mode") as string
    const prompt = formData.get("prompt") as string
    const aspectRatio = formData.get("aspectRatio") as string
    const shouldUploadToBlob = formData.get("uploadToBlob") === "true"

    const geminiAspectRatioMap: Record<string, string> = {
      portrait: "9:16",
      landscape: "16:9",
      wide: "21:9",
      "4:3": "4:3",
      "3:4": "3:4",
      "3:2": "3:2",
      "2:3": "2:3",
      "5:4": "5:4",
      "4:5": "4:5",
      square: "1:1",
    }

    const geminiAspectRatio = geminiAspectRatioMap[aspectRatio] || "1:1"

    const gateway = createGateway({
      apiKey: apiKey,
    })

    const model = gateway("google/gemini-3-pro-image")

    if (mode === "text-to-image") {
      const imageGenerationPrompt = `Generate a high-quality image based on this description: ${prompt}. The image should be visually appealing and match the description as closely as possible.`

      const result = await generateText({
        model,
        prompt: imageGenerationPrompt,
        providerOptions: {
          google: {
            responseModalities: ["IMAGE"],
            imageConfig: {
              aspectRatio: geminiAspectRatio,
            },
          },
        },
      })

      const imageFiles = result.files?.filter((f) => f.mediaType?.startsWith("image/")) || []

      if (imageFiles.length === 0) {
        return NextResponse.json<ErrorResponse>(
          { error: "No image generated", details: "The model did not return any images" },
          { status: 500 },
        )
      }

      const firstImage = imageFiles[0]
      const imageUrl = `data:${firstImage.mediaType};base64,${firstImage.base64}`

      const blobUrl = shouldUploadToBlob ? await uploadImageToBlob(firstImage.base64, firstImage.mediaType) : null

      return NextResponse.json<GenerateImageResponse>({
        url: blobUrl || imageUrl, // Use blob URL if uploaded, otherwise base64
        prompt: prompt,
        description: result.text || "",
      })
    } else if (mode === "image-editing") {
      const image1 = formData.get("image1") as File
      const image2 = formData.get("image2") as File
      const image1Url = formData.get("image1Url") as string
      const image2Url = formData.get("image2Url") as string

      const hasImage1 = image1 || image1Url
      const hasImage2 = image2 || image2Url

      if (!hasImage1) {
        return NextResponse.json<ErrorResponse>(
          { error: "At least one image is required for editing mode" },
          { status: 400 },
        )
      }

      if (image1) {
        if (image1.size > MAX_FILE_SIZE) {
          return NextResponse.json<ErrorResponse>(
            { error: `Image 1 too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB allowed.` },
            { status: 400 },
          )
        }
        if (!ALLOWED_IMAGE_TYPES.includes(image1.type)) {
          return NextResponse.json<ErrorResponse>(
            { error: "Image 1 has invalid format. Allowed: JPEG, PNG, WebP, GIF" },
            { status: 400 },
          )
        }
      }

      if (image2) {
        if (image2.size > MAX_FILE_SIZE) {
          return NextResponse.json<ErrorResponse>(
            { error: `Image 2 too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB allowed.` },
            { status: 400 },
          )
        }
        if (!ALLOWED_IMAGE_TYPES.includes(image2.type)) {
          return NextResponse.json<ErrorResponse>(
            { error: "Image 2 has invalid format. Allowed: JPEG, PNG, WebP, GIF" },
            { status: 400 },
          )
        }
      }

      const convertToDataUrl = async (source: File | string): Promise<string> => {
        if (typeof source === "string") {
          const response = await fetch(source)
          const arrayBuffer = await response.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const base64 = buffer.toString("base64")
          const contentType = response.headers.get("content-type") || "image/jpeg"
          return `data:${contentType};base64,${base64}`
        } else {
          const arrayBuffer = await source.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const base64 = buffer.toString("base64")
          return `data:${source.type};base64,${base64}`
        }
      }

      const image1DataUrl = await convertToDataUrl(hasImage1 ? image1 || image1Url : "")
      const image2DataUrl = hasImage2 ? await convertToDataUrl(image2 || image2Url) : null

      const messageParts: Array<{ type: "text" | "image"; text?: string; image?: string }> = []

      messageParts.push({ type: "image", image: image1DataUrl })
      if (image2DataUrl) {
        messageParts.push({ type: "image", image: image2DataUrl })
      }

      const editingPrompt = hasImage2
        ? `${prompt}. Combine these two images creatively while following the instructions.`
        : `${prompt}. Edit or transform this image based on the instructions.`

      messageParts.push({ type: "text", text: editingPrompt })

      const result = await generateText({
        model,
        messages: [
          {
            role: "user",
            // @ts-ignore - Type issue with content parts
            content: messageParts,
          },
        ],
        providerOptions: {
          google: {
            responseModalities: ["IMAGE"],
            imageConfig: {
              aspectRatio: geminiAspectRatio,
            },
          },
        },
      })

      const imageFiles = result.files?.filter((f) => f.mediaType?.startsWith("image/")) || []

      if (imageFiles.length === 0) {
        return NextResponse.json<ErrorResponse>(
          { error: "No image generated", details: "The model did not return any images" },
          { status: 500 },
        )
      }

      const firstImage = imageFiles[0]
      const imageUrl = `data:${firstImage.mediaType};base64,${firstImage.base64}`

      const blobUrl = shouldUploadToBlob ? await uploadImageToBlob(firstImage.base64, firstImage.mediaType) : null

      return NextResponse.json<GenerateImageResponse>({
        url: blobUrl || imageUrl, // Use blob URL if uploaded, otherwise base64
        prompt: editingPrompt,
        description: result.text || "",
      })
    } else {
      return NextResponse.json<ErrorResponse>(
        { error: "Invalid mode", details: "Mode must be 'text-to-image' or 'image-editing'" },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Error in generate-image route:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to generate image",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}

async function uploadImageToBlob(base64: string, mimeType: string): Promise<string | null> {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.warn("Blob storage not configured. Skipping upload.")
      return null
    }

    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const blob = new Blob([bytes], { type: mimeType })

    const extension = mimeType.split("/")[1] || "png"
    const filename = `nano-banana-${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`

    const result = await put(filename, blob, {
      access: "public",
    })

    return result.url
  } catch (error) {
    console.error("Failed to upload to Blob storage:", error instanceof Error ? error.message : String(error))
    return null
  }
}
