"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, BarChart3 } from "lucide-react"
import type { Product, InventoryLog } from "@/lib/supabase"
import { formatCurrency } from "@/lib/currency"

interface PerformanceMetricsProps {
  products: Product[]
  logs: InventoryLog[]
}

interface Metrics {
  totalValue: number
  totalItems: number
  lowStockCount: number
  outOfStockCount: number
  unitTypeDistribution: { unitType: string; count: number; percentage: number }[]
  recentActivity: number
  averagePrice: number
  stockTurnover: number
}

export default function PerformanceMetrics({ products, logs }: PerformanceMetricsProps) {
  const [timeRange, setTimeRange] = useState(7) // days

  const metrics = useMemo<Metrics>(() => {
    const totalValue = products.reduce((sum, p) => sum + p.quantity * p.unit_cost, 0)
    const totalItems = products.length
    const lowStockCount = products.filter((p) => p.quantity <= p.min_threshold && p.quantity > 0).length
    const outOfStockCount = products.filter((p) => p.quantity === 0).length

    // Unit type distribution
    const unitTypeMap = new Map<string, number>()
    products.forEach((product) => {
      unitTypeMap.set(product.unit_type, (unitTypeMap.get(product.unit_type) || 0) + 1)
    })

    const unitTypeDistribution = Array.from(unitTypeMap.entries()).map(([unitType, count]) => ({
      unitType,
      count,
      percentage: totalItems > 0 ? (count / totalItems) * 100 : 0,
    }))

    // Recent activity
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - timeRange)
    const recentActivity = logs.filter((log) => new Date(log.created_at) >= cutoffDate).length

    // Average price
    const averagePrice = totalItems > 0 ? products.reduce((sum, p) => sum + p.unit_cost, 0) / totalItems : 0

    // Stock turnover (simplified calculation)
    const stockTurnover = logs.filter(
      (log) => log.action === "stock_adjustment" && new Date(log.created_at) >= cutoffDate,
    ).length

    return {
      totalValue,
      totalItems,
      lowStockCount,
      outOfStockCount,
      unitTypeDistribution,
      recentActivity,
      averagePrice,
      stockTurnover,
    }
  }, [products, logs, timeRange])

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalValue)}</div>
            <p className="text-xs text-muted-foreground">Avg: {formatCurrency(metrics.averagePrice)} per item</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Health</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.totalItems - metrics.lowStockCount - metrics.outOfStockCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.lowStockCount} low, {metrics.outOfStockCount} out
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{metrics.lowStockCount + metrics.outOfStockCount}</div>
            <p className="text-xs text-muted-foreground">
              {(((metrics.lowStockCount + metrics.outOfStockCount) / metrics.totalItems) * 100).toFixed(1)}% of
              inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.recentActivity}</div>
            <p className="text-xs text-muted-foreground">Last {timeRange} days</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Unit Type Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.unitTypeDistribution.map((item) => (
              <div key={item.unitType} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.unitType}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{item.count} items</Badge>
                    <span className="text-sm text-muted-foreground">{item.percentage.toFixed(1)}%</span>
                  </div>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Stock Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Health Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Healthy Stock</span>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  {metrics.totalItems - metrics.lowStockCount - metrics.outOfStockCount} items
                </span>
              </div>
            </div>
            <Progress
              value={
                ((metrics.totalItems - metrics.lowStockCount - metrics.outOfStockCount) / metrics.totalItems) * 100
              }
              className="h-3"
            />

            <div className="grid gap-2 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Low Stock</span>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-600">{metrics.lowStockCount} items</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Out of Stock</span>
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">{metrics.outOfStockCount} items</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
