"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  TrendingUp, TrendingDown, Package, Calendar, Search, 
  QrCode, Scan, ArrowUpDown, ShoppingCart, Wrench, 
  AlertTriangle, Trash2, Eye, Plus, Camera, CameraOff 
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import ProtectedRoute from "@/components/auth/protected-route"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { useRouter } from "next/navigation"
import jsQR from "jsqr"
import { normalizeQRCode } from '@/lib/qr-utils'

interface Product {
  id: string
  qr_code: string
  weight_kg: number
  status: string
  supplier?: string
  unit_cost: number
}

interface StockMovement {
  id: string
  product_id: string
  from_status: string
  to_status: string
  movement_type: string
  reason?: string
  notes?: string
  reference_number?: string
  movement_date: string
  created_by: string
  products_simplified: Product
}

interface CylinderSummary {
  weight_kg: number
  total_count: number
  available_count: number
  sold_count: number
  maintenance_count: number
  damaged_count: number
  missing_count: number
}

const statusOptions = [
  { value: "available", label: "Available", icon: Package, color: "bg-green-500" },
  { value: "sold", label: "Sold", icon: ShoppingCart, color: "bg-blue-500" },
  { value: "maintenance", label: "Maintenance", icon: Wrench, color: "bg-yellow-500" },
  { value: "damaged", label: "Damaged", icon: AlertTriangle, color: "bg-red-500" },
  { value: "missing", label: "Missing", icon: Eye, color: "bg-gray-500" },
]

const movementTypes = [
  { value: "status_change", label: "Status Change" },
  { value: "sale", label: "Sale" },
  { value: "purchase", label: "Purchase" },
  { value: "maintenance", label: "Maintenance" },
  { value: "damage", label: "Damage Report" },
  { value: "found", label: "Found" },
  { value: "lost", label: "Lost/Missing" },
]

export default function SimplifiedStockMovementsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [summary, setSummary] = useState<CylinderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [showMovementForm, setShowMovementForm] = useState(false)
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [manualQrInput, setManualQrInput] = useState("")

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<number | null>(null)

  const [formData, setFormData] = useState({
    product_id: "",
    to_status: "",
    movement_type: "",
    reason: "",
    notes: "",
    reference_number: "",
    weight_kg: "", // For new product creation
    unit_cost: "", // For new product creation
    supplier: "", // For new product creation
  })

  const [filters, setFilters] = useState({
    status: "",
    weight: "",
    movement_type: "",
  })

  useEffect(() => {
    setMounted(true)
    fetchMovements()
    fetchSummary()
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchMovements()
    }
  }, [filters])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const fetchMovements = async () => {
    try {
      const queryParams = new URLSearchParams()
      if (filters.status) queryParams.set('status', filters.status)
      if (filters.weight) queryParams.set('weight', filters.weight)
      
      const response = await fetch(`/api/stock-movements/simplified?${queryParams}`)
      if (!response.ok) throw new Error('Failed to fetch movements')
      
      const { movements } = await response.json()
      setMovements(movements || [])
    } catch (error) {
      console.error("Error fetching movements:", error)
      toast({
        title: "Error",
        description: "Failed to fetch stock movements",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      // We'll implement this as a separate endpoint if needed
      // For now, calculate summary from movements
    } catch (error) {
      console.error("Error fetching summary:", error)
    }
  }

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

  const handleQRDetected = async (qrData: string) => {
    console.log("QR Code detected:", qrData)
    
    // Normalize the QR data to extract the product identifier
    const normalizedQRData = normalizeQRCode(qrData)
    console.log("Normalized QR Data:", normalizedQRData)
    
    // Stop scanning after detection
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
      setIsScanning(false)
    }
    
    // Set the QR code
    setShowScanner(false)
    stopCamera()
    
    // Check if product exists using the normalized QR code
    try {
      const response = await fetch(`/api/products/check-qr?qr=${encodeURIComponent(normalizedQRData)}`)
      const data = await response.json()
      
      if (data.exists && data.product) {
        setScannedProduct(data.product)
        setFormData(prev => ({ ...prev, product_id: data.product.id }))
        setShowMovementForm(true)
        toast({
          title: "Product Found",
          description: `Successfully scanned: ${normalizedQRData}`,
        })
      } else {
        // Product not found - redirect to manual entry dialog
        setFormData(prev => ({ 
          ...prev, 
          product_id: normalizedQRData // Pre-fill with the QR code
        }))
        setShowMovementForm(true)
        toast({
          title: "Product Not Found",
          description: "This QR code is not registered. You can create a new product with this QR code.",
        })
      }
    } catch (error) {
      console.error("Error checking product:", error)
      toast({
        title: "Error",
        description: "Failed to check product in database",
        variant: "destructive",
      })
    }
  }

  const handleManualQRSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (manualQrInput.trim()) {
      // Normalize the manual input to extract the product identifier
      const normalizedQR = normalizeQRCode(manualQrInput.trim())
      console.log("Manual QR Input:", manualQrInput)
      console.log("Normalized Manual QR:", normalizedQR)
      
      // Check if product exists using the normalized QR code
      try {
        const response = await fetch(`/api/products/check-qr?qr=${encodeURIComponent(normalizedQR)}`)
        const data = await response.json()
        
        if (data.exists && data.product) {
          setScannedProduct(data.product)
          setFormData(prev => ({ ...prev, product_id: data.product.id }))
          setShowMovementForm(true)
          toast({
            title: "Product Found",
            description: `Successfully found: ${normalizedQR}`,
          })
        } else {
          // Product not found - redirect to manual entry dialog
          setFormData(prev => ({ 
            ...prev, 
            product_id: normalizedQR // Pre-fill with the QR code
          }))
          setShowMovementForm(true)
          toast({
            title: "Product Not Found",
            description: "This QR code is not registered. You can create a new product with this QR code.",
          })
        }
      } catch (error) {
        console.error("Error checking product:", error)
        toast({
          title: "Error",
          description: "Failed to check product in database",
          variant: "destructive",
        })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.product_id || !formData.to_status || !formData.movement_type) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    // If creating a new product, validate the additional fields
    if (!scannedProduct) {
      if (!formData.weight_kg || !formData.unit_cost) {
        toast({
          title: "Validation Error",
          description: "Please fill in weight and unit cost for new products",
          variant: "destructive",
        })
        return
      }
    }

    setIsSubmitting(true)

    try {
      // First, check if the product exists
      const checkResponse = await fetch(`/api/products/check-qr?qr=${encodeURIComponent(formData.product_id)}`)
      const checkData = await checkResponse.json()
      
      let productId = formData.product_id
      
      // If product doesn't exist, we need to create it first
      if (!checkData.exists) {
        // Show a toast indicating that we're creating the product
        toast({
          title: "Creating Product",
          description: "Creating new product with the provided QR code...",
        })
        
        // Prepare product creation data
        const productCreationData = {
          qr_code: formData.product_id,
          weight_kg: parseFloat(formData.weight_kg),
          unit_cost: parseFloat(formData.unit_cost),
          supplier: formData.supplier || null,
        }
        
        // Create the product
        const createResponse = await fetch('/api/products/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productCreationData),
        })
        
        if (!createResponse.ok) {
          const errorData = await createResponse.json()
          throw new Error(errorData.error || 'Failed to create product')
        }
        
        const createData = await createResponse.json()
        productId = createData.product.id
        
        toast({
          title: "Product Created",
          description: "New product created successfully.",
        })
      } else {
        // Product exists, use its ID
        productId = checkData.product.id
      }

      // Proceed with creating the movement
      const movementData = {
        ...formData,
        product_id: productId
      }

      const response = await fetch('/api/stock-movements/simplified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(movementData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create movement')
      }

      toast({
        title: "Success",
        description: "Stock movement recorded successfully",
      })

      // Reset form and refresh data
      setFormData({
        product_id: "",
        to_status: "",
        movement_type: "",
        reason: "",
        notes: "",
        reference_number: "",
        weight_kg: "",
        unit_cost: "",
        supplier: "",
      })
      setScannedProduct(null)
      setShowMovementForm(false)
      
      fetchMovements()
      fetchSummary()
    } catch (error) {
      console.error("Error creating movement:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record movement",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = statusOptions.find(s => s.value === status)
    if (!statusConfig) return <Badge variant="secondary">{status}</Badge>

    return (
      <Badge className={`${statusConfig.color} text-white`}>
        <statusConfig.icon className="h-3 w-3 mr-1" />
        {statusConfig.label}
      </Badge>
    )
  }

  if (!mounted) return null

  return (
    <ProtectedRoute permission="stock_movements">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cylinder Management</h1>
              <p className="text-gray-600">Track individual cylinder status and movements</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowScanner(!showScanner)} variant={showScanner ? "secondary" : "default"}>
                <Scan className="h-4 w-4 mr-2" />
                {showScanner ? "Close Scanner" : "Scan QR Code"}
              </Button>
              <Button variant="outline" onClick={() => {
                // Reset form when opening manual entry
                setFormData({
                  product_id: "",
                  to_status: "",
                  movement_type: "",
                  reason: "",
                  notes: "",
                  reference_number: "",
                  weight_kg: "",
                  unit_cost: "",
                  supplier: "",
                })
                setScannedProduct(null)
                setManualQrInput("")
                setShowMovementForm(true)
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Manual Entry
              </Button>
            </div>
          </div>

          {/* QR Scanner */}
          {showScanner && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Scan className="h-5 w-5" />
                  <span>QR Code Scanner</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Camera View */}
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
                  
                  {/* Camera Controls */}
                  <div className="flex justify-center space-x-2">
                    {!cameraActive ? (
                      <Button onClick={startCamera} className="w-full">
                        <Camera className="h-4 w-4 mr-2" />
                        Start Camera
                      </Button>
                    ) : (
                      <Button onClick={stopCamera} variant="outline" className="w-full">
                        <CameraOff className="h-4 w-4 mr-2" />
                        Stop Camera
                      </Button>
                    )}
                  </div>
                  
                  {/* Manual Input */}
                  <div className="space-y-2">
                    <Label htmlFor="manual-qr">Or enter QR code manually:</Label>
                    <form onSubmit={handleManualQRSubmit} className="flex space-x-2">
                      <Input
                        id="manual-qr"
                        value={manualQrInput}
                        onChange={(e) => setManualQrInput(e.target.value)}
                        placeholder="Enter QR code data"
                        className="flex-1"
                      />
                      <Button type="submit" disabled={!manualQrInput.trim()}>
                        Submit
                      </Button>
                    </form>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[11, 22, 50].map((weight) => (
              <Card key={weight}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{weight}kg Cylinders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-600">Available:</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">Sold:</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-600">Maintenance:</span>
                      <span className="font-medium">0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">Damaged:</span>
                      <span className="font-medium">0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Weight</Label>
                  <Select value={filters.weight} onValueChange={(value) => setFilters(prev => ({ ...prev, weight: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All weights" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All weights</SelectItem>
                      <SelectItem value="11">11kg</SelectItem>
                      <SelectItem value="22">22kg</SelectItem>
                      <SelectItem value="50">50kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Movement Type</Label>
                  <Select value={filters.movement_type} onValueChange={(value) => setFilters(prev => ({ ...prev, movement_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      {movementTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Movements Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Movements</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading movements...</div>
              ) : movements.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No movements found</h3>
                  <p className="text-gray-600 mb-4">Start by scanning QR codes to track cylinder movements</p>
                  <Button onClick={() => setShowScanner(true)}>
                    <Scan className="h-4 w-4 mr-2" />
                    Scan First QR Code
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cylinder ID</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>From Status</TableHead>
                      <TableHead>To Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="font-mono text-sm">
                          {movement.products_simplified?.id || movement.product_id}
                        </TableCell>
                        <TableCell>
                          {movement.products_simplified?.weight_kg}kg
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(movement.from_status)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(movement.to_status)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {movementTypes.find(t => t.value === movement.movement_type)?.label || movement.movement_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(movement.movement_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {movement.reason || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Movement Form Dialog */}
        <Dialog open={showMovementForm} onOpenChange={setShowMovementForm}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Record Movement</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Product ID *</Label>
                <Input
                  value={formData.product_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, product_id: e.target.value }))}
                  placeholder="Enter product ID"
                  required
                  readOnly={!!scannedProduct}
                />
                {scannedProduct && (
                  <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                    <p className="font-medium">Scanned Product:</p>
                    <p className="truncate">ID: {scannedProduct.id}</p>
                    <p>Weight: {scannedProduct.weight_kg}kg</p>
                    <p>Status: {scannedProduct.status}</p>
                  </div>
                )}
                {!scannedProduct && formData.product_id && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                    <p className="font-medium">New Product:</p>
                    <p className="truncate">QR Code: {formData.product_id}</p>
                    <p className="text-gray-600">This product will be created when you submit this form.</p>
                  </div>
                )}
              </div>
              
              {/* Fields for new product creation */}
              {!scannedProduct && formData.product_id && (
                <>
                  <div>
                    <Label>Weight (kg) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.weight_kg || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, weight_kg: e.target.value }))}
                      placeholder="Enter weight in kg"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label>Unit Cost *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.unit_cost || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit_cost: e.target.value }))}
                      placeholder="Enter unit cost"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label>Supplier</Label>
                    <Input
                      value={formData.supplier || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                      placeholder="Enter supplier name (optional)"
                    />
                  </div>
                </>
              )}
              
              <div>
                <Label>New Status *</Label>
                <Select 
                  value={formData.to_status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, to_status: value }))}
                  disabled={!formData.product_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Movement Type *</Label>
                <Select 
                  value={formData.movement_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, movement_type: value }))}
                  disabled={!formData.product_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select movement type" />
                  </SelectTrigger>
                  <SelectContent>
                    {movementTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Reason</Label>
                <Input
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g., Customer purchase, Routine maintenance"
                  disabled={!formData.product_id}
                />
              </div>

              <div>
                <Label>Reference Number</Label>
                <Input
                  value={formData.reference_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                  placeholder="Invoice, receipt, or reference number"
                  disabled={!formData.product_id}
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={3}
                  disabled={!formData.product_id}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowMovementForm(false)
                    setScannedProduct(null)
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !formData.product_id || !formData.to_status || !formData.movement_type}
                >
                  {isSubmitting ? "Recording..." : "Record Movement"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  )
}