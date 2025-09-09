"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Camera, CameraOff, ArrowLeft, Plus, Package, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/layout/dashboard-layout"
import ProtectedRoute from "@/components/auth/protected-route"
import jsQR from "jsqr"
import { Badge } from "@/components/ui/badge"

export default function QRScannerPage() {
  const router = useRouter()
  const [isActive, setIsActive] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [manualInput, setManualInput] = useState("")
  const [scanResult, setScanResult] = useState<{
    qrCode: string
    productId: string
    product?: any
    exists: boolean
  } | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<number | null>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          facingMode: { exact: "environment" }, // Force back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsActive(true)
        
        videoRef.current.play().catch(console.error)
        
        // Start QR scanning after a short delay
        setTimeout(() => {
          startQRScanning()
        }, 1000)
      }
    } catch (error) {
      console.error("Camera error:", error)
      // If exact back camera fails, try with preferred back camera
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            facingMode: "environment", // Prefer back camera (not exact)
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        })
        
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream
          streamRef.current = fallbackStream
          setIsActive(true)
          
          videoRef.current.play().catch(console.error)
          
          setTimeout(() => {
            startQRScanning()
          }, 1000)
        }
      } catch (fallbackError) {
        console.error("Fallback camera error:", fallbackError)
        toast.error("Unable to access back camera. Please check permissions.")
      }
    }
  }

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsActive(false)
    setIsScanning(false)
  }

  const startQRScanning = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    setIsScanning(true)
    
    scanIntervalRef.current = window.setInterval(() => {
      scanForQR()
    }, 500) // Check for QR codes every 500ms
  }

  const scanForQR = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return
    }
    
    const context = canvas.getContext('2d')
    if (!context) return
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0)
    
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height)
    
    if (qrCode) {
      handleQRDetected(qrCode.data)
    }
  }

  const handleQRDetected = async (qrData: string) => {
    console.log("QR Code detected:", qrData)
    
    // Clean the QR data and generate product ID
    const cleanQRData = qrData.trim().toUpperCase().replace('LPG-', '')
    const productId = `LPG-${cleanQRData}`
    
    // Stop scanning after detection
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
      setIsScanning(false)
    }
    
    toast.success(`QR Code found: ${qrData}`)
    
    try {
      // Check if product exists in database
      const response = await fetch(`/api/products/check-qr?qr=${encodeURIComponent(cleanQRData)}`)
      const data = await response.json()
      
      setScanResult({
        qrCode: cleanQRData,
        productId: productId,
        product: data.product,
        exists: data.exists
      })
      
      // Set the QR code in manual input for reference
      setManualInput(cleanQRData)
      
    } catch (error) {
      console.error('Error checking product:', error)
      toast.error('Failed to check product in database')
      
      // Still show the QR result even if API fails
      setScanResult({
        qrCode: cleanQRData,
        productId: productId,
        exists: false
      })
      setManualInput(cleanQRData)
    }
  }

  const handleManualInput = async (e: React.FormEvent) => {
    e.preventDefault()
    if (manualInput.trim()) {
      await handleQRDetected(manualInput.trim())
    }
  }

  const resetScanner = () => {
    setScanResult(null)
    setManualInput("")
  }

  const navigateToAddProduct = () => {
    if (scanResult) {
      router.push(`/add-item?qr=${encodeURIComponent(scanResult.qrCode)}`)
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <ProtectedRoute permission="add_product">
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">QR Scanner</h1>
              <p className="text-gray-600">Scan QR codes or enter manually</p>
            </div>
          </div>

          {/* Camera */}
          <Card>
            <CardHeader>
              <CardTitle>Camera Scanner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Hidden canvas for QR detection */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                {/* Scanning overlay */}
                {isActive && isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 border-2 border-green-400 rounded-lg relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                    </div>
                  </div>
                )}
                
                {/* Scanning status */}
                {isActive && isScanning && (
                  <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded text-sm">
                    Scanning for QR codes...
                  </div>
                )}
                
                {!isActive && (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center">
                      <Camera className="h-16 w-16 mx-auto mb-4" />
                      <p>Camera not active</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center space-x-2">
                {!isActive ? (
                  <Button onClick={startCamera}>
                    <Camera className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                ) : (
                  <>
                    <Button onClick={stopCamera} variant="outline">
                      <CameraOff className="h-4 w-4 mr-2" />
                      Stop Camera
                    </Button>
                    {isActive && !isScanning && (
                      <Button onClick={startQRScanning} variant="outline">
                        <Camera className="h-4 w-4 mr-2" />
                        Restart Scanning
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Manual Input */}
          <Card>
            <CardHeader>
              <CardTitle>Manual Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualInput} className="space-y-4">
                <Input
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Enter QR code data or scan with camera"
                />
                <Button type="submit" className="w-full">
                  Submit QR Code
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Scan Result */}
          {scanResult && (
            <Card className={`border-2 ${scanResult.exists ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className={scanResult.exists ? 'text-green-900' : 'text-orange-900'}>
                    {scanResult.exists ? 'Product Found' : 'Product Not Found'}
                  </span>
                  <Button variant="ghost" size="sm" onClick={resetScanner}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">QR Code:</span>
                    <Badge variant="secondary">{scanResult.qrCode}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Product ID:</span>
                    <Badge variant="outline">{scanResult.productId}</Badge>
                  </div>
                </div>

                {scanResult.exists && scanResult.product ? (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="font-semibold text-lg text-green-900">{scanResult.product.name}</h3>
                      <p className="text-gray-600">{scanResult.product.brand}</p>
                      <p className="text-gray-600">{scanResult.product.weight_kg}kg {scanResult.product.unit_type}</p>
                      <p className="text-gray-600">Stock: {scanResult.product.current_stock}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={() => router.push('/stock-movements')} className="flex-1 bg-green-600 hover:bg-green-700">
                        <Package className="h-4 w-4 mr-2" />
                        Manage Status
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-orange-200">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        <p className="text-orange-800 font-medium">This product is not in the database</p>
                      </div>
                      <p className="text-gray-600 mt-2">Would you like to add it as a new product?</p>
                    </div>
                    <Button onClick={navigateToAddProduct} className="w-full bg-orange-600 hover:bg-orange-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Product
                    </Button>
                  </div>
                )}

                <Button onClick={resetScanner} variant="outline" className="w-full">
                  Scan Another QR Code
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Demo Codes */}
          <Card>
            <CardHeader>
              <CardTitle>Demo QR Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {["LPG-PET-11KG-001", "LPG-SHE-22KG-002", "LPG-SOL-27KG-003", "LPG-TOT-50KG-004"].map((code) => (
                  <Button
                    key={code}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setManualInput(code)
                      toast.success(`Selected: ${code}`)
                    }}
                    className="text-xs"
                  >
                    {code}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}