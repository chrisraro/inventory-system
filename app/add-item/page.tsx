"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Package, QrCode, ArrowLeft } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import ProtectedRoute from "@/components/auth/protected-route"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { authenticatedPost } from "@/lib/api-client"

export default function AddItemPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [qrCodeFromUrl, setQrCodeFromUrl] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    weight_kg: "",
    unit_cost: "",
    supplier: "",
  })

  // Handle QR code from URL parameters
  useEffect(() => {
    const qrParam = searchParams.get('qr')
    if (qrParam) {
      setQrCodeFromUrl(qrParam)
    }
  }, [searchParams])

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
        return
      }

      if (!formData.weight_kg || !formData.unit_cost) {
        toast({
          title: "Validation Error",
          description: "Please fill in cylinder weight and unit cost",
          variant: "destructive",
        })
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

      if (response.status === 503) {
        const errorData = await response.json()
        if (errorData.code === 'TABLES_NOT_FOUND') {
          toast({
            title: "Database Setup Required",
            description: "Please run the database migration script in Supabase SQL Editor first.",
            variant: "destructive",
          })
          return
        }
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create product')
      }

      const { product } = await response.json()

      toast({
        title: "Success",
        description: `${formData.weight_kg}kg LPG Cylinder added successfully (ID: LPG-${qrCodeFromUrl})`,
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
                {qrCodeFromUrl && (
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
                          <strong>Product ID:</strong> LPG-{qrCodeFromUrl.toUpperCase().replace('LPG-', '')}
                        </p>
                      </div>
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
