"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Loader2, Upload } from "lucide-react"
import Image from "next/image"

export default function TestVideoPage() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [prompt, setPrompt] = useState(
    "A man takes a bite of food and his eyes widen in surprise as memories flood back",
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    setError(null)

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setImageUrl(base64)
      console.log("[v0] Test page: Image converted to base64, length:", base64.length)
    }
    reader.readAsDataURL(file)
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, prompt }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      setResult(data)
    } catch (err: any) {
      console.error("Video generation error:", err)
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Video Generation Test</h1>
          <p className="text-muted-foreground">Test the Veo3 image-to-video API directly</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Parameters</CardTitle>
            <CardDescription>Configure your test inputs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imageFile">Upload Image</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("imageFile")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Browse
                </Button>
              </div>
              {imageUrl && (
                <div className="mt-2 rounded-lg border p-2">
                  <Image
                    src={imageUrl || "/placeholder.svg"}
                    alt="Preview"
                    width={400}
                    height={300}
                    className="h-auto w-full rounded"
                    unoptimized
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">Video Prompt</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the motion..."
                rows={3}
              />
            </div>

            <Button onClick={handleGenerate} disabled={isGenerating || !imageUrl || !prompt} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Video"
              )}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded bg-muted p-4 text-sm">{error}</pre>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                Success
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Video Result</Label>
                {result.data?.video?.url ? (
                  <video src={result.data.video.url} controls className="mt-2 w-full rounded-lg border" />
                ) : (
                  <p className="text-muted-foreground">No video URL in response</p>
                )}
              </div>

              <div>
                <Label>Full Response</Label>
                <pre className="mt-2 overflow-auto rounded bg-muted p-4 text-xs">{JSON.stringify(result, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
