"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase, type Product } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Package, Trash2, Edit, Download } from "lucide-react"

interface BulkOperationsProps {
  products: Product[]
  selectedProducts: string[]
  onSelectionChange: (productIds: string[]) => void
  onOperationComplete: () => void
}

export default function BulkOperations({
  products,
  selectedProducts,
  onSelectionChange,
  onOperationComplete,
}: BulkOperationsProps) {
  const [operation, setOperation] = useState<"adjust" | "delete" | "export" | "">("")
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract" | "set">("add")
  const [adjustmentValue, setAdjustmentValue] = useState("")
  const [remarks, setRemarks] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(products.map((p) => p.id))
    }
  }

  const handleBulkAdjustment = async () => {
    if (!adjustmentValue || selectedProducts.length === 0) {
      toast({
        title: "Invalid input",
        description: "Please enter an adjustment value and select products",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const adjustment = Number.parseFloat(adjustmentValue)
      if (isNaN(adjustment)) {
        throw new Error("Invalid adjustment value")
      }

      const updates = []
      const logs = []

      for (const productId of selectedProducts) {
        const product = products.find((p) => p.id === productId)
        if (!product) continue

        let newQuantity = product.quantity
        switch (adjustmentType) {
          case "add":
            newQuantity = product.quantity + adjustment
            break
          case "subtract":
            newQuantity = Math.max(0, product.quantity - adjustment)
            break
          case "set":
            newQuantity = adjustment
            break
        }

        updates.push({
          id: productId,
          quantity: newQuantity,
        })

        logs.push({
          product_id: productId,
          action: "stock_adjustment",
          quantity_change: newQuantity - product.quantity,
          old_quantity: product.quantity,
          new_quantity: newQuantity,
          value_change: (newQuantity - product.quantity) * product.unit_cost,
          remarks: remarks || `Bulk ${adjustmentType}: ${adjustment}`,
        })
      }

      // Update products
      for (const update of updates) {
        const { error } = await supabase.from("products").update({ quantity: update.quantity }).eq("id", update.id)
        if (error) throw error
      }

      // Insert logs
      const { error: logError } = await supabase.from("inventory_logs").insert(logs)
      if (logError) throw logError

      toast({
        title: "Bulk adjustment completed",
        description: `Updated ${selectedProducts.length} products`,
      })

      onOperationComplete()
      setOperation("")
      setAdjustmentValue("")
      setRemarks("")
      onSelectionChange([])
    } catch (error) {
      console.error("Error performing bulk adjustment:", error)
      toast({
        title: "Error",
        description: "Failed to perform bulk adjustment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "No products selected",
        description: "Please select products to delete",
        variant: "destructive",
      })
      return
    }

          // TODO: Replace with proper confirmation dialog
      if (
        !confirm(`Are you sure you want to delete ${selectedProducts.length} products? This action cannot be undone.`)
      ) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from("products").delete().in("id", selectedProducts)
      if (error) throw error

      toast({
        title: "Products deleted",
        description: `Deleted ${selectedProducts.length} products`,
      })

      onOperationComplete()
      setOperation("")
      onSelectionChange([])
    } catch (error) {
      console.error("Error deleting products:", error)
      toast({
        title: "Error",
        description: "Failed to delete products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBulkExport = () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "No products selected",
        description: "Please select products to export",
        variant: "destructive",
      })
      return
    }

    try {
      const selectedProductsData = products.filter((p) => selectedProducts.includes(p.id))
      const headers = ["Product Name", "Unit Type", "Quantity", "Price per Unit", "Total Value", "Remarks"]
      const csvData = selectedProductsData.map((product) => [
        product.name,
        product.unit_type,
        product.quantity,
        product.unit_cost,
        product.quantity * product.unit_cost,
        product.remarks || "",
      ])

      const csvContent = [headers, ...csvData].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `selected-inventory-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export completed",
        description: `Exported ${selectedProducts.length} products`,
      })

      setOperation("")
    } catch (error) {
      console.error("Error exporting products:", error)
      toast({
        title: "Error",
        description: "Failed to export products",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Bulk Operations
          </span>
          <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">
            {selectedProducts.length} selected
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="select-all"
            checked={selectedProducts.length === products.length && products.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <Label htmlFor="select-all">Select All ({products.length} items)</Label>
        </div>

        {selectedProducts.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={operation === "adjust" ? "default" : "outline"}
                size="sm"
                onClick={() => setOperation(operation === "adjust" ? "" : "adjust")}
                className={operation === "adjust" ? "bg-primary hover:bg-primary/90" : "hover:bg-primary/10"}
              >
                <Edit className="h-4 w-4 mr-2" />
                Adjust Stock
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setOperation("export")
                  handleBulkExport()
                }}
                className="hover:bg-primary/10"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Selected
              </Button>
              <Button
                variant={operation === "delete" ? "destructive" : "outline"}
                size="sm"
                onClick={() => setOperation(operation === "delete" ? "" : "delete")}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>

            {operation === "adjust" && (
              <div className="space-y-4 p-4 border rounded-lg border-primary/20 bg-primary/5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Adjustment Type</Label>
                    <Select value={adjustmentType} onValueChange={(value: any) => setAdjustmentType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add">Add to current stock</SelectItem>
                        <SelectItem value="subtract">Subtract from current stock</SelectItem>
                        <SelectItem value="set">Set exact quantity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={adjustmentValue}
                      onChange={(e) => setAdjustmentValue(e.target.value)}
                      placeholder="Enter value"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <Textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter reason for adjustment"
                    rows={2}
                  />
                </div>
                <Button
                  onClick={handleBulkAdjustment}
                  disabled={loading || !adjustmentValue}
                  className="bg-primary hover:bg-primary/90"
                >
                  {loading ? "Processing..." : `Apply to ${selectedProducts.length} items`}
                </Button>
              </div>
            )}

            {operation === "delete" && (
              <div className="space-y-4 p-4 border border-destructive rounded-lg bg-destructive/5">
                <p className="text-sm text-destructive">
                  This action cannot be undone. This will permanently delete {selectedProducts.length} products.
                </p>
                <Button variant="destructive" onClick={handleBulkDelete} disabled={loading}>
                  {loading ? "Deleting..." : `Delete ${selectedProducts.length} products`}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
