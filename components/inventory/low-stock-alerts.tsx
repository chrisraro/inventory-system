"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, Eye, EyeOff, Package, Wrench } from "lucide-react"
import { useProducts } from "@/hooks/use-products"
import Link from "next/link"

export default function CylinderAlertsComponent() {
  const { products, loading } = useProducts()
  const [showAlerts, setShowAlerts] = useState(true)

  // Get cylinders that need attention
  const alertCylinders = products.filter((product) => 
    ['damaged', 'missing', 'maintenance'].includes(product.status)
  )

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="text-center">Loading cylinder alerts...</div>
        </CardContent>
      </Card>
    )
  }

  if (alertCylinders.length === 0) {
    return (
      <Card className="border-primary/20 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <CardHeader>
          <CardTitle className="flex items-center text-green-700 dark:text-green-400">
            <Package className="h-5 w-5 mr-2" />
            All Cylinders Good
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-600 dark:text-green-300">
            No cylinders require immediate attention.
          </p>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'damaged':
        return "bg-red-100 text-red-800"
      case 'missing':
        return "bg-gray-100 text-gray-800"
      case 'maintenance':
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'damaged':
        return <AlertTriangle className="h-3 w-3 mr-1" />
      case 'missing':
        return <Eye className="h-3 w-3 mr-1" />
      case 'maintenance':
        return <Wrench className="h-3 w-3 mr-1" />
      default:
        return <Package className="h-3 w-3 mr-1" />
    }
  }

  const getUrgency = (status: string) => {
    switch (status) {
      case 'damaged':
        return { level: "critical", label: "Needs Repair" }
      case 'missing':
        return { level: "high", label: "Missing" }
      case 'maintenance':
        return { level: "medium", label: "Maintenance Due" }
      default:
        return { level: "low", label: "Unknown" }
    }
  }

  return (
    <Card className="border-destructive/20 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center text-destructive">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Cylinder Alerts ({alertCylinders.length})
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
                  <TableHead>Cylinder ID</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertCylinders.map((product) => {
                  const urgency = getUrgency(product.status)

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium font-mono text-sm">{product.id}</TableCell>
                      <TableCell>{product.weight_kg}kg</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(product.status)}>
                          {getStatusIcon(product.status)}
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            urgency.level === "critical" ? "destructive" : 
                            urgency.level === "high" ? "destructive" : "secondary"
                          }
                          className={urgency.level === "critical" ? "animate-pulse" : ""}
                        >
                          {urgency.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/stock-movements?cylinder=${product.id}`}>
                          <Button size="sm" className="bg-primary hover:bg-primary/90">
                            Update Status
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
