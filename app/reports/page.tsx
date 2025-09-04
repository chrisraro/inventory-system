"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, Calendar, TrendingUp, TrendingDown, Activity, FileText } from "lucide-react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import ProtectedRoute from "@/components/auth/protected-route"
import { formatCurrency } from "@/lib/currency"
import { useProducts } from "@/hooks/use-products"

interface ReportData {
  totalProducts: number
  totalValue: number
  lowStockItems: number
  outOfStockItems: number
  recentActivity: Array<{
    id: string
    name: string
    action: string
    quantity_change: number
    value_change: number
    date: string
  }>
}

export default function ReportsPage() {
  const { products, loading } = useProducts()
  const [reportData, setReportData] = useState<ReportData>({
    totalProducts: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    recentActivity: [],
  })
  const [filterMode, setFilterMode] = useState<"month" | "year" | "custom">("month")
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  useEffect(() => {
    if (!loading && products.length > 0) {
      generateReportData()
    }
  }, [products, loading, filterMode, selectedMonth, selectedYear, fromDate, toDate])

  const generateReportData = () => {
    const totalProducts = products.length
    const totalValue = products.reduce((sum, product) => sum + product.quantity * product.unit_cost, 0)
    const lowStockItems = products.filter((product) => product.quantity <= product.min_threshold).length
    const outOfStockItems = products.filter((product) => product.quantity === 0).length

    // Generate mock activity data
    const recentActivity = products.slice(0, 10).map((product, index) => ({
      id: product.id,
              name: product.name,
      action: index % 3 === 0 ? "added" : index % 3 === 1 ? "updated" : "stock_movement",
      quantity_change: Math.floor(Math.random() * 20) - 10,
              value_change: (Math.floor(Math.random() * 20) - 10) * product.unit_cost,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    }))

    setReportData({
      totalProducts,
      totalValue,
      lowStockItems,
      outOfStockItems,
      recentActivity,
    })
  }

  const exportToCSV = () => {
    const headers = ["Product Name", "Unit Type", "Quantity", "Price per Unit", "Total Value", "Supplier", "Status"]
    const csvData = products.map((product) => [
              product.name,
      product.unit_type,
      product.quantity,
              product.unit_cost,
              product.quantity * product.unit_cost,
      product.supplier || "N/A",
      product.quantity === 0
        ? "Out of Stock"
        : product.quantity <= product.min_threshold
          ? "Low Stock"
          : "In Stock",
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `petrogreen-inventory-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <ProtectedRoute permission="view_reports">
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-blue-900">Reports</h1>
                <p className="text-gray-600">LPG inventory analytics and insights</p>
              </div>
            </div>
            <Button onClick={exportToCSV} disabled={products.length === 0} className="bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Date Filters */}
          <Card className="border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
              <CardTitle className="flex items-center text-blue-900">
                <Calendar className="h-5 w-5 mr-2" />
                Report Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <Button
                    variant={filterMode === "month" ? "default" : "outline"}
                    onClick={() => setFilterMode("month")}
                    className={filterMode === "month" ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    By Month
                  </Button>
                  <Button
                    variant={filterMode === "year" ? "default" : "outline"}
                    onClick={() => setFilterMode("year")}
                    className={filterMode === "year" ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    By Year
                  </Button>
                  <Button
                    variant={filterMode === "custom" ? "default" : "outline"}
                    onClick={() => setFilterMode("custom")}
                    className={filterMode === "custom" ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    Custom Range
                  </Button>
                </div>

                {filterMode === "month" && (
                  <div className="flex gap-4">
                    <div className="space-y-2">
                      <Label>Month</Label>
                      <Select
                        value={selectedMonth.toString()}
                        onValueChange={(value) => setSelectedMonth(Number.parseInt(value))}
                      >
                        <SelectTrigger className="w-40 border-blue-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month, index) => (
                            <SelectItem key={month} value={(index + 1).toString()}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Select
                        value={selectedYear.toString()}
                        onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
                      >
                        <SelectTrigger className="w-32 border-blue-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {filterMode === "year" && (
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select
                      value={selectedYear.toString()}
                      onValueChange={(value) => setSelectedYear(Number.parseInt(value))}
                    >
                      <SelectTrigger className="w-32 border-blue-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {filterMode === "custom" && (
                  <div className="flex gap-4">
                    <div className="space-y-2">
                      <Label>From Date</Label>
                      <Input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="border-blue-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>To Date</Label>
                      <Input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="border-blue-200"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalProducts}</div>
                <p className="text-xs text-gray-600">Active inventory items</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportData.totalValue)}</div>
                <p className="text-xs text-gray-600">Current inventory value</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                <TrendingDown className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{reportData.lowStockItems}</div>
                <p className="text-xs text-gray-600">Need restocking</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{reportData.outOfStockItems}</div>
                <p className="text-xs text-gray-600">Urgent restocking needed</p>
              </CardContent>
            </Card>
          </div>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading reports...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Quantity Change</TableHead>
                        <TableHead>Value Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.recentActivity.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell>{new Date(activity.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{activity.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                activity.action === "added"
                                  ? "default"
                                  : activity.action === "updated"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {activity.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={activity.quantity_change > 0 ? "text-green-600" : "text-red-600"}>
                              {activity.quantity_change > 0 ? "+" : ""}
                              {activity.quantity_change}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={activity.value_change > 0 ? "text-green-600" : "text-red-600"}>
                              {formatCurrency(activity.value_change)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {reportData.recentActivity.length === 0 && (
                    <div className="text-center py-8 text-gray-600">No recent activity found</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
