import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Petrogreen - LPG Inventory Management",
  description: "Professional LPG inventory management system for distributors and retailers",
  keywords: ["LPG", "inventory", "management", "gas", "distribution", "retail"],
  authors: [{ name: "Petrogreen Team" }],
  creator: "Petrogreen",
  publisher: "Petrogreen",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://petrogreen.vercel.app"),
  alternates: {
    canonical: "/",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://petrogreen.vercel.app",
    title: "Petrogreen - LPG Inventory Management",
    description: "Professional LPG inventory management system for distributors and retailers",
    siteName: "Petrogreen",
    images: [
      {
        url: "/placeholder-logo.png",
        width: 1200,
        height: 630,
        alt: "Petrogreen Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Petrogreen - LPG Inventory Management",
    description: "Professional LPG inventory management system for distributors and retailers",
    images: ["/placeholder-logo.png"],
    creator: "@petrogreen",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#2563eb",
      },
    ],
  },
  manifest: "/manifest.json",
  category: "business",
    generator: 'v0.app'
}

export function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: "#ffffff" },
      { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
    ],
    viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
