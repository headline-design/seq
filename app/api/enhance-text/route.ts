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

    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json<ErrorResponse>({ error: "Prompt is required" }, { status: 400 })
    }

    const gateway = createGateway({
      apiKey: apiKey,
    })

    const model = gateway("google/gemini-2.5-flash")

    const systemPrompt = `
      You are an expert prompt engineer specializing in AI image and video generation.
      
      Task: Enhance the user's prompt to make it more detailed and effective for storyboard generation.
      
      Guidelines:
      1. Add specific visual details (lighting, camera angles, composition)
      2. Include style references (cinematic, anime, photorealistic, etc.)
      3. Clarify the number of panels and their sequence if not specified
      4. Add emotional and atmospheric descriptors
      5. Keep the enhanced prompt concise but comprehensive (under 200 words)
      6. Maintain the user's original intent and story
      
      Return ONLY the enhanced prompt text, no explanations or metadata.
    `

    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: `Enhance this storyboard prompt:\n\n${prompt}`,
    })

    return NextResponse.json<EnhanceResponse>({
      enhancedPrompt: result.text.trim(),
    })
  } catch (error) {
    console.error("Enhance text error:", error)
    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to enhance prompt",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
