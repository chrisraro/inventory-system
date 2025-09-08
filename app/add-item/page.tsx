"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, Package, QrCode, ArrowLeft } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import ProtectedRoute from "@/components/auth/protected-route"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { createProduct, generateQRCodeData, createQRCode } from "@/lib/supabase"
import { LPG_BRANDS, formatWeight } from "@/lib/constants"
import { LPG_WEIGHTS, getThresholdByWeight } from "@/lib/validation"
import { cn } from "@/lib/utils"

export default function AddItemPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [expirationDate, setExpirationDate] = useState<Date>()
  const [qrCodeFromUrl, setQrCodeFromUrl] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    weight_kg: "",
    brand: "",
    supplier: "",
    unit_cost: "",
    quantity: "",
    minimum_stock: "",
    maximum_stock: "",
    location: "",
    notes: "",
  })

  // Handle QR code from URL parameters
  useEffect(() => {
    const qrParam = searchParams.get('qr')
    if (qrParam) {
      setQrCodeFromUrl(qrParam)
    }
  }, [searchParams])

  const handleWeightChange = (weight: string) => {
    const weightValue = Number.parseFloat(weight)
    const threshold = getThresholdByWeight(weightValue)

    setFormData((prev) => ({
      ...prev,
      weight_kg: weight,
      minimum_stock: threshold.toString(),
      maximum_stock: (threshold * 10).toString(), // Default max stock
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.weight_kg || !formData.brand || !formData.unit_cost || !formData.quantity) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      // Create product with QR-based ID
      const qrCode = qrCodeFromUrl || ""
      const productId = qrCode ? `LPG-${qrCode.toUpperCase().replace('LPG-', '')}` : undefined
      
      const productData = {
        id: productId, // Use QR-based ID if available
        qr_code: qrCode, // Store raw QR code
        name: "LPG Cylinder",
        brand: formData.brand,
        weight_kg: Number.parseFloat(formData.weight_kg),
        unit_type: "cylinder",
        category: "LPG",
        unit_cost: Number.parseFloat(formData.unit_cost),
        current_stock: Number.parseInt(formData.quantity),
        min_threshold: Number.parseInt(formData.minimum_stock) || getThresholdByWeight(Number.parseFloat(formData.weight_kg)),
        max_threshold: formData.maximum_stock ? Number.parseInt(formData.maximum_stock) : 100,
        supplier_id: null, // Will be updated later if supplier system is implemented
        expiry_date: expirationDate ? format(expirationDate, "yyyy-MM-dd") : null,
        user_id: user?.id,
      }

      // Create product using new QR-based system
      const response = await fetch('/api/products/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create product')
      }

      const { product } = await response.json()

      toast({
        title: "Success",
        description: `${formatWeight(productData.weight_kg)} ${productData.brand} LPG Cylinder added successfully${qrCodeFromUrl ? ` (ID: ${productId})` : ""}`,
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
                {qrCodeFromUrl ? "Add Scanned Product" : "Add LPG Cylinder"}
              </h1>
              <p className="text-gray-600">
                {qrCodeFromUrl 
                  ? `Create product from QR code: ${qrCodeFromUrl}` 
                  : "Add a new LPG cylinder to your inventory"
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
                {/* Weight Selection */}
                <div className="space-y-2">
                  <Label htmlFor="weight">Cylinder Weight *</Label>
                  <Select value={formData.weight_kg} onValueChange={handleWeightChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cylinder weight" />
                    </SelectTrigger>
                    <SelectContent>
                      {LPG_WEIGHTS.map((weight) => (
                        <SelectItem key={weight.value} value={weight.value.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{weight.label}</span>
                            <Badge variant="secondary" className="ml-2">
                              Min: {weight.threshold}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Brand Selection */}
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand *</Label>
                  <Select
                    value={formData.brand}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, brand: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {LPG_BRANDS.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Supplier */}
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData((prev) => ({ ...prev, supplier: e.target.value }))}
                    placeholder="Enter supplier name"
                  />
                </div>

                <Separator />

                {/* Pricing and Stock */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Initial Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                {/* Stock Thresholds */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minimum_stock">Minimum Stock Level</Label>
                    <Input
                      id="minimum_stock"
                      type="number"
                      min="0"
                      value={formData.minimum_stock}
                      onChange={(e) => setFormData((prev) => ({ ...prev, minimum_stock: e.target.value }))}
                      placeholder="Auto-set based on weight"
                    />
                    <p className="text-xs text-gray-500">Alert when stock falls below this level</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maximum_stock">Maximum Stock Level</Label>
                    <Input
                      id="maximum_stock"
                      type="number"
                      min="0"
                      value={formData.maximum_stock}
                      onChange={(e) => setFormData((prev) => ({ ...prev, maximum_stock: e.target.value }))}
                      placeholder="Optional"
                    />
                    <p className="text-xs text-gray-500">Maximum capacity for this product</p>
                  </div>
                </div>

                <Separator />

                {/* Additional Information */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Storage Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., Warehouse A-1, Section B"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiration">Expiration Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !expirationDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {expirationDate ? format(expirationDate, "PPP") : "Select expiration date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={expirationDate}
                          onSelect={setExpirationDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes about this product..."
                      rows={3}
                    />
                  </div>
                </div>

                {qrCodeFromUrl && (
                  <>
                    <Separator />
                    
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
                          <strong>Product ID:</strong> LPG-{qrCodeFromUrl.toUpperCase().replace('LPG-', '')}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <div className="flex space-x-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Adding..." : "Add Product"}
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
