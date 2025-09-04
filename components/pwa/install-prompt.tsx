"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Smartphone } from "lucide-react"
import Image from "next/image"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    setDeferredPrompt(null)
  }

  if (!showInstallPrompt || !deferredPrompt) {
    return null
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm lg:left-auto lg:right-4 lg:mx-0 border-primary/20 shadow-xl shadow-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative w-8 h-8 p-1 bg-white rounded-lg shadow-sm">
              <Image
                src="/unica-logo.svg"
                alt="Unica Logo"
                width={24}
                height={24}
                className="w-full h-full object-contain"
              />
            </div>
            <CardTitle className="text-lg text-primary">Install Unica</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="hover:bg-primary/10">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-muted-foreground">
          Install Unica Bar Inventory for quick access and offline use on your device
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button onClick={handleInstall} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <Smartphone className="h-4 w-4 mr-2" />
          Install App
        </Button>
      </CardContent>
    </Card>
  )
}
