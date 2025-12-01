import { fal } from "@fal-ai/client"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { prompt, imageUrl, linkedImageUrl, duration, aspectRatio, useFastModel = true, model } = body

    console.log("[v0] Video generation request:", {
      prompt,
      imageUrl,
      linkedImageUrl,
      duration,
      aspectRatio,
      useFastModel,
      model,
    })

    if (!prompt || !imageUrl) {
      return NextResponse.json({ error: "Missing prompt or imageUrl" }, { status: 400 })
    }

    if (typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Prompt must be a non-empty string" }, { status: 400 })
    }

    if (typeof imageUrl !== "string" || imageUrl.trim().length === 0) {
      return NextResponse.json({ error: "Image URL must be a non-empty string" }, { status: 400 })
    }

    const key = process.env.FAL_KEY || process.env.FAL_FAL_KEY
    if (!key) {
      console.error("[v0] FAL_KEY not found in environment")
      return NextResponse.json({ error: "FAL API key not configured" }, { status: 500 })
    }

    fal.config({ credentials: key })

    const isFirstLastFrame = !!linkedImageUrl

    if (model === "wan-2.2-transition" && isFirstLastFrame) {
      if (typeof linkedImageUrl !== "string" || linkedImageUrl.trim().length === 0) {
        return NextResponse.json(
          { error: "Linked image URL must be a non-empty string for transitions" },
          { status: 400 },
        )
      }

      const falModel = "fal-ai/wan/v2.2-a14b/image-to-video/turbo"

      console.log(`[v0] Calling fal.subscribe with model: ${falModel} (WAN 2.2 transition)`)
      console.log(`[v0] image_url: ${imageUrl.trim()}`)
      console.log(`[v0] end_image_url: ${linkedImageUrl.trim()}`)
      console.log(`[v0] prompt: ${prompt.trim()}`)

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

      console.log("[v0] WAN 2.2 transition input:", JSON.stringify(input, null, 2))

      const result = await fal.subscribe(falModel, {
        input,
        logs: true,
      })

      console.log("[v0] Video generation result:", result)
      return NextResponse.json(result)
    }

    if (model === "wan-2.5") {
      const falModel = "fal-ai/wan-25-preview/image-to-video"

      const videoDuration: "5" | "10" = duration >= 8 ? "10" : "5";

      console.log(`[v0] Calling fal.subscribe with model: ${falModel} (WAN 2.5)`)
      console.log(`[v0] image_url: ${imageUrl.trim()}`)
      console.log(`[v0] prompt: ${prompt.trim()}`)
      console.log(`[v0] duration: ${videoDuration}`)

      const input = {
        prompt: prompt.trim(),
        image_url: imageUrl.trim(),
        duration: videoDuration,
        resolution: "1080p" as "480p" | "720p" | "1080p",
        negative_prompt: "low resolution, error, worst quality, low quality, defects",
        enable_prompt_expansion: true,
        enable_safety_checker: true,
      }

      console.log("[v0] WAN 2.5 input:", JSON.stringify(input, null, 2))

      const result = await fal.subscribe(falModel, {
        input,
        logs: true,
      })

      console.log("[v0] Video generation result:", result)
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

      console.log(`[v0] Calling fal.subscribe with model: ${falModel}`)
      console.log(`[v0] first_frame_url: ${imageUrl.trim()}`)
      console.log(`[v0] last_frame_url: ${linkedImageUrl.trim()}`)
      console.log(`[v0] prompt: ${prompt.trim()}`)
      console.log(`[v0] duration: ${videoDuration}`)

      const input = {
        prompt: prompt.trim(),
        first_frame_url: imageUrl.trim(),
        last_frame_url: linkedImageUrl.trim(),
        duration: videoDuration,
        aspect_ratio: (aspectRatio || "16:9") as "auto" | "9:16" | "16:9" | "1:1",
        resolution: "720p" as "720p" | "1080p",
        generate_audio: true,
      }

      console.log("[v0] First-last-frame input:", JSON.stringify(input, null, 2))

      const result = await fal.subscribe(falModel, {
        input: input === undefined ? {
          prompt: prompt.trim(),
          first_frame_url: imageUrl.trim(),
          last_frame_url: linkedImageUrl.trim(),
          duration: '8s',
          aspect_ratio: (aspectRatio || "16:9") as "auto" | "9:16" | "16:9" | "1:1",
          resolution: "720p" as "720p" | "1080p",
          generate_audio: true,

        } : {
          ...input,
          duration: '8s',

        },
        logs: true,
      })

      console.log("[v0] Video generation result:", result)
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

    console.log(`[v0] Calling fal.subscribe with model: ${falModel}, duration: ${videoDuration}`)

    const result = await fal.subscribe(falModel, {
      input: {
        prompt: prompt.trim(),
        image_url: imageUrl.trim(),
        duration: "8s",
        aspect_ratio: (aspectRatio || "16:9") as "16:9" | "9:16",
      },
      logs: true,
    })

    console.log("[v0] Video generation result:", result)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[v0] Veo generation error:", error)
    console.error("[v0] Error message:", error?.message || "Unknown error")
    console.error("[v0] Error name:", error?.name)
    console.error("[v0] Error stack:", error?.stack)

    let errorMessage = error?.message || "Video generation failed"
    let validationDetails = null

    // Check for content moderation error (the actual issue)
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
          validationDetails = bodyObj.detail
          console.error("[v0] Validation error details:", JSON.stringify(validationDetails, null, 2))

          // Check if validation detail contains content moderation message
          if (
            typeof validationDetails === "string" &&
            (validationDetails.includes("content checker") || validationDetails.includes("flagged"))
          ) {
            errorMessage =
              "Content flagged by moderation: Please avoid copyrighted content, movie references, or trademarked characters in your prompts and images."
          }
        }
      } catch (e) {
        console.error("[v0] Failed to parse error body:", e)
      }
    }

    if (!validationDetails && error?.detail) {
      validationDetails = error.detail
      console.error("[v0] Validation error details (direct):", JSON.stringify(validationDetails, null, 2))
    }

    const errorDetails = {
      message: errorMessage,
      originalMessage: error?.message,
      name: error?.name,
      status: error?.status,
      statusText: error?.statusText,
      body: error?.body,
      detail: validationDetails,
    }

    console.error("[v0] Full error details:", JSON.stringify(errorDetails, null, 2))

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 },
    )
  }
}
