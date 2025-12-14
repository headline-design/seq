import { fal } from "@fal-ai/client"
import { NextResponse } from "next/server"

async function convertToDataUri(url: string): Promise<string> {
  if (url.startsWith("data:") || url.startsWith("https://")) {
    return url
  }

  if (url.startsWith("blob:")) {
    throw new Error("Blob URLs cannot be used directly. Please ensure images are uploaded to cloud storage first.")
  }

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    const contentType = response.headers.get("content-type") || "image/png"
    return `data:${contentType};base64,${base64}`
  } catch (error) {
    console.error("Failed to convert URL to data URI:", error)
    throw new Error(`Failed to process image URL: ${url}`)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { prompt, imageUrl, linkedImageUrl, duration, aspectRatio, useFastModel = true, model } = body

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 })
    }

    if (typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Prompt must be a non-empty string" }, { status: 400 })
    }

    const hasImage = typeof imageUrl === "string" && imageUrl.trim().length > 0

    if (hasImage) {
      const isValidImageUrl = imageUrl.startsWith("https://") || imageUrl.startsWith("data:image/")

      if (!isValidImageUrl) {
        return NextResponse.json(
          {
            error: "Invalid image URL format",
            details: "Supported formats: HTTPS URLs or data URIs (base64). Blob URLs are not supported.",
          },
          { status: 400 },
        )
      }
    }

    if (linkedImageUrl) {
      const isValidLinkedUrl = linkedImageUrl.startsWith("https://") || linkedImageUrl.startsWith("data:image/")

      if (!isValidLinkedUrl) {
        return NextResponse.json(
          {
            error: "Invalid linked image URL format",
            details: "Supported formats: HTTPS URLs or data URIs (base64). Blob URLs are not supported.",
          },
          { status: 400 },
        )
      }
    }

    const key = process.env.FAL_KEY || process.env.FAL_FAL_KEY
    if (!key) {
      console.error("FAL_KEY not found in environment")
      return NextResponse.json({ error: "FAL API key not configured" }, { status: 500 })
    }

    fal.config({ credentials: key })

    if (!hasImage) {
      // Text-to-Video Path
      let falModel = "fal-ai/minimax-video"

      if (model === "fal-ai/hunyuan-video") {
        falModel = "fal-ai/hunyuan-video"
      }

      const result = await fal.subscribe(falModel, {
        input: {
          prompt: prompt.trim(),
          prompt_optimizer: true,
        },
        logs: true,
      })

      return NextResponse.json(result)
    }

    const isFirstLastFrame = !!linkedImageUrl

    if (model === "wan-2.2-transition" && isFirstLastFrame) {
      if (typeof linkedImageUrl !== "string" || linkedImageUrl.trim().length === 0) {
        return NextResponse.json(
          { error: "Linked image URL must be a non-empty string for transitions" },
          { status: 400 },
        )
      }

      const falModel = "fal-ai/wan/v2.2-a14b/image-to-video/turbo"

      const input = {
        prompt: prompt.trim(),
        image_url: imageUrl.trim(),
        end_image_url: linkedImageUrl.trim(),
        resolution: "720p" as "480p" | "580p" | "720p",
        aspect_ratio: "auto" as "auto" | "16:9" | "9:16" | "1:1",
        enable_safety_checker: true,
        enable_output_safety_checker: false,
        enable_prompt_expansion: false,
        acceleration: "regular" as "none" | "regular",
        video_quality: "high" as "low" | "medium" | "high" | "maximum",
        video_write_mode: "balanced" as "fast" | "balanced" | "small",
      }

      const result = await fal.subscribe(falModel, {
        input,
        logs: true,
      })

      return NextResponse.json(result)
    }

    if (model === "wan-2.5") {
      const falModel = "fal-ai/wan-25-preview/image-to-video"

      const videoDuration: "5" | "10" = duration >= 8 ? "10" : "5"

      const input = {
        prompt: prompt.trim(),
        image_url: imageUrl.trim(),
        duration: videoDuration,
        resolution: "1080p" as "480p" | "720p" | "1080p",
        negative_prompt: "low resolution, error, worst quality, low quality, defects",
        enable_prompt_expansion: true,
        enable_safety_checker: true,
      }

      const result = await fal.subscribe(falModel, {
        input,
        logs: true,
      })

      return NextResponse.json(result)
    }

    if (isFirstLastFrame) {
      if (typeof linkedImageUrl !== "string" || linkedImageUrl.trim().length === 0) {
        return NextResponse.json(
          { error: "Linked image URL must be a non-empty string for transitions" },
          { status: 400 },
        )
      }

      const falModel = useFastModel
        ? "fal-ai/veo3.1/fast/first-last-frame-to-video"
        : "fal-ai/veo3.1/first-last-frame-to-video"

      let videoDuration: "4s" | "6s" | "8s"
      if (useFastModel) {
        if (duration <= 4) {
          videoDuration = "4s"
        } else if (duration <= 6) {
          videoDuration = "6s"
        } else {
          videoDuration = "8s"
        }
      } else {
        if (duration <= 4) {
          videoDuration = "4s"
        } else if (duration <= 6) {
          videoDuration = "6s"
        } else {
          videoDuration = "8s"
        }
      }

      const input = {
        prompt: prompt.trim(),
        first_frame_url: imageUrl.trim(),
        last_frame_url: linkedImageUrl.trim(),
        duration: videoDuration,
        aspect_ratio: (aspectRatio || "16:9") as "auto" | "9:16" | "16:9" | "1:1",
        resolution: "720p" as "720p" | "1080p",
        generate_audio: true,
      }

      const result = await fal.subscribe(falModel, {
        input:
          input === undefined
            ? {
                prompt: prompt.trim(),
                first_frame_url: imageUrl.trim(),
                last_frame_url: linkedImageUrl.trim(),
                duration: "8s",
                aspect_ratio: (aspectRatio || "16:9") as "auto" | "9:16" | "16:9" | "1:1",
                resolution: "720p" as "720p" | "1080p",
                generate_audio: true,
              }
            : {
                ...input,
                duration: "8s",
              },
        logs: true,
      })

      return NextResponse.json(result)
    }

    let videoDuration: "4s" | "6s" | "8s"
    if (useFastModel) {
      videoDuration = "8s"
    } else {
      if (duration <= 4) {
        videoDuration = "4s"
      } else if (duration <= 6) {
        videoDuration = "6s"
      } else {
        videoDuration = "8s"
      }
    }

    const falModel = useFastModel ? "fal-ai/veo3.1/fast/image-to-video" : "fal-ai/veo3.1/image-to-video"

    const result = await fal.subscribe(falModel, {
      input: {
        prompt: prompt.trim(),
        image_url: imageUrl.trim(),
        duration: "8s",
        aspect_ratio: (aspectRatio || "16:9") as "16:9" | "9:16",
      },
      logs: true,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Veo generation error:", error)

    let errorMessage = error?.message || "Video generation failed"

    // Check for content moderation error
    if (error?.message && typeof error.message === "string") {
      if (
        error.message.includes("content checker") ||
        error.message.includes("flagged") ||
        error.message.includes("could not be processed")
      ) {
        errorMessage =
          "Content flagged by moderation: Please avoid copyrighted content, movie references, or trademarked characters in your prompts and images."
      }
    }

    // Parse validation details from error body
    if (error?.body) {
      try {
        const bodyObj = typeof error.body === "string" ? JSON.parse(error.body) : error.body
        if (bodyObj?.detail) {
          if (
            typeof bodyObj.detail === "string" &&
            (bodyObj.detail.includes("content checker") || bodyObj.detail.includes("flagged"))
          ) {
            errorMessage =
              "Content flagged by moderation: Please avoid copyrighted content, movie references, or trademarked characters in your prompts and images."
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: {
          message: errorMessage,
          originalMessage: error?.message,
        },
      },
      { status: 500 },
    )
  }
}
