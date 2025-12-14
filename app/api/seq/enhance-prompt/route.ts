import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createGateway } from "@ai-sdk/gateway"

export const dynamic = "force-dynamic"

interface EnhanceResponse {
  enhancedPrompt: string
}

interface ErrorResponse {
  error: string
  details?: string
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.AI_GATEWAY_API_KEY

    if (!apiKey) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Configuration error",
          details: "No AI Gateway API key configured.",
        },
        { status: 500 },
      )
    }

    const { imageUrl, masterDescription, panelPrompt } = await request.json()

    if (!imageUrl) {
      return NextResponse.json<ErrorResponse>({ error: "Image URL is required" }, { status: 400 })
    }

    const gateway = createGateway({
      apiKey: apiKey,
    })

    const model = gateway("google/gemini-3-pro-image")

    const enhancePrompt = `
      You are an expert film director and prompt engineer for AI video generation.
      
      Task: Create a concise, high-quality video generation prompt based on the provided image and the context.
      
      Master Story Context: "${masterDescription || "No global context provided."}"
      Specific Shot Notes: "${panelPrompt || "Infer action from image and context."}"
      
      Instructions:
      1. Analyze the image to understand the visual context, lighting, style, and subject.
      2. Use the Master Story Context to align the style and narrative.
      3. Use the Specific Shot Notes (if any) to determine the specific action/movement.
      4. Output a SINGLE sentence optimized for Veo/Sora style video generation models.
      5. Focus on describing the MOTION and CAMERA MOVEMENT.
      6. Keep it under 40 words.
      
      Example Output: "Cinematic push-in on the character's face as they look up in realization, subtle wind blowing hair, warm sunset lighting."
    `

    const result = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", image: imageUrl },
            { type: "text", text: enhancePrompt },
          ],
        },
      ],
    })

    return NextResponse.json<EnhanceResponse>({
      enhancedPrompt: result.text.trim(),
    })
  } catch (error) {
    console.error("Enhance error:", error)
    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to enhance prompt",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
