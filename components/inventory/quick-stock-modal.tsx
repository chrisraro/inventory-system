"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { supabase, type Product } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Package } from "lucide-react"

interface QuickStockModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function QuickStockModal({ product, isOpen, onClose, onSuccess }: QuickStockModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract" | "set">("add")
  const [adjustmentValue, setAdjustmentValue] = useState("")
  const [remarks, setRemarks] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product || !adjustmentValue) return

    setLoading(true)
    try {
      const adjustment = Number.parseFloat(adjustmentValue)
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

      // Update product
      const { error: updateError } = await supabase
        .from("products")
        .update({ quantity: newQuantity })
        .eq("id", product.id)

      if (updateError) throw updateError

      // Log the adjustment
      const { error: logError } = await supabase.from("inventory_logs").insert([
        {
          product_id: product.id,
          action: "stock_adjustment",
          quantity_change: newQuantity - product.quantity,
          old_quantity: product.quantity,
          new_quantity: newQuantity,
          value_change: (newQuantity - product.quantity) * product.unit_cost,
          remarks: remarks || `Quick ${adjustmentType}: ${adjustment}`,
        },
      ])

      if (logError) throw logError

      toast({
        title: "Stock updated",
        description: `${product.name} quantity updated to ${newQuantity}`,
      })

      onSuccess()
      onClose()
      setAdjustmentValue("")
      setRemarks("")
    } catch (error) {
      console.error("Error updating stock:", error)
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Quick Stock Adjustment
          </DialogTitle>
          <DialogDescription>{product && `Adjust stock for ${product.name}`}</DialogDescription>
        </DialogHeader>

        {product && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">{product.name}</p>
              <p className="text-sm text-muted-foreground">
                Current stock: {product.quantity} {product.unit_type}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Adjustment Type</Label>
                <Select value={adjustmentType} onValueChange={(value: any) => setAdjustmentType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add to stock</SelectItem>
                    <SelectItem value="subtract">Remove from stock</SelectItem>
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
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Remarks (optional)</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Reason for adjustment"
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !adjustmentValue}>
                {loading ? "Updating..." : "Update Stock"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
