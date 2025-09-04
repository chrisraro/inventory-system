"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { supabase, type Product } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/currency"
import { ArrowUp, ArrowDown, Package, AlertTriangle, Trash2, CheckCircle, Loader2 } from "lucide-react"

interface StockMovementFormProps {
  products: Product[]
  onMovementComplete: () => void
}

export default function StockMovementForm({ products, onMovementComplete }: StockMovementFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    product_id: "",
    movement_type: "",
    quantity: "",
    supplier: "",
    batch_number: "",
    expiration_date: "",
    reason: "",
    notes: "",
  })

  const selectedProduct = products.find((p) => p.id === formData.product_id)

  const calculateNewQuantity = () => {
    if (!selectedProduct || !formData.quantity || !formData.movement_type) return null

    const quantity = Number.parseFloat(formData.quantity)
    const currentQuantity = selectedProduct.quantity || 0

    switch (formData.movement_type) {
      case "incoming":
        return currentQuantity + quantity
      case "outgoing":
      case "expired":
      case "damaged":
        return Math.max(0, currentQuantity - quantity)
      case "adjustment":
        return quantity
      default:
        return currentQuantity
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({
        title: "🚫 Authentication Required",
        description: "You must be logged in to record stock movements",
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    // Comprehensive validation
    const validationErrors: string[] = []

    if (!formData.product_id) {
      validationErrors.push("Please select a product")
    }

    if (!formData.movement_type) {
      validationErrors.push("Please select a movement type")
    }

    const quantity = Number.parseFloat(formData.quantity)
    if (!formData.quantity || isNaN(quantity)) {
      validationErrors.push("Please enter a valid quantity")
    } else if (quantity <= 0) {
      validationErrors.push("Quantity must be greater than zero")
    } else if (quantity > 999999999) {
      validationErrors.push("Quantity is too large")
    }

    if (!formData.reason.trim()) {
      validationErrors.push("Please provide a reason for this movement")
    } else if (formData.reason.trim().length < 3) {
      validationErrors.push("Reason must be at least 3 characters long")
    }

    // Validate outgoing quantity doesn't exceed current stock
    if (
      (formData.movement_type === "outgoing" ||
        formData.movement_type === "expired" ||
        formData.movement_type === "damaged") &&
      selectedProduct
    ) {
      if (quantity > selectedProduct.quantity) {
        validationErrors.push(
          `Cannot remove ${quantity} ${selectedProduct.unit_type}. Only ${selectedProduct.quantity} ${selectedProduct.unit_type} available in stock`,
        )
      }
    }

    // Validate expiration date if provided
    if (formData.expiration_date) {
      const expirationDate = new Date(formData.expiration_date)
      if (isNaN(expirationDate.getTime())) {
        validationErrors.push("Invalid expiration date format")
      }
    }

    if (validationErrors.length > 0) {
      toast({
        title: "❌ Validation Error",
        description: validationErrors[0],
        variant: "destructive",
        duration: 5000,
      })
      return
    }

    setLoading(true)
    try {
      const unitPrice = selectedProduct?.unit_cost || 0
      const totalValue = quantity * unitPrice

      // Calculate new quantity based on movement type
      let newQuantity = selectedProduct?.quantity || 0
      let quantityChange = 0

      switch (formData.movement_type) {
        case "incoming":
          newQuantity += quantity
          quantityChange = quantity
          break
        case "outgoing":
          newQuantity = Math.max(0, newQuantity - quantity)
          quantityChange = -quantity
          break
        case "expired":
        case "damaged":
          newQuantity = Math.max(0, newQuantity - quantity)
          quantityChange = -quantity
          break
        case "adjustment":
          quantityChange = quantity - (selectedProduct?.quantity || 0)
          newQuantity = quantity
          break
      }

      // Create stock movement record
      const { error: movementError } = await supabase.from("stock_movements").insert([
        {
          product_id: formData.product_id,
          movement_type: formData.movement_type,
          quantity: quantity,
          unit_price: unitPrice,
          total_value: totalValue,
          supplier: user.role === "admin" ? formData.supplier || null : selectedProduct?.supplier || null,
          batch_number: formData.batch_number || null,
          expiration_date: formData.expiration_date || null,
          reason: formData.reason.trim(),
          notes: formData.notes?.trim() || null,
          created_by: user.name || "Unknown User",
        },
      ])

      if (movementError) {
        console.error("Movement error:", movementError)
        throw new Error(`Failed to record stock movement: ${movementError.message}`)
      }

      // Create inventory log
      const { error: logError } = await supabase.from("inventory_logs").insert([
        {
          product_id: formData.product_id,
          action: formData.movement_type,
          quantity_change: quantityChange,
          old_quantity: selectedProduct?.quantity || 0,
          new_quantity: newQuantity,
          value_change: formData.movement_type === "incoming" ? totalValue : -totalValue,
          movement_type: formData.movement_type,
          supplier: user.role === "admin" ? formData.supplier || null : selectedProduct?.supplier || null,
          batch_number: formData.batch_number || null,
          expiration_date: formData.expiration_date || null,
          reason: formData.reason.trim(),
          remarks: formData.notes?.trim() || null,
          created_by: user.name || "Unknown User",
        },
      ])

      if (logError) {
        console.warn("Failed to create inventory log:", logError)
        // Don't fail the entire operation for logging issues
      }

      // Show detailed success message
      const movementTypeText = formData.movement_type.charAt(0).toUpperCase() + formData.movement_type.slice(1)
      const quantityText = `${quantity} ${selectedProduct?.unit_type || "units"}`
      const productName = selectedProduct?.name || "Unknown Product"

      toast({
        title: "✅ Stock Movement Recorded Successfully",
        description: `${movementTypeText}: ${quantityText} for ${productName}. New stock level: ${newQuantity} ${selectedProduct?.unit_type || "units"}`,
        duration: 6000,
      })

      // Reset form
      setFormData({
        product_id: "",
        movement_type: "",
        quantity: "",
        supplier: "",
        batch_number: "",
        expiration_date: "",
        reason: "",
        notes: "",
      })

      // Trigger refresh
      onMovementComplete()
    } catch (error) {
      console.error("Error recording stock movement:", error)
      toast({
        title: "❌ Failed to Record Movement",
        description:
          error instanceof Error ? error.message : "An unexpected error occurred while recording the stock movement",
        variant: "destructive",
        duration: 7000,
      })
    } finally {
      setLoading(false)
    }
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "incoming":
        return <ArrowUp className="icon-sm text-success" />
      case "outgoing":
        return <ArrowDown className="icon-sm text-info" />
      case "expired":
      case "damaged":
        return <Trash2 className="icon-sm text-destructive" />
      default:
        return <Package className="icon-sm text-muted-foreground" />
    }
  }

  const getMovementColor = (type: string) => {
    switch (type) {
      case "incoming":
        return "success"
      case "outgoing":
        return "info"
      case "expired":
      case "damaged":
        return "destructive"
      default:
        return "outline"
    }
  }

  const newQuantity = calculateNewQuantity()

  return (
    <Card className="border-outline-variant shadow-elevation-2">
      <CardHeader className="surface-container-high border-b border-outline-variant">
        <CardTitle className="flex items-center justify-between text-primary">
          <div className="flex items-center space-x-3">
            <Package className="icon-lg text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Record Stock Movement</h2>
              <p className="text-sm text-muted-foreground font-normal">Track inventory changes and updates</p>
            </div>
          </div>
          {user?.role === "stockman" && (
            <Badge variant="outline" className="text-xs">
              Stock Manager
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="spacing-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product_id" className="text-sm font-medium">
                Product *
              </Label>
              <Select
                value={formData.product_id}
                onValueChange={(value) => setFormData({ ...formData, product_id: value })}
              >
                <SelectTrigger className="border-outline hover:border-outline-variant focus:border-primary">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="truncate">{product.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {product.quantity} {product.unit_type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="movement_type" className="text-sm font-medium">
                Movement Type *
              </Label>
              <Select
                value={formData.movement_type}
                onValueChange={(value) => setFormData({ ...formData, movement_type: value })}
              >
                <SelectTrigger className="border-outline hover:border-outline-variant focus:border-primary">
                  <SelectValue placeholder="Select movement type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incoming">
                    <div className="flex items-center space-x-2">
                      <ArrowUp className="icon-sm text-success" />
                      <span>Incoming Stock</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="outgoing">
                    <div className="flex items-center space-x-2">
                      <ArrowDown className="icon-sm text-info" />
                      <span>Outgoing Stock</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="adjustment">
                    <div className="flex items-center space-x-2">
                      <Package className="icon-sm text-muted-foreground" />
                      <span>Stock Adjustment</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="expired">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="icon-sm text-warning" />
                      <span>Expired Stock</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="damaged">
                    <div className="flex items-center space-x-2">
                      <Trash2 className="icon-sm text-destructive" />
                      <span>Damaged Stock</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedProduct && (
              <div className="md:col-span-2 p-4 surface-container-high rounded-xl border border-outline-variant">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <p className="font-semibold text-lg">{selectedProduct.name}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>
                        Current stock:{" "}
                        <span className="font-medium text-foreground">
                          {selectedProduct.quantity} {selectedProduct.unit_type}
                        </span>
                      </span>
                      <span>
                        Unit cost:{" "}
                        <span className="font-medium text-foreground">
                          {formatCurrency(selectedProduct.unit_cost)}
                        </span>
                      </span>
                    </div>
                    {selectedProduct.supplier && (
                      <p className="text-sm text-muted-foreground">
                        Supplier: <span className="font-medium text-foreground">{selectedProduct.supplier}</span>
                      </p>
                    )}
                  </div>
                  {formData.movement_type && (
                    <Badge variant={getMovementColor(formData.movement_type)} className="flex items-center space-x-1">
                      {getMovementIcon(formData.movement_type)}
                      <span>{formData.movement_type.charAt(0).toUpperCase() + formData.movement_type.slice(1)}</span>
                    </Badge>
                  )}
                </div>

                {newQuantity !== null && formData.quantity && (
                  <div className="mt-4 p-3 surface rounded-lg border border-outline-variant">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Movement Preview:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {selectedProduct.quantity} {selectedProduct.unit_type}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-semibold text-primary">
                          {newQuantity} {selectedProduct.unit_type}
                        </span>
                        <CheckCircle className="icon-sm text-success" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium">
                Quantity * {formData.movement_type === "adjustment" ? "(Final quantity)" : ""}
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Enter quantity"
                required
                className="border-outline hover:border-outline-variant focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium">
                Reason *
              </Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Enter reason for this movement"
                required
                className="border-outline hover:border-outline-variant focus:border-primary"
              />
            </div>

            {(formData.movement_type === "incoming" || formData.movement_type === "outgoing") && (
              <div className="space-y-2">
                <Label htmlFor="supplier" className="text-sm font-medium">
                  Supplier
                </Label>
                {user?.role === "admin" ? (
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Enter supplier name"
                    className="border-outline hover:border-outline-variant focus:border-primary"
                  />
                ) : (
                  <div className="p-3 surface-container rounded-lg border border-outline-variant">
                    <p className="text-sm text-muted-foreground">
                      Supplier:{" "}
                      <span className="font-medium text-foreground">
                        {selectedProduct?.supplier || "Not specified"}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Contact administrator to update supplier information
                    </p>
                  </div>
                )}
              </div>
            )}

            {formData.movement_type === "incoming" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="batch_number" className="text-sm font-medium">
                    Batch Number
                  </Label>
                  <Input
                    id="batch_number"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                    placeholder="Enter batch number"
                    className="border-outline hover:border-outline-variant focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiration_date" className="text-sm font-medium">
                    Expiration Date
                  </Label>
                  <Input
                    id="expiration_date"
                    type="date"
                    value={formData.expiration_date}
                    onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                    className="border-outline hover:border-outline-variant focus:border-primary"
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Additional Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter any additional notes"
              rows={3}
              className="border-outline hover:border-outline-variant focus:border-primary"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4 border-t border-outline-variant">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setFormData({
                  product_id: "",
                  movement_type: "",
                  quantity: "",
                  supplier: "",
                  batch_number: "",
                  expiration_date: "",
                  reason: "",
                  notes: "",
                })
              }
              disabled={loading}
              className="sm:w-auto w-full"
            >
              Clear Form
            </Button>
            <Button
              type="submit"
              disabled={
                loading || !formData.product_id || !formData.movement_type || !formData.quantity || !formData.reason
              }
              className="sm:w-auto w-full"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="icon-sm animate-spin" />
                  <span>Recording...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="icon-sm" />
                  <span>Record Movement</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
