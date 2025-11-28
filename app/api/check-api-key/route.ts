import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.AI_GATEWAY_API_KEY

  return NextResponse.json({
    configured: !!apiKey,
  })
}
