"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Package,
  ShoppingCart,
  Wrench,
  AlertTriangle,
  Eye,
  Activity,
  Calendar,
} from "lucide-react"
import { formatCurrency } from "@/lib/currency"

interface Product {
  id: string
  qr_code: string
  weight_kg: number
  status: string
  supplier?: string
  unit_cost: number
}

interface StockMovement {
  id: string
  product_id: string
  from_status: string
  to_status: string
  movement_type: string
  reason?: string
  notes?: string
  reference_number?: string
  movement_date: string
  created_by: string
  products_simplified: Product
}

interface StockMovementsDashboardProps {
  products: Product[]
  autoRefresh?: boolean
}

export default function StockMovementsDashboard({ products, autoRefresh = true }: StockMovementsDashboardProps) {
  const [movements, setMovements] = useState<StockMovement[]>([])
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
      const queryParams = new URLSearchParams()
      if (filter && filter !== 'all') queryParams.set('status', filter)
      
      const response = await fetch(`/api/stock-movements/simplified?${queryParams}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch movements')
      }
      
      const { movements } = await response.json()
      
      // Filter by time range
      const daysAgo = new Date()
      daysAgo.setDate(daysAgo.getDate() - Number.parseInt(timeRange))
      
      const filteredMovements = (movements || []).filter((movement: StockMovement) => 
        new Date(movement.movement_date) >= daysAgo
      )
      
      setMovements(filteredMovements)
    } catch (error) {
      console.error("Error fetching movements:", error)
      setMovements([])
    } finally {
      setLoading(false)
    }
  }

  const getMovementStats = () => {
    const stats = {
      available: { count: 0, value: 0 },
      sold: { count: 0, value: 0 },
      maintenance: { count: 0, value: 0 },
      damaged: { count: 0, value: 0 },
      missing: { count: 0, value: 0 }
    }

    movements.forEach((movement) => {
      if (stats[movement.to_status as keyof typeof stats]) {
        stats[movement.to_status as keyof typeof stats].count++
        stats[movement.to_status as keyof typeof stats].value += movement.products_simplified?.unit_cost || 0
      }
    })

    return stats
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "sale":
      case "status_change":
        return <ShoppingCart className="h-4 w-4 text-blue-600" />
      case "maintenance":
        return <Wrench className="h-4 w-4 text-yellow-600" />
      case "damage":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "found":
        return <Eye className="h-4 w-4 text-green-600" />
      case "lost":
        return <Eye className="h-4 w-4 text-gray-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  const getMovementColor = (type: string) => {
    switch (type) {
      case "sale":
      case "status_change":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "damage":
        return "bg-red-100 text-red-800 border-red-200"
      case "found":
        return "bg-green-100 text-green-800 border-green-200"
      case "lost":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { color: "bg-green-100 text-green-800", icon: Package },
      sold: { color: "bg-blue-100 text-blue-800", icon: ShoppingCart },
      maintenance: { color: "bg-yellow-100 text-yellow-800", icon: Wrench },
      damaged: { color: "bg-red-100 text-red-800", icon: AlertTriangle },
      missing: { color: "bg-gray-100 text-gray-800", icon: Eye },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.available
    const Icon = config.icon

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const stats = getMovementStats()

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Sold Cylinders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.sold.count}</div>
            <p className="text-xs text-blue-600">Value: {formatCurrency(stats.sold.value)}</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Available Cylinders</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats.available.count}</div>
            <p className="text-xs text-green-600">Value: {formatCurrency(stats.available.value)}</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{stats.maintenance.count}</div>
            <p className="text-xs text-yellow-600">Value: {formatCurrency(stats.maintenance.value)}</p>
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
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="damaged">Damaged</SelectItem>
            <SelectItem value="missing">Missing</SelectItem>
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
            Cylinder Status Changes
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
                    <TableHead>Cylinder ID</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>From Status</TableHead>
                    <TableHead>To Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="text-sm">
                        {new Date(movement.movement_date).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {new Date(movement.movement_date).toLocaleTimeString()}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium font-mono text-sm">
                        {movement.products_simplified?.id || movement.product_id}
                      </TableCell>
                      <TableCell>
                        {movement.products_simplified?.weight_kg}kg
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(movement.from_status)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(movement.to_status)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getMovementColor(movement.movement_type)}>
                          {getMovementIcon(movement.movement_type)}
                          <span className="ml-1">
                            {movement.movement_type.charAt(0).toUpperCase() + movement.movement_type.slice(1)}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{movement.reason || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {movements.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No cylinder movements found for the selected period
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
