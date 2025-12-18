import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Suspense } from "react"
import { ErrorBoundary } from "@/seq/components/error-boundary"
import { Toaster, ToastProvider } from "@/seq/components/ui/sonner"
import { DeploymentNotice } from "@/seq/components/deployment-notice"

//@ts-ignore
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "Seq - AI-Powered Storyboard to Video Sequence Editor",
  description:
    "Transform storyboards into cinematic video sequences. Seq uses AI to generate video clips from your panels and assembles them in a professional magnetic timeline editor.",
  keywords: [
    "seq",
    "sequence editor",
    "storyboard to video",
    "AI video generation",
    "magnetic timeline",
    "video editor",
    "Veo 3.1",
    "fal.ai",
    "video sequence",
    "AI filmmaking",
  ],
  authors: [{ name: "v0" }],
  creator: "v0",
  publisher: "v0",
  generator: "v0.app",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Seq - AI-Powered Storyboard to Video Sequence Editor",
    description:
      "Transform storyboards into cinematic video sequences with AI video generation and a professional magnetic timeline editor.",
    siteName: "Seq",
  },
  twitter: {
    card: "summary_large_image",
    title: "Seq - AI-Powered Storyboard to Video Sequence Editor",
    description:
      "Transform storyboards into cinematic video sequences with AI video generation and a professional magnetic timeline editor.",
    creator: "@vercel",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
      style={{ backgroundColor: "#000000" }}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased" style={{ backgroundColor: "#000000" }}>
        <ToastProvider>
          <ErrorBoundary>
            <Suspense fallback={null}>{children}</Suspense>
          </ErrorBoundary>
          <Toaster />
          <DeploymentNotice />
        </ToastProvider>
      </body>
    </html>
  )
}
