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
import { toast } from "@/hooks/use-toast"

export default function Dashboard() {
  const { products, loading, deleteProduct } = useProducts()
  const { hasPermission } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProducts, setFilteredProducts] = useState(products)

  useEffect(() => {
    const filtered = products.filter(
      (product) =>
        (product.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (product.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (product.weight_kg?.toString().includes(searchTerm) || false),
    )
    setFilteredProducts(filtered)
  }, [searchTerm, products])

  // Calculate metrics for simplified system
  const totalProducts = products.length
  const totalValue = products.reduce((sum, product) => sum + product.unit_cost, 0)
  const availableCylinders = products.filter((product) => product.status === 'available')
  const soldCylinders = products.filter((product) => product.status === 'sold')
  const maintenanceCylinders = products.filter((product) => product.status === 'maintenance')
  const damagedCylinders = products.filter((product) => product.status === 'damaged')
  const missingCylinders = products.filter((product) => product.status === 'missing')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return "bg-green-100 text-green-800"
      case 'sold': return "bg-blue-100 text-blue-800"
      case 'maintenance': return "bg-yellow-100 text-yellow-800"
      case 'damaged': return "bg-red-100 text-red-800"
      case 'missing': return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return "Available"
      case 'sold': return "Sold"
      case 'maintenance': return "Maintenance"
      case 'damaged': return "Damaged"
      case 'missing': return "Missing"
      default: return status
    }
  }

  const getProductDisplayName = (product: any) => {
    return `${formatWeight(product.weight_kg)} LPG Cylinder`
  }

  const handleDelete = async (id: string, name: string, weight: number) => {
    if (confirm(`Are you sure you want to delete "${formatWeight(weight)} ${name}"?`)) {
      const result = await deleteProduct(id)
      if (!result.success) {
        toast({
          title: "Error",
          description: result.error || "Failed to delete product",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Product deleted successfully",
        })
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cylinders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProducts}</div>
                <p className="text-xs text-muted-foreground">Unique cylinders tracked</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
                <Package className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{availableCylinders.length}</div>
                <p className="text-xs text-muted-foreground">Ready for distribution</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sold</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{soldCylinders.length}</div>
                <p className="text-xs text-muted-foreground">Sold to customers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{maintenanceCylinders.length}</div>
                <p className="text-xs text-muted-foreground">Under maintenance</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Issues</CardTitle>
                <TrendingUp className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{damagedCylinders.length + missingCylinders.length}</div>
                <p className="text-xs text-muted-foreground">Damaged + Missing</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="inventory" className="space-y-4">
            <TabsList>
              <TabsTrigger value="inventory">Cylinder Inventory</TabsTrigger>
              <TabsTrigger value="status">Status Overview</TabsTrigger>
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
                            <div className="flex items-center space-x-2">
                              <p className="text-sm text-gray-600">{product.id}</p>
                              {product.supplier && (
                                <span className="text-sm text-gray-500">• {product.supplier}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(product.unit_cost)}</p>
                            <p className="text-sm text-gray-600">Unit cost</p>
                          </div>
                          <Badge className={getStatusColor(product.status)}>{getStatusText(product.status)}</Badge>
                          <div className="flex items-center space-x-2">
                            {hasPermission("delete_product") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(product.id, `${formatWeight(product.weight_kg)} LPG Cylinder`, product.weight_kg)}
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

            <TabsContent value="status" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Available Cylinders */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-600">
                      <Package className="mr-2 h-5 w-5" />
                      Available Cylinders
                    </CardTitle>
                    <CardDescription>Ready for distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {availableCylinders.slice(0, 5).map((product) => (
                        <div key={product.id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                          <span className="text-sm font-medium">{getProductDisplayName(product)}</span>
                          <span className="text-xs text-gray-600">{product.id}</span>
                        </div>
                      ))}
                      {availableCylinders.length === 0 && (
                        <p className="text-sm text-gray-500">No available cylinders</p>
                      )}
                      {availableCylinders.length > 5 && (
                        <p className="text-xs text-gray-500">+{availableCylinders.length - 5} more</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Maintenance Required */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-yellow-600">
                      <AlertTriangle className="mr-2 h-5 w-5" />
                      Maintenance Required
                    </CardTitle>
                    <CardDescription>Cylinders under maintenance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {maintenanceCylinders.slice(0, 5).map((product) => (
                        <div key={product.id} className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                          <span className="text-sm font-medium">{getProductDisplayName(product)}</span>
                          <span className="text-xs text-gray-600">{product.id}</span>
                        </div>
                      ))}
                      {maintenanceCylinders.length === 0 && (
                        <p className="text-sm text-gray-500">No cylinders in maintenance</p>
                      )}
                      {maintenanceCylinders.length > 5 && (
                        <p className="text-xs text-gray-500">+{maintenanceCylinders.length - 5} more</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Issues */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-red-600">
                      <TrendingUp className="mr-2 h-5 w-5" />
                      Issues
                    </CardTitle>
                    <CardDescription>Damaged or missing cylinders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {damagedCylinders.concat(missingCylinders).slice(0, 5).map((product) => (
                        <div key={product.id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                          <div>
                            <span className="text-sm font-medium">{getProductDisplayName(product)}</span>
                            <span className="ml-2 text-xs text-red-600">({getStatusText(product.status)})</span>
                          </div>
                          <span className="text-xs text-gray-600">{product.id}</span>
                        </div>
                      ))}
                      {damagedCylinders.length === 0 && missingCylinders.length === 0 && (
                        <p className="text-sm text-gray-500">No issues reported</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recent" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Cylinders</CardTitle>
                  <CardDescription>Recently added cylinders to the system</CardDescription>
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
                              {product.id} • {getStatusText(product.status)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(product.unit_cost)}</p>
                          <Badge className={getStatusColor(product.status)}>{getStatusText(product.status)}</Badge>
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
