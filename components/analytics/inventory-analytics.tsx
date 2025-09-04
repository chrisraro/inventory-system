"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DollarSign, Package, BarChart3, PieChart } from "lucide-react"
import { supabase, type Product, type InventoryLog } from "@/lib/supabase"

interface AnalyticsData {
  totalValue: number
  totalItems: number
  lowStockCount: number
  outOfStockCount: number
  unitTypeBreakdown: { unitType: string; count: number; value: number }[]
  topProducts: { product: Product; totalValue: number }[]
  recentActivity: InventoryLog[]
  stockTurnover: { name: string; turnover_rate: number }[]
}

export default function InventoryAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalValue: 0,
    totalItems: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    unitTypeBreakdown: [],
    topProducts: [],
    recentActivity: [],
    stockTurnover: [],
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30")

  useEffect(() => {
    fetchAnalyticsData()
  }, [timeRange])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      // Fetch products
      const { data: products, error: productsError } = await supabase.from("products").select("*")
      if (productsError) throw productsError

      // Fetch recent logs
      const daysAgo = new Date()
      daysAgo.setDate(daysAgo.getDate() - Number.parseInt(timeRange))

      const { data: logs, error: logsError } = await supabase
        .from("inventory_logs")
        .select("*")
        .gte("created_at", daysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(10)

      if (logsError) throw logsError

      // Calculate analytics
      const totalValue = products?.reduce((sum, p) => sum + p.quantity * p.unit_cost, 0) || 0
      const totalItems = products?.length || 0
      const lowStockCount = products?.filter((p) => p.quantity <= 5).length || 0
      const outOfStockCount = products?.filter((p) => p.quantity === 0).length || 0

      // Unit type breakdown
      const unitTypeMap = new Map()
      products?.forEach((product) => {
        const existing = unitTypeMap.get(product.unit_type) || { count: 0, value: 0 }
        unitTypeMap.set(product.unit_type, {
          count: existing.count + 1,
                      value: existing.value + product.quantity * product.unit_cost,
        })
      })

      const unitTypeBreakdown = Array.from(unitTypeMap.entries()).map(([unitType, data]) => ({
        unitType,
        count: data.count,
        value: data.value,
      }))

      // Top products by value
      const topProducts =
        products
          ?.map((product) => ({
            product,
            totalValue: product.quantity * product.unit_cost,
          }))
          .sort((a, b) => b.totalValue - a.totalValue)
          .slice(0, 5) || []

      setAnalyticsData({
        totalValue,
        totalItems,
        lowStockCount,
        outOfStockCount,
        unitTypeBreakdown,
        topProducts,
        recentActivity: logs || [],
        stockTurnover: [], // Would need more complex calculation
      })
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData.totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Current stock value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalItems}</div>
            <p className="text-xs text-muted-foreground">Unique products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Products with 5 or less stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.recentActivity.length}</div>
            <p className="text-xs text-muted-foreground">Actions in {timeRange} days</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Unit Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsData.unitTypeBreakdown.map((unitType) => {
              const percentage = (unitType.value / analyticsData.totalValue) * 100
              return (
                <div key={unitType.unitType} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{unitType.unitType}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{unitType.count} items</Badge>
                      <span className="text-sm text-muted-foreground">${unitType.value.toFixed(2)}</span>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}% of total value</p>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products by Value</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsData.topProducts.map((item, index) => (
              <div key={item.product.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                                            <p className="text-sm font-medium">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                                              {item.product.quantity} {item.product.unit_type} × ${item.product.unit_cost}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">${item.totalValue.toFixed(2)}</p>
                  <Badge variant="outline">{item.product.category}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
