"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, X, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onBarcodeDetected, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [manualBarcode, setManualBarcode] = useState("")
  const [error, setError] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { toast } = useToast()

  const startCamera = async () => {
    try {
      setError("")
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)
      }
    } catch (err) {
      setError("Camera access denied or not available")
      console.error("Camera error:", err)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualBarcode.trim()) {
      onBarcodeDetected(manualBarcode.trim())
      toast({
        title: "Barcode entered",
        description: `Barcode: ${manualBarcode}`,
      })
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            Barcode Scanner
          </span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Camera Section */}
        <div className="space-y-4">
          {!isScanning ? (
            <div className="text-center space-y-4">
              <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                <Camera className="h-12 w-12 text-muted-foreground" />
              </div>
              <Button onClick={startCamera} className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <video ref={videoRef} autoPlay playsInline className="w-full h-48 bg-black rounded-lg object-cover" />
                <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-24 border-2 border-red-500 rounded"></div>
                </div>
              </div>
              <Button onClick={stopCamera} variant="outline" className="w-full">
                Stop Camera
              </Button>
              <p className="text-sm text-muted-foreground text-center">Position the barcode within the red frame</p>
            </div>
          )}
        </div>

        {/* Manual Entry Section */}
        <div className="border-t pt-4">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-barcode">Or enter barcode manually</Label>
              <Input
                id="manual-barcode"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                placeholder="Enter barcode number"
              />
            </div>
            <Button type="submit" variant="outline" className="w-full">
              <Search className="h-4 w-4 mr-2" />
              Search Product
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
