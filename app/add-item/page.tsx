"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Package, QrCode, ArrowLeft, Camera, CameraOff } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import ProtectedRoute from "@/components/auth/protected-route"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { authenticatedPost } from "@/lib/api-client"
import jsQR from "jsqr"

export default function AddItemPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [qrCodeFromUrl, setQrCodeFromUrl] = useState<string | null>(null)
  const [manualQrInput, setManualQrInput] = useState("")
  const [showScanner, setShowScanner] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<number | null>(null)

  const [formData, setFormData] = useState({
    weight_kg: "",
    unit_cost: "",
    supplier: "",
  })

  // Handle QR code from URL parameters
  useEffect(() => {
    const qrParam = searchParams.get('qr')
    if (qrParam) {
      // Remove LPG- prefix if present
      const cleanQR = qrParam.trim().toUpperCase().replace('LPG-', '')
      setQrCodeFromUrl(cleanQR)
      setManualQrInput(cleanQR)
    }
  }, [searchParams])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

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
        setCameraActive(true)
        
        // Play video and start scanning
        await videoRef.current.play()
        startQRScanning()
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
          setCameraActive(true)
          
          // Play video and start scanning
          await videoRef.current.play()
          startQRScanning()
        }
      } catch (fallbackError) {
        console.error("Fallback camera error:", fallbackError)
        toast({
          title: "Camera Error",
          description: "Unable to access back camera. Please check permissions.",
          variant: "destructive",
        })
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
    setCameraActive(false)
    setIsScanning(false)
  }

  const startQRScanning = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    setIsScanning(true)
    
    scanIntervalRef.current = window.setInterval(() => {
      scanForQR()
    }, 300) // Check for QR codes every 300ms (increased from 500ms for better responsiveness)
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

  const handleQRDetected = (qrData: string) => {
    console.log("QR Code detected:", qrData)
    
    // Clean the QR data (preserve exact case and special characters)
    const cleanQRData = qrData.trim()
    
    // Stop scanning after detection
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
      setIsScanning(false)
    }
    
    // Set the QR code
    setQrCodeFromUrl(cleanQRData)
    setManualQrInput(cleanQRData)
    setShowScanner(false)
    stopCamera()
    
    toast({
      title: "QR Code Scanned",
      description: `Successfully scanned: ${cleanQRData}`,
    })
  }

  const handleManualQRSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualQrInput.trim()) {
      // No longer removing LPG- prefix, preserve exact case and special characters
      const cleanQR = manualQrInput.trim()
      setQrCodeFromUrl(cleanQR)
    }
  }

  const handleWeightChange = (weight: string) => {
    setFormData((prev) => ({
      ...prev,
      weight_kg: weight,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields - simplified validation
      if (!qrCodeFromUrl) {
        toast({
          title: "Validation Error",
          description: "QR code is required. Please scan a QR code first.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (!formData.weight_kg || !formData.unit_cost) {
        toast({
          title: "Validation Error",
          description: "Please fill in cylinder weight and unit cost",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Create simplified product data
      const productData = {
        qr_code: qrCodeFromUrl,
        weight_kg: parseFloat(formData.weight_kg),
        unit_cost: parseFloat(formData.unit_cost),
        supplier: formData.supplier || null,
      }

      // Create product using new QR-based system
      const response = await authenticatedPost('/api/products/create', productData)

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle specific error cases
        if (response.status === 409) {
          // Duplicate entry error
          toast({
            title: "Duplicate Product",
            description: `A product with QR code "${qrCodeFromUrl}" already exists in your inventory.`,
            variant: "destructive",
          })
        } else if (response.status === 503 && errorData.code === 'TABLES_NOT_FOUND') {
          // Database setup required
          toast({
            title: "Database Setup Required",
            description: "Please run the database migration script in Supabase SQL Editor first.",
            variant: "destructive",
          })
        } else {
          // General error
          throw new Error(errorData.error || 'Failed to create product')
        }
        
        setLoading(false)
        return
      }

      const { product } = await response.json()

      toast({
        title: "Success",
        description: `${formData.weight_kg}kg Cylinder added successfully (ID: ${qrCodeFromUrl})`,
      })

      // Reset form and navigate
      setQrCodeFromUrl(null)
      setManualQrInput("")
      setFormData({
        weight_kg: "",
        unit_cost: "",
        supplier: "",
      })
      
      router.push("/")
    } catch (error) {
      console.error("Error adding product:", error)
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute permission="add_product">
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {qrCodeFromUrl ? "Add Scanned Product" : "Add Cylinder"}
              </h1>
              <p className="text-gray-600">
                {qrCodeFromUrl 
                  ? `Create product from QR code: ${qrCodeFromUrl}` 
                  : "Add a new cylinder to your inventory"
                }
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Product Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* QR Code Section */}
                {!qrCodeFromUrl ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="qr_code">QR Code *</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="qr_code"
                          value={manualQrInput}
                          onChange={(e) => setManualQrInput(e.target.value)}
                          placeholder="Scan QR code or enter manually"
                          required
                        />
                        <Button type="button" onClick={() => setShowScanner(!showScanner)} variant="outline">
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Manual QR Submit Button */}
                    <Button type="button" onClick={handleManualQRSubmit} className="w-full" disabled={!manualQrInput.trim()}>
                      Use QR Code
                    </Button>

                    {/* QR Scanner */}
                    {showScanner && (
                      <div className="space-y-4">
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
                          {cameraActive && isScanning && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-64 h-64 border-2 border-green-400 rounded-lg relative">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                              </div>
                            </div>
                          )}
                          
                          {!cameraActive && (
                            <div className="absolute inset-0 flex items-center justify-center text-white">
                              <div className="text-center">
                                <Camera className="h-16 w-16 mx-auto mb-4" />
                                <p>Camera not active</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex justify-center space-x-2">
                          {!cameraActive ? (
                            <Button type="button" onClick={startCamera} className="w-full">
                              <Camera className="h-4 w-4 mr-2" />
                              Start Camera
                            </Button>
                          ) : (
                            <Button type="button" onClick={stopCamera} variant="outline" className="w-full">
                              <CameraOff className="h-4 w-4 mr-2" />
                              Stop Camera
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* QR Code Information */}
                    <div className="space-y-3 bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2">
                        <QrCode className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-900">QR Code Product</span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-green-800">
                          <strong>QR Code:</strong> {qrCodeFromUrl}
                        </p>
                        <p className="text-sm text-green-800">
                          <strong>Product ID:</strong> {qrCodeFromUrl}
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setQrCodeFromUrl(null)
                          setManualQrInput("")
                        }}
                      >
                        Rescan QR Code
                      </Button>
                    </div>
                    
                    <Separator />
                  </>
                )}

                {/* Weight Selection */}
                <div className="space-y-2">
                  <Label htmlFor="weight">Cylinder Weight *</Label>
                  <Select value={formData.weight_kg} onValueChange={handleWeightChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cylinder weight" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="11">11kg - Residential</SelectItem>
                      <SelectItem value="22">22kg - Small Business</SelectItem>
                      <SelectItem value="50">50kg - Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Unit Cost */}
                <div className="space-y-2">
                  <Label htmlFor="unit_cost">Unit Cost (₱) *</Label>
                  <Input
                    id="unit_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData((prev) => ({ ...prev, unit_cost: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Supplier (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier (Optional)</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData((prev) => ({ ...prev, supplier: e.target.value }))}
                    placeholder="Enter supplier name"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex space-x-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading || !qrCodeFromUrl} className="flex-1">
                    {loading ? "Adding..." : "Add Cylinder"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}