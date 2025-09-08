"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Camera, CameraOff, Flashlight, FlashlightOff, Scan, ArrowLeft, X } from "lucide-react"
import { toast } from "sonner"
import { parseQRData, getProductByQRData } from "@/lib/supabase"
import jsQR from "jsqr"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import ProtectedRoute from "@/components/auth/protected-route"

export default function QRScannerPage() {
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [hasFlash, setHasFlash] = useState(false)
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [manualInput, setManualInput] = useState("")
  const [lastScanned, setLastScanned] = useState<string>("")
  const [scanResult, setScanResult] = useState<any>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Demo QR codes for testing
  const demoQRCodes = ["LPG-PET-11KG-001", "LPG-SHE-22KG-002", "LPG-SOL-27KG-003", "LPG-TOT-50KG-004"]

  const startScanning = async () => {
    try {
      setCameraError(null)
      setIsVideoLoaded(false)
      
      console.log("Requesting camera access...")
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      console.log("Camera stream obtained:", stream)
      
      if (videoRef.current) {
        const video = videoRef.current
        
        // Add event listeners for video loading
        video.onloadedmetadata = () => {
          console.log("Video metadata loaded")
          console.log("Video dimensions:", video.videoWidth, "x", video.videoHeight)
        }
        
        video.oncanplay = () => {
          console.log("Video can start playing")
          setIsVideoLoaded(true)
        }
        
        video.onerror = (error) => {
          console.error("Video error:", error)
          setCameraError("Video playback error")
        }

        video.srcObject = stream
        streamRef.current = stream

        // Wait for video to be ready
        await new Promise((resolve) => {
          video.onloadeddata = () => {
            console.log("Video data loaded")
            resolve(true)
          }
        })

        // Check for flash capability
        const track = stream.getVideoTracks()[0]
        console.log("Video track:", track)
        const capabilities = track.getCapabilities()
        console.log("Camera capabilities:", capabilities)
        setHasFlash("torch" in capabilities)

        setIsScanning(true)

        // Start real QR code detection
        setTimeout(() => {
          startQRDetection()
        }, 500) // Small delay to ensure video is fully ready
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setCameraError(errorMessage)
      
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
    console.log("Stopping camera...")
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        console.log("Stopping track:", track)
        track.stop()
      })
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsScanning(false)
    setIsVideoLoaded(false)
    setFlashEnabled(false)
    setCameraError(null)
  }

  const toggleFlash = async () => {
    if (streamRef.current && hasFlash) {
      const track = streamRef.current.getVideoTracks()[0]
      try {
        await track.applyConstraints({
          // @ts-ignore - torch is not in standard MediaTrackConstraintSet but supported by many browsers
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
    stopScanning() // Stop scanning when QR is detected

    // Parse QR data
    const parsed = parseQRData(qrData)
    if (!parsed) {
      toast.error("Invalid QR code format")
      setScanResult({ qrData, error: "Invalid QR code format" })
      return
    }

    // Get product data
    const { data: product, error } = await getProductByQRData(qrData)

    if (error) {
      toast.error("Product not found for this QR code")
      setScanResult({ qrData, error: "Product not found" })
    } else {
      toast.success(`Product found: ${product?.name}`)
      setScanResult({ qrData, product })
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualInput.trim()) return

    await handleQRDetected(manualInput.trim())
    setManualInput("")
  }

  const handleDemoQRClick = async (qrData: string) => {
    await handleQRDetected(qrData)
  }

  const resetScanner = () => {
    setScanResult(null)
    setLastScanned("")
  }

  const navigateToQRCodes = () => {
    router.push("/qr-codes")
  }

  const navigateToProduct = () => {
    if (scanResult?.product?.id) {
      router.push(`/edit-item/${scanResult.product.id}`)
    }
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
    <ProtectedRoute permission="add_product">
      <DashboardLayout>
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={navigateToQRCodes}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to QR Codes
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-blue-900">QR Code Scanner</h1>
                <p className="text-gray-600">Scan QR codes to find products</p>
              </div>
            </div>
          </div>

          {/* Scanner Card */}
          <Card className="border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
              <CardTitle className="flex items-center text-blue-900">
                <Scan className="h-5 w-5 mr-2" />
                Camera Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {/* Camera View */}
              <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: "4/3" }}>
                {isScanning ? (
                  <>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover"
                      style={{ 
                        transform: "scaleX(-1)", // Mirror the video for better UX
                        backgroundColor: "#000" // Black background while loading
                      }}
                    />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    
                    {/* Loading indicator */}
                    {!isVideoLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="text-center text-white">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                          <p>Loading camera...</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Error display */}
                    {cameraError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                        <div className="text-center text-red-600 p-4">
                          <p className="font-medium mb-2">Camera Error</p>
                          <p className="text-sm">{cameraError}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Scanning Overlay - only show when video is loaded */}
                    {isVideoLoaded && !cameraError && (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-64 h-64 border-2 border-white rounded-lg relative">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                          </div>
                        </div>
                        {/* Scanning Line Animation */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-64 h-1 bg-blue-500 animate-pulse"></div>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Camera className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium mb-2">Camera Ready</p>
                      <p className="text-sm">Click "Start Camera" to begin scanning</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex justify-center space-x-2">
                {!isScanning ? (
                  <Button 
                    onClick={startScanning} 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!!cameraError}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                ) : (
                  <>
                    <Button onClick={stopScanning} variant="outline">
                      <CameraOff className="h-4 w-4 mr-2" />
                      Stop Camera
                    </Button>
                    {hasFlash && (
                      <Button onClick={toggleFlash} variant="outline" disabled={!isVideoLoaded}>
                        {flashEnabled ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
                      </Button>
                    )}
                  </>
                )}
                
                {/* Retry button for errors */}
                {cameraError && (
                  <Button onClick={startScanning} variant="outline" className="text-orange-600">
                    Retry Camera
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Manual Input */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Manual Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleManualSubmit} className="flex space-x-2">
                <Input
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Enter QR code data manually"
                  className="flex-1"
                />
                <Button type="submit" variant="outline">
                  <Scan className="h-4 w-4 mr-2" />
                  Scan
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Demo QR Codes */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Demo QR Codes</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Scan Result */}
          {scanResult && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-green-900">
                  <span>Scan Result</span>
                  <Button variant="ghost" size="sm" onClick={resetScanner}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>QR Code Data:</Label>
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    {scanResult.qrData}
                  </Badge>
                </div>

                {scanResult.product ? (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="font-semibold text-lg text-green-900">{scanResult.product.name}</h3>
                      <p className="text-gray-600">{scanResult.product.brand}</p>
                      <p className="text-gray-600">{scanResult.product.weight_kg}kg {scanResult.product.unit_type}</p>
                      <p className="text-gray-600">Stock: {scanResult.product.current_stock || scanResult.product.quantity}</p>
                    </div>
                    <Button onClick={navigateToProduct} className="w-full bg-green-600 hover:bg-green-700">
                      View/Edit Product
                    </Button>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <p className="text-yellow-800">{scanResult.error}</p>
                  </div>
                )}

                <Button onClick={resetScanner} variant="outline" className="w-full">
                  Scan Another QR Code
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Debug Information - only show when scanning or there's an error */}
          {(isScanning || cameraError) && (
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Debug Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p><strong>Scanning:</strong> {isScanning ? 'Yes' : 'No'}</p>
                  <p><strong>Video Loaded:</strong> {isVideoLoaded ? 'Yes' : 'No'}</p>
                  <p><strong>Has Flash:</strong> {hasFlash ? 'Yes' : 'No'}</p>
                  <p><strong>Flash Enabled:</strong> {flashEnabled ? 'Yes' : 'No'}</p>
                  {cameraError && (
                    <p><strong>Error:</strong> <span className="text-red-600">{cameraError}</span></p>
                  )}
                  <p><strong>Stream Active:</strong> {streamRef.current ? 'Yes' : 'No'}</p>
                  {streamRef.current && (
                    <p><strong>Video Tracks:</strong> {streamRef.current.getVideoTracks().length}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Point camera at QR code within the scanning area</p>
                <p>• Ensure good lighting for best results</p>
                <p>• Hold device steady until QR code is detected</p>
                <p>• Use manual input if camera scanning fails</p>
                <p>• Try demo QR codes if you don't have physical codes</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}