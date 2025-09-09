"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Camera, CameraOff, Flashlight, FlashlightOff, Scan, X } from "lucide-react"
import { toast } from "sonner"
import { parseQRData, getProductByQRData } from "@/lib/supabase"
import jsQR from "jsqr"

interface QRCodeScannerProps {
  onScan: (data: string, product?: any) => void
  onClose: () => void
}

export function QRCodeScanner({ onScan, onClose }: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [hasFlash, setHasFlash] = useState(false)
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [manualInput, setManualInput] = useState("")
  const [lastScanned, setLastScanned] = useState<string>("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Demo QR codes for testing (without LPG- prefix)
  const demoQRCodes = ["PET-11KG-001", "SHE-22KG-002", "SOL-27KG-003", "TOT-50KG-004"]

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream

        // Check for flash capability
        const track = stream.getVideoTracks()[0]
        const capabilities = track.getCapabilities()
        setHasFlash("torch" in capabilities)

        setIsScanning(true)

        // Start QR code detection
        startQRDetection()
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      if (errorMessage.includes("Permission denied") || errorMessage.includes("NotAllowedError")) {
        toast.error("Camera permission denied. Please allow camera access and try again.")
      } else if (errorMessage.includes("NotFoundError")) {
        toast.error("No camera found. Please check your device.")
      } else if (errorMessage.includes("NotReadableError")) {
        toast.error("Camera is already in use by another application.")
      } else {
        toast.error("Unable to access camera. Please check permissions and try again.")
      }
    }
  }

  const stopScanning = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
    setFlashEnabled(false)
  }

  const toggleFlash = async () => {
    if (streamRef.current && hasFlash) {
      const track = streamRef.current.getVideoTracks()[0]
      try {
        await track.applyConstraints({
          advanced: [{ torch: !flashEnabled }],
        })
        setFlashEnabled(!flashEnabled)
      } catch (error) {
        console.error("Error toggling flash:", error)
        toast.error("Unable to toggle flash")
      }
    }
  }

  const startQRDetection = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")

    if (!video || !canvas || !context) return

    const scanFrame = () => {
      if (!isScanning) return

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight
        canvas.width = video.videoWidth
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        })

        if (code && code.data) {
          handleQRDetected(code.data)
          return // Stop scanning after successful detection
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame)
    }

    scanFrame()
  }

  const handleQRDetected = async (qrData: string) => {
    if (qrData === lastScanned) return

    setLastScanned(qrData)

    // No longer removing LPG- prefix
    const cleanQRData = qrData.trim().toUpperCase()

    // Get product data
    const { data: product, error } = await getProductByQRData(cleanQRData)

    if (error) {
      toast.error("Product not found for this QR code")
      onScan(cleanQRData)
    } else {
      toast.success(`Product found: ${product?.name}`)
      onScan(cleanQRData, product)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualInput.trim()) return

    // No longer removing LPG- prefix
    await handleQRDetected(manualInput.trim())
    setManualInput("")
  }

  const handleDemoQRClick = async (qrData: string) => {
    await handleQRDetected(qrData)
  }

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      stopScanning()
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">QR Code Scanner</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera View */}
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {isScanning ? (
              <>  
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                {/* Scanning Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white rounded-lg relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                  </div>
                </div>
                {/* Scanning Line Animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-0.5 bg-blue-500 animate-pulse"></div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Camera className="h-12 w-12 mx-auto mb-2" />
                  <p>Camera not active</p>
                </div>
              </div>
            )}
          </div>

          {/* Camera Controls */}
          <div className="flex justify-center space-x-2">
            {!isScanning ? (
              <Button onClick={startScanning} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
            ) : (
              <>
                <Button onClick={stopScanning} variant="outline">
                  <CameraOff className="h-4 w-4 mr-2" />
                  Stop
                </Button>
                {hasFlash && (
                  <Button onClick={toggleFlash} variant="outline">
                    {flashEnabled ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Manual Input */}
          <div className="space-y-2">
            <Label htmlFor="manual-qr">Or enter QR code manually:</Label>
            <form onSubmit={handleManualSubmit} className="flex space-x-2">
              <Input
                id="manual-qr"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter QR code data"
                className="flex-1"
              />
              <Button type="submit" size="sm">
                <Scan className="h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Demo QR Codes */}
          <div className="space-y-2">
            <Label>Demo QR Codes (click to test):</Label>
            <div className="grid grid-cols-2 gap-2">
              {demoQRCodes.map((qr, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoQRClick(qr)}
                  className="text-xs"
                >
                  {qr}
                </Button>
              ))}
            </div>
          </div>

          {/* Last Scanned */}
          {lastScanned && (
            <div className="space-y-2">
              <Label>Last Scanned:</Label>
              <Badge variant="secondary" className="w-full justify-center py-2">
                {lastScanned}
              </Badge>
            </div>
          )}

          {/* Instructions */}
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Point camera at QR code</p>
            <p>• Ensure good lighting</p>
            <p>• Hold steady for best results</p>
            <p>• Use manual input if camera fails</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default QRCodeScanner