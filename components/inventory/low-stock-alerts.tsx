"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, Eye, EyeOff, Package } from "lucide-react"
import { supabase, type Product, testConnection } from "@/lib/supabase"
import Link from "next/link"

export default function LowStockAlerts() {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showAlerts, setShowAlerts] = useState(true)

  useEffect(() => {
    fetchLowStockProducts()
  }, [])

  const fetchLowStockProducts = async () => {
    try {
      setLoading(true)

      // Test connection first
      const connectionTest = await testConnection()
      if (!connectionTest.success) {
        console.error("Database connection failed:", connectionTest.error)
        return
      }

      const { data, error } = await supabase.from("products").select("*").order("quantity", { ascending: true })

      if (error) {
        console.error("Supabase error:", error)
        return
      }

      // Filter and validate products
      const filtered = (data || [])
        .filter((product) => {
          const quantity = Number(product.quantity) || 0
          const threshold = Number(product.min_threshold) || 5
          return quantity <= threshold
        })
        .map((product) => ({
          ...product,
          quantity: Number(product.quantity) || 0,
          min_threshold: Number(product.min_threshold) || 5,
          product_name: product.name?.trim() || "Unnamed Product",
          unit_type: product.unit_type?.trim() || "Pieces",
        }))

      setLowStockProducts(filtered)
    } catch (error) {
      console.error("Error fetching low stock products:", error)
      setLowStockProducts([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="text-center">Loading alerts...</div>
        </CardContent>
      </Card>
    )
  }

  if (lowStockProducts.length === 0) {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <CardHeader>
          <CardTitle className="flex items-center text-green-700 dark:text-green-400">
            <Package className="h-5 w-5 mr-2" />
            All Stock Levels Good
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-600 dark:text-green-300">
            No items are currently below their stock thresholds.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-destructive/20 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center text-destructive">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Low Stock Alerts ({lowStockProducts.length})
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAlerts(!showAlerts)}
            className="hover:bg-destructive/10"
          >
            {showAlerts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      {showAlerts && (
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Threshold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.map((product) => {
                  const urgency =
                    product.quantity === 0
                      ? "critical"
                      : product.quantity <= product.min_threshold / 2
                        ? "high"
                        : "medium"

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        {product.quantity} {product.unit_type}
                      </TableCell>
                      <TableCell>{product.min_threshold}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            urgency === "critical" ? "destructive" : urgency === "high" ? "destructive" : "secondary"
                          }
                          className={urgency === "critical" ? "animate-pulse" : ""}
                        >
                          {urgency === "critical" ? "Out of Stock" : urgency === "high" ? "Critical" : "Low"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/edit-item/${product.id}`}>
                          <Button size="sm" className="bg-primary hover:bg-primary/90">
                            Restock
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
