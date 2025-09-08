"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TrendingUp, TrendingDown, Package, Calendar, Search, QrCode, Scan } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import ProtectedRoute from "@/components/auth/protected-route"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { QRCodeScanner } from "@/components/qr/qr-code-scanner"

interface Product {
  id: string
  name: string
  brand: string
  weight_kg?: number
  qr_code?: string
  current_stock: number
  unit_type: string
  unit_cost?: number
  // UI compatibility fields
  quantity?: number
  category?: string
}

interface StockMovement {
  id: string
  product_id: string
  movement_type: "in" | "out" | "adjustment"
  quantity: number
  reason: string
  notes?: string
  created_at: string
  created_by: string
  products: Product
}

const movementTypes = [
  { value: "in", label: "Stock In", icon: TrendingUp, color: "text-green-600" },
  { value: "out", label: "Stock Out", icon: TrendingDown, color: "text-red-600" },
  { value: "adjustment", label: "Adjustment", icon: Package, color: "text-blue-600" },
]

const reasons = {
  in: ["Purchase", "Return", "Transfer In", "Production", "Other"],
  out: ["Sale", "Damage", "Transfer Out", "Consumption", "Other"],
  adjustment: ["Count Correction", "Damage", "Expiry", "Loss", "Other"],
}

export default function StockMovementsPage() {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  const [formData, setFormData] = useState({
    product_id: "",
    movement_type: "in" as "in" | "out" | "adjustment",
    quantity: "",
    reason: "",
    notes: "",
  })

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    setMounted(true)
    fetchProducts()
    fetchMovements()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products/list')
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      const { products } = await response.json()
      setProducts(products || [])
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      })
    }
  }

  const fetchMovements = async () => {
    try {
      const response = await fetch('/api/stock-movements')
      if (!response.ok) {
        throw new Error('Failed to fetch movements')
      }
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    if (field === "product_id") {
      const product = products.find((p) => p.id === value)
      setSelectedProduct(product || null)
    }
  }

  const handleQRScan = (data: string, product?: any) => {
    if (product) {
      setSelectedProduct(product)
      setFormData((prev) => ({
        ...prev,
        product_id: product.id,
      }))
      setShowScanner(false)
      toast({
        title: "Product Scanned",
        description: `Selected: ${product.name}`,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.product_id || !formData.quantity || !formData.reason) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const quantity = Number.parseInt(formData.quantity)
    if (quantity <= 0) {
      toast({
        title: "Validation Error",
        description: "Quantity must be greater than 0",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create movement record using new API
      const response = await fetch('/api/stock-movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: formData.product_id,
          movement_type: formData.movement_type,
          quantity: quantity,
          reason: formData.reason,
          notes: formData.notes || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create movement')
      }

      toast({
        title: "Success",
        description: "Stock movement recorded successfully",
      })

      // Reset form
      setFormData({
        product_id: "",
        movement_type: "in",
        quantity: "",
        reason: "",
        notes: "",
      })
      setSelectedProduct(null)

      // Refresh data
      fetchProducts()
      fetchMovements()
    } catch (error) {
      console.error("Error recording movement:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to record movement",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  if (!mounted) {
    return (
      <ProtectedRoute permission="stock_movements">
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">Loading...</div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute permission="stock_movements">
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
            <p className="text-gray-600">Record and track inventory movements</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Movement Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Record Movement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Product Selection */}
                  <div className="space-y-2">
                    <Label>Product Selection</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <Dialog open={showScanner} onOpenChange={setShowScanner}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon">
                            <QrCode className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Scan className="h-5 w-5" />
                              Scan Product QR Code
                            </DialogTitle>
                          </DialogHeader>
                          <QRCodeScanner
                            onScan={handleQRScan}
                            onClose={() => setShowScanner(false)}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>

                    <Select
                      value={formData.product_id}
                      onValueChange={(value) => handleInputChange("product_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{product.name}</span>
                              <Badge variant="secondary" className="ml-2">
                                {product.current_stock} {product.unit_type}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedProduct && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{selectedProduct.name}</span>
                            <Badge variant="outline">{selectedProduct.category}</Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>Brand: {selectedProduct.brand}</p>
                            <p>
                              Current Stock: {selectedProduct.current_stock} {selectedProduct.unit_type}
                            </p>
                            <p>
                              Cost: ₱{selectedProduct.unit_cost?.toFixed(2) || '0.00'} | Selling: ₱
                              {selectedProduct.unit_cost?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Movement Type */}
                  <div>
                    <Label>Movement Type</Label>
                    <Select
                      value={formData.movement_type}
                      onValueChange={(value: "in" | "out" | "adjustment") => handleInputChange("movement_type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {movementTypes.map((type) => {
                          const Icon = type.icon
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <Icon className={`h-4 w-4 ${type.color}`} />
                                {type.label}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantity */}
                  <div>
                    <Label htmlFor="quantity">
                      Quantity {formData.movement_type === "adjustment" ? "(New Total)" : ""}
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange("quantity", e.target.value)}
                      placeholder="Enter quantity"
                      required
                    />
                  </div>

                  {/* Reason */}
                  <div>
                    <Label>Reason</Label>
                    <Select value={formData.reason} onValueChange={(value) => handleInputChange("reason", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {reasons[formData.movement_type].map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      placeholder="Additional notes..."
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting || !formData.product_id}>
                    {isSubmitting ? "Recording..." : "Record Movement"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Recent Movements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Movements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-4">Loading movements...</div>
                  ) : movements.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No movements recorded yet</div>
                  ) : (
                    movements.map((movement) => {
                      const movementType = movementTypes.find((t) => t.value === movement.movement_type)
                      const Icon = movementType?.icon || Package

                      return (
                        <div key={movement.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${movementType?.color}`} />
                              <span className="font-medium">{movement.products.name}</span>
                            </div>
                            <Badge
                              variant={
                                movement.movement_type === "in"
                                  ? "default"
                                  : movement.movement_type === "out"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {movement.movement_type === "in" ? "+" : movement.movement_type === "out" ? "-" : "="}
                              {movement.quantity}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>Reason: {movement.reason}</p>
                            <p>Date: {new Date(movement.created_at).toLocaleDateString()}</p>
                            {movement.notes && <p>Notes: {movement.notes}</p>}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
