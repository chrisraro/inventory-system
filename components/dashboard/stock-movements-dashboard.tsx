"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  ArrowUp,
  ArrowDown,
  Package,
  AlertTriangle,
  Trash2,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
} from "lucide-react"
import { supabase, type StockMovement, type Product } from "@/lib/supabase"
import { formatCurrency } from "@/lib/currency"

interface StockMovementsDashboardProps {
  products: Product[]
  autoRefresh?: boolean
}

export default function StockMovementsDashboard({ products, autoRefresh = true }: StockMovementsDashboardProps) {
  const [movements, setMovements] = useState<(StockMovement & { product: Product })[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [timeRange, setTimeRange] = useState("7")

  useEffect(() => {
    fetchMovements()
  }, [filter, timeRange])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchMovements()
      }, 30000) // Refresh every 30 seconds

      return () => clearInterval(interval)
    }
  }, [autoRefresh, filter, timeRange])

  const fetchMovements = async () => {
    setLoading(true)
    try {
      const daysAgo = new Date()
      daysAgo.setDate(daysAgo.getDate() - Number.parseInt(timeRange))

      let query = supabase
        .from("stock_movements")
        .select(`
          *,
          product:products(*)
        `)
        .gte("created_at", daysAgo.toISOString())
        .order("created_at", { ascending: false })

      if (filter !== "all") {
        query = query.eq("movement_type", filter)
      }

      const { data, error } = await query

      if (error) throw error
      setMovements(data || [])
    } catch (error) {
      console.error("Error fetching movements:", error)
    } finally {
      setLoading(false)
    }
  }

  const getMovementStats = () => {
    const stats = {
      incoming: { count: 0, value: 0 },
      outgoing: { count: 0, value: 0 },
      expired: { count: 0, value: 0 },
      damaged: { count: 0, value: 0 },
    }

    movements.forEach((movement) => {
      if (stats[movement.movement_type as keyof typeof stats]) {
        stats[movement.movement_type as keyof typeof stats].count++
        stats[movement.movement_type as keyof typeof stats].value += movement.total_value || 0
      }
    })

    return stats
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "incoming":
        return <ArrowUp className="h-4 w-4 text-green-600" />
      case "outgoing":
        return <ArrowDown className="h-4 w-4 text-blue-600" />
      case "expired":
      case "damaged":
        return <Trash2 className="h-4 w-4 text-red-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  const getMovementColor = (type: string) => {
    switch (type) {
      case "incoming":
        return "bg-green-100 text-green-800 border-green-200"
      case "outgoing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "expired":
      case "damaged":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const stats = getMovementStats()

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Incoming Stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats.incoming.count}</div>
            <p className="text-xs text-green-600">Value: {formatCurrency(stats.incoming.value)}</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Outgoing Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.outgoing.count}</div>
            <p className="text-xs text-blue-600">Value: {formatCurrency(stats.outgoing.value)}</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Expired/Damaged</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.expired.count + stats.damaged.count}</div>
            <p className="text-xs text-red-600">Value: {formatCurrency(stats.expired.value + stats.damaged.value)}</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Total Movements</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{movements.length}</div>
            <p className="text-xs text-muted-foreground">Last {timeRange} days</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Movements</SelectItem>
            <SelectItem value="incoming">Incoming Only</SelectItem>
            <SelectItem value="outgoing">Outgoing Only</SelectItem>
            <SelectItem value="expired">Expired Only</SelectItem>
            <SelectItem value="damaged">Damaged Only</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={fetchMovements} variant="outline" size="sm" disabled={loading} className="hover:bg-primary/10">
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Movements Table */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Stock Movements
            <Badge variant="secondary" className="ml-2">
              {movements.length} records
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8">Loading movements...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Created By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="text-sm">
                        {new Date(movement.created_at).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {new Date(movement.created_at).toLocaleTimeString()}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{movement.product?.name || "Unknown"}</TableCell>
                      <TableCell>
                        <Badge className={getMovementColor(movement.movement_type)}>
                          {getMovementIcon(movement.movement_type)}
                          <span className="ml-1">
                            {movement.movement_type.charAt(0).toUpperCase() + movement.movement_type.slice(1)}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {movement.quantity} {movement.product?.unit_type}
                      </TableCell>
                      <TableCell>{formatCurrency(movement.total_value || 0)}</TableCell>
                      <TableCell>{movement.supplier || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">{movement.reason}</TableCell>
                      <TableCell>{movement.created_by}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {movements.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No stock movements found for the selected period
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
