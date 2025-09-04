"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, AlertCircle } from "lucide-react"
import Link from "next/link"
import { UNIT_TYPES, SUPPLIERS } from "@/lib/constants"
import { useProducts } from "@/hooks/use-products"
import { useAuth } from "@/contexts/auth-context"
import DashboardLayout from "@/components/layout/dashboard-layout"
import ProtectedRoute from "@/components/auth/protected-route"

export default function EditItemPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { products, updateProduct } = useProducts()
  const { hasPermission } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [product, setProduct] = useState(products.find((p) => p.id === params.id))
  const [formData, setFormData] = useState({
    name: "",
    unit_type: "",
    quantity: "",
    unit_cost: "",
    min_threshold: "",
    supplier: "",
    expiration_date: "",
    remarks: "",
  })

  useEffect(() => {
    const foundProduct = products.find((p) => p.id === params.id)
    if (foundProduct) {
      setProduct(foundProduct)
      setFormData({
        name: foundProduct.name,
        unit_type: foundProduct.unit_type,
        quantity: foundProduct.quantity.toString(),
        unit_cost: foundProduct.unit_cost.toString(),
        min_threshold: foundProduct.min_threshold.toString(),
        supplier: foundProduct.supplier || "",
        expiration_date: foundProduct.expiration_date || "",
        remarks: foundProduct.remarks || "",
      })
    }
  }, [products, params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!formData.name.trim()) {
        throw new Error("Product name is required")
      }
      if (!formData.unit_type) {
        throw new Error("Unit type is required")
      }
      if (!formData.quantity || Number.parseFloat(formData.quantity) < 0) {
        throw new Error("Valid quantity is required")
      }
      if (!formData.price_per_unit || Number.parseFloat(formData.price_per_unit) < 0) {
        throw new Error("Valid price is required")
      }

      const productData = {
        name: formData.name.trim(),
        unit_type: formData.unit_type,
        quantity: Number.parseFloat(formData.quantity),
        unit_cost: Number.parseFloat(formData.unit_cost),
        min_threshold: Number.parseFloat(formData.min_threshold) || 5,
        supplier: formData.supplier || null,
        expiration_date: formData.expiration_date || null,
        remarks: formData.remarks.trim() || null,
      }

      const result = await updateProduct(params.id, productData)
      if (result.success) {
        router.push("/")
      } else {
        setError(result.error || "Failed to update product")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (!hasPermission("edit_product")) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-8">
            <p className="text-lg text-gray-600">You don't have permission to edit products.</p>
            <Link href="/">
              <Button className="mt-4">Back to Dashboard</Button>
            </Link>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!product) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-8">
            <p className="text-lg text-gray-600">Product not found.</p>
            <Link href="/">
              <Button className="mt-4">Back to Dashboard</Button>
            </Link>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-blue-900">Edit Product</h1>
          </div>

          <Card className="border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
              <CardTitle className="text-blue-900">Product Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {error && (
                <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="e.g., 12.5kg LPG Cylinder"
                      required
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit_type">Unit Type *</Label>
                    <Select value={formData.unit_type} onValueChange={(value) => handleInputChange("unit_type", value)}>
                      <SelectTrigger className="border-blue-200 focus:border-blue-500">
                        <SelectValue placeholder="Select unit type" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_TYPES.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange("quantity", e.target.value)}
                      placeholder="Enter quantity"
                      required
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit_cost">Unit Cost (₱) *</Label>
                    <Input
                      id="unit_cost"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.unit_cost}
                      onChange={(e) => handleInputChange("unit_cost", e.target.value)}
                      placeholder="Enter unit cost"
                      required
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min_threshold">Minimum Stock Threshold</Label>
                    <Input
                      id="min_threshold"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.min_threshold}
                      onChange={(e) => handleInputChange("min_threshold", e.target.value)}
                      placeholder="Enter threshold"
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Select value={formData.supplier} onValueChange={(value) => handleInputChange("supplier", value)}>
                      <SelectTrigger className="border-blue-200 focus:border-blue-500">
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPLIERS.map((supplier) => (
                          <SelectItem key={supplier} value={supplier}>
                            {supplier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiration_date">Expiration Date</Label>
                    <Input
                      id="expiration_date"
                      type="date"
                      value={formData.expiration_date}
                      onChange={(e) => handleInputChange("expiration_date", e.target.value)}
                      className="border-blue-200 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => handleInputChange("remarks", e.target.value)}
                    placeholder="Enter any additional notes"
                    rows={3}
                    className="border-blue-200 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Link href="/">
                    <Button variant="outline" type="button" className="hover:bg-blue-50 bg-transparent">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? "Updating..." : "Update Product"}
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
