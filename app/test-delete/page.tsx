"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useProducts } from "@/hooks/use-products"
import { toast } from "@/hooks/use-toast"

export default function TestDeletePage() {
  const [productId, setProductId] = useState("")
  const { deleteProduct, refetch } = useProducts()

  const handleDelete = async () => {
    if (!productId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a product ID",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await deleteProduct(productId)
      if (result.success) {
        toast({
          title: "Success",
          description: "Product deleted successfully",
        })
        setProductId("")
        refetch()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete product",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Test Product Deletion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label htmlFor="productId" className="block text-sm font-medium mb-2">
                Product ID
              </label>
              <Input
                id="productId"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="Enter product ID to delete"
              />
            </div>
            <Button onClick={handleDelete}>Delete Product</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}