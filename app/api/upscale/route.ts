import { fal } from "@fal-ai/client"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { image_url, prompt } = await request.json()

    if (!image_url) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 })
    }

    const key = process.env.FAL_KEY || process.env.FAL_FAL_KEY
    if (key) {
      fal.config({ credentials: key })
    }

    const result = await fal.subscribe("fal-ai/ccsr", {
      input: {
        image_url,
      },
      logs: true,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Upscale error:", error)
    return NextResponse.json({ error: error.message || "Failed to upscale image" }, { status: 500 })
  }
}
