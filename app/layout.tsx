import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "@/styles/globals.css"
import { cn } from "@/lib/utils"
import PlausibleAnalytics from "@/app/PlausibleAnalytics"

export const metadata: Metadata = {
  title: "BestMaker AI – AI Image & Video Generator",
  description: "Generate high-quality AI images and videos from text or photos with multiple AI models online.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background flex flex-col", GeistSans.variable, GeistMono.variable)}>
        <Suspense fallback={null}>{children}</Suspense>
        {process.env.NODE_ENV === "development" ? null : <PlausibleAnalytics />}
        <Analytics />
      </body>
    </html>
  )
}
