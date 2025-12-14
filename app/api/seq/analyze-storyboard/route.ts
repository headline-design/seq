import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { createGateway } from "@ai-sdk/gateway"

export const dynamic = "force-dynamic"

interface AnalysisResponse {
  panelCount: number
  description?: string
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

    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json<ErrorResponse>({ error: "Image URL is required" }, { status: 400 })
    }

    const gateway = createGateway({
      apiKey: apiKey,
    })

    const model = gateway("google/gemini-3-pro-image")

    const analysisPrompt = `
      Analyze this storyboard image to determine the exact number of distinct narrative panels.

      CRITICAL LAYOUT WARNING:
      - Some storyboards use irregular grids where ONE panel may span across multiple columns or rows (e.g., a wide panoramic shot covering 2 slots).
      - Count a single continuous image as ONE panel, even if it occupies the space of multiple standard grid slots.
      - Do not double-count merged panels.
      - Look for distinct panel borders to define separation.

      Return ONLY a JSON object with a single key "panelCount" containing the integer number of panels.
      Example: {"panelCount": 6}
      Do not include any markdown formatting or other text.
    `

    const result = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", image: imageUrl },
            { type: "text", text: analysisPrompt },
          ],
        },
      ],
    })

    const text = result.text
      .trim()
      .replace(/```json/g, "")
      .replace(/```/g, "")
    let panelCount = 6 // Default fallback

    try {
      const json = JSON.parse(text)
      if (json.panelCount && typeof json.panelCount === "number") {
        panelCount = json.panelCount
      }
    } catch (e) {
      console.warn("Failed to parse analysis JSON, trying regex fallback", text)
      const match = text.match(/\d+/)
      if (match) {
        panelCount = Number.parseInt(match[0], 10)
      }
    }

    // Safety bounds
    if (panelCount < 1) panelCount = 1
    if (panelCount > 12) panelCount = 12 // Cap at reasonable max

    return NextResponse.json<AnalysisResponse>({
      panelCount,
      description: result.text,
    })
  } catch (error) {
    console.error("Analysis error:", error)
    return NextResponse.json<ErrorResponse>(
      {
        error: "Failed to analyze storyboard",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
