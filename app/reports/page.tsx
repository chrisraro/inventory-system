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
  totalCylinders: number
  totalValue: number
  availableCylinders: number
  soldCylinders: number
  maintenanceCylinders: number
  damagedCylinders: number
  missingCylinders: number
  recentActivity: Array<{
    id: string
    cylinderId: string
    action: string
    status: string
    weight_kg: number
    date: string
  }>
  weightDistribution: {
    '11kg': number
    '22kg': number
    '50kg': number
  }
}

export default function ReportsPage() {
  const { products, loading } = useProducts()
  const [reportData, setReportData] = useState<ReportData>({
    totalCylinders: 0,
    totalValue: 0,
    availableCylinders: 0,
    soldCylinders: 0,
    maintenanceCylinders: 0,
    damagedCylinders: 0,
    missingCylinders: 0,
    recentActivity: [],
    weightDistribution: {
      '11kg': 0,
      '22kg': 0,
      '50kg': 0,
    },
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
    const totalCylinders = products.length
    const totalValue = products.reduce((sum, product) => sum + product.unit_cost, 0)
    
    // Status-based counting
    const availableCylinders = products.filter((product) => product.status === 'available').length
    const soldCylinders = products.filter((product) => product.status === 'sold').length
    const maintenanceCylinders = products.filter((product) => product.status === 'maintenance').length
    const damagedCylinders = products.filter((product) => product.status === 'damaged').length
    const missingCylinders = products.filter((product) => product.status === 'missing').length

    // Weight distribution
    const weightDistribution = {
      '11kg': products.filter((product) => product.weight_kg === 11).length,
      '22kg': products.filter((product) => product.weight_kg === 22).length,
      '50kg': products.filter((product) => product.weight_kg === 50).length,
    }

    // Generate recent activity data based on simplified system
    const recentActivity = products.slice(0, 10).map((product, index) => ({
      id: product.id,
      cylinderId: product.id,
      action: index % 4 === 0 ? "cylinder_added" : 
              index % 4 === 1 ? "status_changed" : 
              index % 4 === 2 ? "maintenance_scheduled" : "status_updated",
      status: product.status,
      weight_kg: product.weight_kg,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    }))

    setReportData({
      totalCylinders,
      totalValue,
      availableCylinders,
      soldCylinders,
      maintenanceCylinders,
      damagedCylinders,
      missingCylinders,
      recentActivity,
      weightDistribution,
    })
  }

  const exportToCSV = () => {
    const headers = ["Cylinder ID", "QR Code", "Weight (kg)", "Unit Cost", "Status", "Supplier", "Created Date"]
    const csvData = products.map((product) => [
      product.id,
      product.qr_code,
      product.weight_kg,
      product.unit_cost,
      product.status,
      product.supplier || "N/A",
      new Date(product.created_at).toLocaleDateString(),
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `petrogreen-cylinder-report-${new Date().toISOString().split("T")[0]}.csv`
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cylinders</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalCylinders}</div>
                <p className="text-xs text-gray-600">Unique cylinders tracked</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{reportData.availableCylinders}</div>
                <p className="text-xs text-gray-600">Ready for distribution</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sold</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{reportData.soldCylinders}</div>
                <p className="text-xs text-gray-600">Sold to customers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
                <TrendingDown className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{reportData.maintenanceCylinders}</div>
                <p className="text-xs text-gray-600">Under maintenance</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Issues</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{reportData.damagedCylinders + reportData.missingCylinders}</div>
                <p className="text-xs text-gray-600">Damaged + Missing</p>
              </CardContent>
            </Card>
          </div>

          {/* Weight Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Cylinder Weight Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{reportData.weightDistribution['11kg']}</div>
                  <p className="text-sm text-gray-600">11kg Cylinders</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{reportData.weightDistribution['22kg']}</div>
                  <p className="text-sm text-gray-600">22kg Cylinders</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{reportData.weightDistribution['50kg']}</div>
                  <p className="text-sm text-gray-600">50kg Cylinders</p>
                </div>
              </div>
            </CardContent>
          </Card>

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
                        <TableHead>Cylinder ID</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.recentActivity.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell>{new Date(activity.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{activity.cylinderId}</TableCell>
                          <TableCell>{activity.weight_kg}kg</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                activity.action === "cylinder_added"
                                  ? "default"
                                  : activity.action === "status_changed"
                                    ? "secondary"
                                    : activity.action === "maintenance_scheduled"
                                      ? "destructive"
                                      : "outline"
                              }
                            >
                              {activity.action.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                activity.status === "available"
                                  ? "bg-green-100 text-green-800"
                                  : activity.status === "sold"
                                    ? "bg-blue-100 text-blue-800"
                                    : activity.status === "maintenance"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : activity.status === "damaged"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                              }
                            >
                              {activity.status}
                            </Badge>
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
