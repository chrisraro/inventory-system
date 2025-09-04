"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Package,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Search,
  Plus,
  Fuel,
  Calendar,
  Edit,
  Trash2,
  Scale,
} from "lucide-react"
import Link from "next/link"
import DashboardLayout from "@/components/layout/dashboard-layout"
import ProtectedRoute from "@/components/auth/protected-route"
import { formatCurrency } from "@/lib/currency"
import { formatWeight } from "@/lib/constants"
import { useProducts } from "@/hooks/use-products"
import { useAuth } from "@/contexts/auth-context"

export default function Dashboard() {
  const { products, loading, deleteProduct } = useProducts()
  const { hasPermission } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProducts, setFilteredProducts] = useState(products)

  useEffect(() => {
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.supplier && product.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
        product.weight_kg.toString().includes(searchTerm),
    )
    setFilteredProducts(filtered)
  }, [searchTerm, products])

  // Calculate metrics
  const totalProducts = products.length
  const totalValue = products.reduce((sum, product) => sum + product.quantity * product.unit_cost, 0)
  const lowStockItems = products.filter((product) => product.quantity <= product.min_threshold)
  const outOfStockItems = products.filter((product) => product.quantity === 0)

  const getStatusColor = (product: any) => {
    if (product.quantity === 0) return "bg-red-100 text-red-800"
    if (product.quantity <= product.min_threshold) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  const getStatusText = (product: any) => {
    if (product.quantity === 0) return "Out of Stock"
    if (product.quantity <= product.min_threshold) return "Low Stock"
    return "In Stock"
  }

  const getProductDisplayName = (product: any) => {
    return `${formatWeight(product.weight_kg)} ${product.name}`
  }

  const handleDelete = async (id: string, name: string, weight: number) => {
    // TODO: Replace with proper confirmation dialog
    if (confirm(`Are you sure you want to delete "${formatWeight(weight)} ${name}"?`)) {
      const result = await deleteProduct(id)
      if (!result.success) {
        // TODO: Replace with proper toast notification
        console.warn("Delete failed:", result.error || "Failed to delete product")
      }
    }
  }

  if (loading) {
    return (
      <ProtectedRoute permission="view_dashboard">
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading dashboard...</span>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute permission="view_dashboard">
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Fuel className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-blue-900">LPG Inventory Dashboard</h1>
                <p className="text-gray-600">Manage your LPG cylinder inventory</p>
              </div>
            </div>
            {hasPermission("add_product") && (
              <Link href="/add-item">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Cylinder
                </Button>
              </Link>
            )}
          </div>

          {/* Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cylinders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProducts}</div>
                <p className="text-xs text-muted-foreground">Active cylinder types</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                <p className="text-xs text-muted-foreground">Current inventory value</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</div>
                <p className="text-xs text-muted-foreground">Cylinders need restocking</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                <TrendingUp className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{outOfStockItems.length}</div>
                <p className="text-xs text-muted-foreground">Cylinders out of stock</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="inventory" className="space-y-4">
            <TabsList>
              <TabsTrigger value="inventory">Cylinder Inventory</TabsTrigger>
              <TabsTrigger value="alerts">Stock Alerts</TabsTrigger>
              <TabsTrigger value="recent">Recent Additions</TabsTrigger>
            </TabsList>

            <TabsContent value="inventory" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Current LPG Cylinder Inventory</CardTitle>
                      <CardDescription>Overview of all LPG cylinders in stock</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search cylinders..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 w-64"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                            <Fuel className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium flex items-center space-x-2">
                              <span>{getProductDisplayName(product)}</span>
                              <Badge variant="outline" className="text-xs">
                                <Scale className="h-3 w-3 mr-1" />
                                {formatWeight(product.weight_kg)}
                              </Badge>
                            </h3>
                            <p className="text-sm text-gray-600">{product.supplier || "No supplier"}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-medium">{product.quantity} units</p>
                            <p className="text-sm text-gray-600">{formatCurrency(product.unit_cost)}</p>
                          </div>
                          <Badge className={getStatusColor(product)}>{getStatusText(product)}</Badge>
                          <div className="flex items-center space-x-2">
                            {hasPermission("edit_product") && (
                              <Link href={`/edit-item/${product.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                            {hasPermission("delete_product") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(product.id, product.name, product.weight_kg)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        {searchTerm ? "No cylinders found matching your search" : "No cylinders in inventory"}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5 text-yellow-600" />
                    Stock Alerts
                  </CardTitle>
                  <CardDescription>Cylinders that need immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {lowStockItems.concat(outOfStockItems).map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 border-yellow-200"
                      >
                        <div className="flex items-center space-x-4">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          <div>
                            <h3 className="font-medium">{getProductDisplayName(product)}</h3>
                            <p className="text-sm text-gray-600">{product.supplier || "No supplier"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-yellow-800">
                            {product.quantity} / {product.min_threshold} minimum
                          </p>
                          <p className="text-sm text-yellow-600">
                            {product.quantity === 0 ? "Out of stock" : "Low stock"}
                          </p>
                        </div>
                      </div>
                    ))}
                    {lowStockItems.length === 0 && outOfStockItems.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No stock alerts at this time</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recent" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Cylinders</CardTitle>
                  <CardDescription>Recently added or updated cylinder inventory</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {products.slice(0, 5).map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                            <Package className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{getProductDisplayName(product)}</h3>
                            <p className="text-sm text-gray-600">
                              <Calendar className="inline h-3 w-3 mr-1" />
                              {product.expiration_date ? `Expires: ${product.expiration_date}` : "No expiration date"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(product.unit_cost)}</p>
                          <p className="text-sm text-gray-600">{product.quantity} in stock</p>
                        </div>
                      </div>
                    ))}
                    {products.length === 0 && <p className="text-center text-gray-500 py-8">No cylinders available</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
